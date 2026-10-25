import type { GeneratedQuestion, Difficulty } from "@/lib/types";
import { getGroqClient, PRIMARY_MODEL, FALLBACK_MODEL } from "@/lib/groq/client";
import {
  PROMPT_VERSION,
  SYSTEM_PROMPT,
  buildUserPrompt,
  truncateForModel,
} from "@/lib/groq/prompts";
import { parseQuizResponse } from "@/lib/quiz/parser";
import { classifyGroqError, sleep, type ClassifiedFailure } from "@/lib/groq/errors";
import { createDeadline } from "@/lib/groq/deadline";
import type { ApiErrorCode } from "@/lib/types";

export class QuizGenerationError extends Error {
  constructor(
    public code: Extract<
      ApiErrorCode,
      "RATE_LIMITED" | "AI_UNAVAILABLE" | "AI_MALFORMED_OUTPUT"
    >,
    message: string,
    public retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = "QuizGenerationError";
  }
}

const MODEL_TIMEOUT_MS = 20_000;
const MAX_TOKENS = 2_500;
// Hard ceiling for the whole attempt sequence. The route's maxDuration is
// 60s; this leaves headroom for PDF extraction and the two Supabase inserts
// so the function always answers JSON instead of being killed into a 504.
// Read at call time so tests can shrink the budget via
// GROQ_GENERATION_BUDGET_MS; production always falls back to the 50s default.
const DEFAULT_GENERATION_BUDGET_MS = 50_000;
// Short in-request backoff before switching models. Free-tier windows reset
// every minute; we keep this small to stay inside the function timeout.
const BACKOFF_MS = 2_500;
const MAX_BACKOFF_MS = 5_000;
// Tests override the backoff through GROQ_BACKOFF_MS to stay fast and
// deterministic; production uses the 2.5s default above.
const backoffMs = () => Number(process.env.GROQ_BACKOFF_MS) || BACKOFF_MS;

interface CallOptions {
  model: string;
  text: string;
  difficulty: Difficulty;
  strict: boolean;
  signal: AbortSignal;
}

async function callModel({ model, text, difficulty, strict, signal }: CallOptions) {
  const client = getGroqClient();

  return client.chat.completions.create(
    {
      model,
      temperature: 0.7,
      max_tokens: MAX_TOKENS,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: buildUserPrompt(truncateForModel(text), difficulty, strict),
        },
      ],
    },
    { signal },
  );
}

/**
 * Generation policy for the Groq free tier:
 *  attempt 1  primary model (gpt-oss-120b), normal prompt
 *  attempt 2  primary model, strict prompt (only when the JSON was malformed)
 *  attempt 3  fallback model (gpt-oss-20b — separate, higher TPM allowance)
 *  - 429 on the primary → short backoff, then fallback model
 *  - timeout on the primary → fallback model immediately
 *  - 429 on the fallback → precise RATE_LIMITED error (token vs request vs quota)
 *  - malformed JSON after all attempts → AI_MALFORMED_OUTPUT
 */
export async function generateQuestions(
  extractedText: string,
  difficulty: Difficulty,
): Promise<GeneratedQuestion[]> {
  let model = PRIMARY_MODEL;
  let strict = false;
  let lastFailure: ClassifiedFailure | null = null;

  // One budget for every attempt: when it fires we answer with JSON instead
  // of letting the platform kill the function into an unexplained 504.
  const budgetMs = Number(process.env.GROQ_GENERATION_BUDGET_MS) || DEFAULT_GENERATION_BUDGET_MS;
  const deadline = createDeadline(budgetMs, "groq generation");

  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (deadline.exceeded) break;

      let content: string | null | undefined;
      try {
        // Per-call timeout, never longer than what the overall budget allows.
        const perCall = new AbortController();
        const perCallTimer = setTimeout(
          () => perCall.abort(),
          Math.min(MODEL_TIMEOUT_MS, deadline.remainingMs),
        );
        const combinedSignal = AbortSignal.any([perCall.signal, deadline.signal]);

        let completion;
        try {
          completion = await callModel({
            model,
            text: extractedText,
            difficulty,
            strict,
            signal: combinedSignal,
          });
        } finally {
          clearTimeout(perCallTimer);
        }
        content = completion.choices[0]?.message?.content;
      } catch (error) {
        if (deadline.exceeded) {
          console.error(`[groq] total budget exhausted on ${model} (attempt ${attempt + 1})`);
          throw new QuizGenerationError(
            "AI_UNAVAILABLE",
            "The model took too long to respond. Please try again.",
          );
        }

        const failure = classifyGroqError(error);
        lastFailure = failure;
        console.error(
          `[groq] ${failure.kind} on ${model} (attempt ${attempt + 1}):`,
          failure.message,
        );

        if (failure.status === 429) {
          if (model === PRIMARY_MODEL) {
            const wait = Math.min(
              (failure.retryAfterSeconds ?? backoffMs() / 1000) * 1000,
              MAX_BACKOFF_MS,
              deadline.remainingMs,
            );
            await sleep(wait);
            model = FALLBACK_MODEL;
            continue;
          }
          throw new QuizGenerationError("RATE_LIMITED", failure.message, failure.retryAfterSeconds);
        }

        if (failure.kind === "timeout") {
          if (model === PRIMARY_MODEL) {
            model = FALLBACK_MODEL;
            continue;
          }
          throw new QuizGenerationError("AI_UNAVAILABLE", failure.message);
        }

        // Bad key or any other transport/API failure — no point retrying blindly.
        throw new QuizGenerationError("AI_UNAVAILABLE", failure.message);
      }

      if (!content) {
        strict = true;
        if (model === PRIMARY_MODEL && attempt >= 1) model = FALLBACK_MODEL;
        continue;
      }

      const parsed = parseQuizResponse(content);
      if (parsed.ok) {
        console.info(
          `[groq] prompt=${PROMPT_VERSION} model=${model} attempt=${attempt + 1} questions=10`,
        );
        return parsed.questions;
      }

      lastFailure = {
        kind: "other",
        status: undefined,
        retryAfterSeconds: null,
        message: parsed.reason,
      };
      strict = true;
      if (model === PRIMARY_MODEL && attempt >= 1) model = FALLBACK_MODEL;
    }
  } finally {
    deadline.cancel();
  }

  if (deadline.exceeded) {
    console.error("[groq] gave up after total budget:", lastFailure?.message);
    throw new QuizGenerationError(
      "AI_UNAVAILABLE",
      "The model took too long to respond. Please try again.",
    );
  }

  console.error("[groq] malformed output after all attempts:", lastFailure?.message);
  throw new QuizGenerationError(
    "AI_MALFORMED_OUTPUT",
    "The model returned an unusable quiz. Please try generating again.",
  );
}
