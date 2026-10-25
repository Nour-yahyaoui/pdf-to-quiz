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

// Anonymous IP-based guards (no accounts). In-memory windows are
// defense-in-depth; Vercel/WAF limits provide the shared-instance layer.
const PER_MINUTE_LIMIT = 8;
const PER_HOUR_LIMIT = 30;

export async function POST(request: Request) {
  const correlationId = newCorrelationId();

  // Catch-all so an unexpected failure (configuration, client creation, a
  // third-party throwing outside an inner guard) never becomes an opaque
  // empty 500 — the client always receives a correlated JSON error.
  try {
    return await handlePost(request, correlationId);
  } catch (error) {
    console.error(`[${correlationId}] unhandled generate-quiz error:`, error);
    return apiError(
      "INTERNAL_ERROR",
      "Something went wrong while building your quiz. Please try again.",
      correlationId,
    );
  }
}

async function handlePost(request: Request, correlationId: string) {
  const ip = getClientIp(request.headers);

  const minute = rateLimit(`generate:min:${ip}`, PER_MINUTE_LIMIT, 60 * 1000);
  if (!minute.allowed) {
    return apiError(
      "RATE_LIMITED",
      "Too many requests, try again in 30 seconds.",
      correlationId,
      minute.retryAfterSeconds,
    );
  }
  const hour = rateLimit(`generate:hour:${ip}`, PER_HOUR_LIMIT, 60 * 60 * 1000);
  if (!hour.allowed) {
    return apiError(
      "RATE_LIMITED",
      "Hourly generation limit reached. Please try again later.",
      correlationId,
      hour.retryAfterSeconds,
    );
  }

  const supabase = await createClient();

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
  // Server-side 4.5 MB enforcement — the client check is convenience, not trust.
  if (file.size > MAX_PDF_BYTES) {
    return apiError("FILE_TOO_LARGE", "File too large. Maximum size is 4.5MB.", correlationId);
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
      return apiError(
        error.code as ApiErrorCode,
        error.message,
        correlationId,
        error.retryAfterSeconds,
      );
    }
    console.error(`[${correlationId}] unexpected generation error:`, error);
    return apiError(
      "AI_UNAVAILABLE",
      "The quiz service is temporarily unavailable. Please try again.",
      correlationId,
    );
  }

  // ---- Persist anonymously through the RLS client (write-once rows) --------
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .insert({
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
    // Without delete RLS policies the orphan row cannot be removed client-side;
    // log with correlation id so it can be cleaned via a maintenance script.
    return apiError("INTERNAL_ERROR", "Could not save the questions.", correlationId);
  }

  return okJson({ quizId: quiz.id });
}
