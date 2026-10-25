import type { Difficulty } from "@/lib/types";

/**
 * Prompts live in a versioned file, not inline strings, so changes are reviewed
 * and rollback is trivial (ai-features-in-production skill).
 */
export const PROMPT_VERSION = "quiz-v1";

export const SYSTEM_PROMPT =
  "You are a quiz generator. You must respond with valid JSON only, no markdown, no commentary outside the JSON.";

const DIFFICULTY_GUIDANCE: Record<Difficulty, string> = {
  easy: "easy difficulty: recall and definition level, answers directly stated in the text",
  medium:
    "medium difficulty: understanding and relationships, requiring the reader to connect ideas from the text",
  hard: "hard difficulty: analysis and application, requiring the reader to reason beyond the literal text",
};

/**
 * Truncation budget. Groq's context is far larger than this; the cap protects
 * latency and tokens-per-minute limits on the free tier (~4 chars/token).
 */
export const MAX_TEXT_CHARS = 24_000;

export function truncateForModel(text: string): string {
  if (text.length <= MAX_TEXT_CHARS) return text;
  // Cut on a word boundary so the model never receives a clipped token.
  return `${text.slice(0, MAX_TEXT_CHARS).replace(/\s+\S*$/, "")}…`;
}

const JSON_CONTRACT = `Return a single JSON object of exactly this shape:
{
  "questions": [
    {
      "question_text": "string — the full question",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_answer": "must be identical, character for character, to one of the four options",
      "explanation": "one or two sentences explaining why the correct answer is right"
    }
  ]
}
The object must contain exactly 10 question objects. Every question has exactly 4 distinct, plausible options.`;

export function buildUserPrompt(
  extractedText: string,
  difficulty: Difficulty,
  strict = false,
): string {
  const strictness = strict
    ? "Your previous response was not valid JSON or failed the schema. Output ONLY the JSON object. No code fences, no prefix, no trailing text. correct_answer must exactly match one entry of options."
    : "";

  return `Given the following text, generate exactly 10 multiple-choice questions at ${DIFFICULTY_GUIDANCE[difficulty]}.

${JSON_CONTRACT}
${strictness}

Text:
"""
${extractedText}
"""`;
}
