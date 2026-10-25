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

const MODEL_TIMEOUT_MS = 45_000;
const MAX_TOKENS = 2_500;
// Short in-request backoff before switching models. Free-tier windows reset
// every minute; we keep this small to stay inside the function timeout.
const BACKOFF_MS = 2_500;
const MAX_BACKOFF_MS = 5_000;

interface CallOptions {
  model: string;
  text: string;
  difficulty: Difficulty;
  strict: boolean;
}

async function callModel({ model, text, difficulty, strict }: CallOptions) {
  const client = getGroqClient();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), MODEL_TIMEOUT_MS);

  try {
    return await client.chat.completions.create(
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
      { signal: controller.signal },
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Generation policy for the Groq free tier:
 *  attempt 1  primary model (70B), normal prompt
 *  attempt 2  primary model, strict prompt (only when the JSON was malformed)
 *  attempt 3  fallback model (8B instant — separate, higher TPM allowance)
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

  for (let attempt = 0; attempt < 3; attempt++) {
    let content: string | null | undefined;
    try {
      const completion = await callModel({ model, text: extractedText, difficulty, strict });
      content = completion.choices[0]?.message?.content;
    } catch (error) {
      const failure = classifyGroqError(error);
      lastFailure = failure;
      console.error(
        `[groq] ${failure.kind} on ${model} (attempt ${attempt + 1}):`,
        failure.message,
      );

      if (failure.status === 429) {
        if (model === PRIMARY_MODEL) {
          const wait = Math.min(
            (failure.retryAfterSeconds ?? BACKOFF_MS / 1000) * 1000,
            MAX_BACKOFF_MS,
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

  console.error("[groq] malformed output after all attempts:", lastFailure?.message);
  throw new QuizGenerationError(
    "AI_MALFORMED_OUTPUT",
    "The model returned an unusable quiz. Please try generating again.",
  );
}
