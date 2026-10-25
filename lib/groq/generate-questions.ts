import type { GeneratedQuestion, Difficulty } from "@/lib/types";
import { getGroqClient, PRIMARY_MODEL, FALLBACK_MODEL } from "@/lib/groq/client";
import {
  PROMPT_VERSION,
  SYSTEM_PROMPT,
  buildUserPrompt,
  truncateForModel,
} from "@/lib/groq/prompts";
import { parseQuizResponse } from "@/lib/quiz/parser";
import type { ApiErrorCode } from "@/lib/types";

export class QuizGenerationError extends Error {
  constructor(
    public code: Extract<
      ApiErrorCode,
      "RATE_LIMITED" | "AI_UNAVAILABLE" | "AI_MALFORMED_OUTPUT"
    >,
    message: string,
  ) {
    super(message);
    this.name = "QuizGenerationError";
  }
}

const MODEL_TIMEOUT_MS = 45_000;
const MAX_TOKENS = 2_500;

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
 * Full generation policy:
 *  1. primary model, normal prompt
 *  2. on 429 → fallback model once (free-tier protection)
 *  3. on malformed JSON → ONE retry with the stricter prompt
 *  4. timeout → one retry on the fallback model
 * Everything else surfaces as a typed, user-safe error.
 */
export async function generateQuestions(
  extractedText: string,
  difficulty: Difficulty,
): Promise<GeneratedQuestion[]> {
  let model = PRIMARY_MODEL;
  let strict = false;
  let lastFailure = "unknown failure";

  for (let attempt = 0; attempt < 2; attempt++) {
    let content: string | null | undefined;
    try {
      const completion = await callModel({
        model,
        text: extractedText,
        difficulty,
        strict,
      });
      content = completion.choices[0]?.message?.content;
    } catch (error) {
      const status =
        typeof error === "object" && error !== null && "status" in error
          ? (error as { status?: number }).status
          : undefined;

      if (status === 429 && model === PRIMARY_MODEL) {
        model = FALLBACK_MODEL;
        lastFailure = "primary model rate limited";
        continue;
      }

      if (
        error instanceof Error &&
        error.name === "AbortError" &&
        model === PRIMARY_MODEL
      ) {
        model = FALLBACK_MODEL;
        lastFailure = "primary model timed out";
        continue;
      }

      if (status === 429) {
        throw new QuizGenerationError(
          "RATE_LIMITED",
          "Too many requests, try again in 30 seconds.",
        );
      }
      console.error("[groq] request failed:", error);
      throw new QuizGenerationError(
        "AI_UNAVAILABLE",
        "The quiz service is temporarily unavailable. Please try again.",
      );
    }

    if (!content) {
      lastFailure = "empty model response";
      strict = true;
      continue;
    }

    const parsed = parseQuizResponse(content);
    if (parsed.ok) {
      console.info(
        `[groq] prompt=${PROMPT_VERSION} model=${model} attempt=${attempt + 1} questions=10`,
      );
      return parsed.questions;
    }

    lastFailure = parsed.reason;
    strict = true;
  }

  console.error("[groq] malformed output after retry:", lastFailure);
  throw new QuizGenerationError(
    "AI_MALFORMED_OUTPUT",
    "The model returned an unusable quiz. Please try generating again.",
  );
}
