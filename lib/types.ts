/**
 * Shared domain types. Database row shapes mirror supabase/migrations/0001_init.sql.
 */

export type Difficulty = "easy" | "medium" | "hard";

export interface QuizRow {
  id: string;
  user_id: string;
  pdf_name: string;
  difficulty: Difficulty | null;
  created_at: string;
}

export interface QuestionRow {
  id: string;
  quiz_id: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  explanation: string | null;
  order_index: number;
}

export interface AttemptRow {
  id: string;
  quiz_id: string;
  user_id: string;
  score: number;
  total_questions: number;
  answers: string[] | null;
  completed_at: string;
}

/** Shape produced by the Groq model and validated with zod before insertion. */
export interface GeneratedQuestion {
  question_text: string;
  options: [string, string, string, string];
  correct_answer: string;
  explanation: string;
}

export interface QuizResultItem {
  questionId: string;
  question: string;
  options: string[];
  userAnswer: string | null;
  correctAnswer: string;
  explanation: string | null;
  isCorrect: boolean;
}

/** One error contract for every API route (backend-api-design skill). */
export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "VALIDATION_ERROR"
  | "FILE_TOO_LARGE"
  | "INVALID_FILE_TYPE"
  | "EMPTY_PDF"
  | "RATE_LIMITED"
  | "AI_UNAVAILABLE"
  | "AI_MALFORMED_OUTPUT"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    correlationId: string;
  };
}
