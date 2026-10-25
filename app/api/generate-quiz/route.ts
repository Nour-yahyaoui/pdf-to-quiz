import { createClient } from "@/lib/supabase/server";
import { apiError, newCorrelationId, okJson } from "@/lib/api-utils";
import { difficultySchema, MAX_PDF_BYTES } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { extractPdfText, isPdfBytes } from "@/lib/pdf/extract";
import { generateQuestions, QuizGenerationError } from "@/lib/groq/generate-questions";
import type { ApiErrorCode } from "@/lib/types";

// pdf-parse requires the Node runtime; never the Edge sandbox.
export const runtime = "nodejs";
export const maxDuration = 60;

// Per-user generation guard (in-process; the DB quota below is the shared one).
const PER_MINUTE_LIMIT = 8;
// Hard daily cap protecting the Groq free-tier budget (api-abuse-defense skill).
const DAILY_QUOTA = 20;

export async function POST(request: Request) {
  const correlationId = newCorrelationId();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return apiError("UNAUTHENTICATED", "Sign in to generate a quiz.", correlationId);
  }

  const ip = getClientIp(request.headers);
  const limit = rateLimit(
    `generate:${user.id}:${ip}`,
    PER_MINUTE_LIMIT,
    60 * 1000,
  );
  if (!limit.allowed) {
    return apiError(
      "RATE_LIMITED",
      "Too many requests, try again in 30 seconds.",
      correlationId,
    );
  }

  // Shared, durable daily quota: count today's quizzes for this user.
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { count: todayCount } = await supabase
    .from("quizzes")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfDay.toISOString());

  if ((todayCount ?? 0) >= DAILY_QUOTA) {
    return apiError(
      "RATE_LIMITED",
      `Daily limit of ${DAILY_QUOTA} quizzes reached. Come back tomorrow.`,
      correlationId,
    );
  }

  // ---- Validate the multipart payload at the door -------------------------
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return apiError("VALIDATION_ERROR", "Expected multipart form data.", correlationId);
  }

  const difficultyResult = difficultySchema.safeParse(form.get("difficulty"));
  if (!difficultyResult.success) {
    return apiError("VALIDATION_ERROR", "Choose a valid difficulty.", correlationId);
  }

  const file = form.get("pdf");
  if (!(file instanceof File)) {
    return apiError("VALIDATION_ERROR", "A PDF file is required.", correlationId);
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return apiError("INVALID_FILE_TYPE", "Only PDF documents are accepted.", correlationId);
  }
  if (file.size === 0) {
    return apiError("VALIDATION_ERROR", "The uploaded file is empty.", correlationId);
  }
  // Server-side 5 MB enforcement — the client check is convenience, not trust.
  if (file.size > MAX_PDF_BYTES) {
    return apiError("FILE_TOO_LARGE", "File too large. Maximum size is 5MB.", correlationId);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!isPdfBytes(bytes)) {
    return apiError(
      "INVALID_FILE_TYPE",
      "The file is not a valid PDF document.",
      correlationId,
    );
  }

  // ---- Extract text in memory; the PDF is never stored --------------------
  let extractedText: string;
  try {
    extractedText = await extractPdfText(bytes);
  } catch (error) {
    console.error(`[${correlationId}] pdf parse failed:`, error);
    return apiError(
      "VALIDATION_ERROR",
      "The PDF could not be read. It may be scanned images or corrupted.",
      correlationId,
    );
  }

  if (extractedText.length < 100) {
    return apiError(
      "EMPTY_PDF",
      "This PDF contains too little readable text to build a quiz.",
      correlationId,
    );
  }

  // ---- AI generation (typed errors, retries live in the library) ----------
  let questions;
  try {
    questions = await generateQuestions(extractedText, difficultyResult.data);
  } catch (error) {
    if (error instanceof QuizGenerationError) {
      return apiError(error.code as ApiErrorCode, error.message, correlationId);
    }
    console.error(`[${correlationId}] unexpected generation error:`, error);
    return apiError(
      "AI_UNAVAILABLE",
      "The quiz service is temporarily unavailable. Please try again.",
      correlationId,
    );
  }

  // ---- Persist through the RLS client — never a service-role bypass --------
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
      user_id: user.id,
      pdf_name: file.name,
      difficulty: difficultyResult.data,
    })
    .select("id")
    .single();

  if (quizError || !quiz) {
    console.error(`[${correlationId}] quiz insert failed:`, quizError?.message);
    return apiError("INTERNAL_ERROR", "Could not save the quiz.", correlationId);
  }

  const { error: questionsError } = await supabase.from("questions").insert(
    questions.map((question, index) => ({
      quiz_id: quiz.id,
      question_text: question.question_text,
      options: question.options,
      correct_answer: question.correct_answer,
      explanation: question.explanation,
      order_index: index,
    })),
  );

  if (questionsError) {
    console.error(`[${correlationId}] question insert failed:`, questionsError.message);
    // Roll back the orphan quiz so no empty exam sheet remains.
    await supabase.from("quizzes").delete().eq("id", quiz.id);
    return apiError("INTERNAL_ERROR", "Could not save the questions.", correlationId);
  }

  return okJson({ quizId: quiz.id });
}
