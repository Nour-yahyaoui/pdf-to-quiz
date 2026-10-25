import { z } from "zod";
import type { GeneratedQuestion } from "@/lib/types";

/**
 * Model output is untrusted input (ai-features-in-production skill): it is parsed
 * defensively and validated against a schema before anything touches the database.
 */

export const generatedQuestionSchema = z
  .object({
    question_text: z.string().trim().min(10).max(500),
    options: z.array(z.string().trim().min(1).max(300)).length(4),
    correct_answer: z.string().trim().min(1).max(300),
    explanation: z.string().trim().min(5).max(600),
  })
  .superRefine((question, ctx) => {
    if (!question.options.includes(question.correct_answer)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["correct_answer"],
        message: "correct_answer must match one of the options exactly",
      });
    }
    if (new Set(question.options).size !== 4) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["options"],
        message: "the four options must be distinct",
      });
    }
  });

const generatedQuizSchema = z.object({
  questions: z.array(generatedQuestionSchema).length(10),
});

export type ParseResult =
  | { ok: true; questions: GeneratedQuestion[] }
  | { ok: false; reason: string };

/** Strip a ```json fence if the model ignored the JSON-only instruction. */
function unfence(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? raw).trim();
}

export function parseQuizResponse(raw: string): ParseResult {
  let candidate: unknown;
  try {
    candidate = JSON.parse(unfence(raw));
  } catch {
    return { ok: false, reason: "response was not valid JSON" };
  }

  // Accept both { questions: [...] } and a bare top-level array.
  const payload = Array.isArray(candidate) ? { questions: candidate } : candidate;
  const result = generatedQuizSchema.safeParse(payload);

  if (!result.success) {
    return {
      ok: false,
      reason: result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .slice(0, 3)
        .join("; "),
    };
  }

  return {
    ok: true,
    questions: result.data.questions.map((q) => ({
      question_text: q.question_text,
      options: q.options as [string, string, string, string],
      correct_answer: q.correct_answer,
      explanation: q.explanation,
    })),
  };
}
