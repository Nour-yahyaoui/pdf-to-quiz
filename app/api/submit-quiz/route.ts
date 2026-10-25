import { createClient } from "@/lib/supabase/server";
import { apiError, newCorrelationId, okJson } from "@/lib/api-utils";
import { submitQuizSchema } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { scoreAttempt } from "@/lib/quiz/scoring";
import type { QuestionRow } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const correlationId = newCorrelationId();

  const limit = rateLimit(
    `submit:${getClientIp(request.headers)}`,
    30,
    60 * 1000,
  );
  if (!limit.allowed) {
    return apiError(
      "RATE_LIMITED",
      "Too many requests, try again in 30 seconds.",
      correlationId,
      limit.retryAfterSeconds,
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = submitQuizSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", "Invalid submission payload.", correlationId);
  }
  const { quizId, answers } = parsed.data;

  const supabase = await createClient();

  // RLS allows public reads; a missing or unknown UUID is a 404.
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("id")
    .eq("id", quizId)
    .maybeSingle();

  if (quizError || !quiz) {
    return apiError("NOT_FOUND", "This quiz does not exist.", correlationId);
  }

  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("id, quiz_id, question_text, options, correct_answer, explanation, order_index")
    .eq("quiz_id", quizId)
    .order("order_index", { ascending: true });

  if (questionsError || !questions || questions.length === 0) {
    console.error(`[${correlationId}] questions load failed:`, questionsError?.message);
    return apiError("NOT_FOUND", "This quiz has no questions.", correlationId);
  }

  if (answers.length !== questions.length) {
    return apiError(
      "VALIDATION_ERROR",
      `Expected ${questions.length} answers, received ${answers.length}.`,
      correlationId,
    );
  }

  const { score, total, results } = scoreAttempt(
    questions as QuestionRow[],
    answers.map((answer) => answer ?? null),
  );

  const { data: attempt, error: attemptError } = await supabase
    .from("attempts")
    .insert({
      quiz_id: quizId,
      score,
      total_questions: total,
      answers,
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    console.error(`[${correlationId}] attempt insert failed:`, attemptError?.message);
    return apiError("INTERNAL_ERROR", "Your attempt could not be saved.", correlationId);
  }

  return okJson({
    attemptId: attempt.id,
    score,
    total,
    results,
  });
}
