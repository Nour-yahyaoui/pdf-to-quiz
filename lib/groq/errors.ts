/**
 * Groq error classification (pure and unit-tested).
 * The free tier enforces separate requests-per-minute and tokens-per-minute
 * windows plus a daily quota; users need a different message for each case.
 */

export type GroqFailureKind =
  | "rate_limit_tokens"
  | "rate_limit_requests"
  | "quota_exhausted"
  | "unauthorized"
  | "timeout"
  | "other";

export interface ClassifiedFailure {
  kind: GroqFailureKind;
  status: number | undefined;
  retryAfterSeconds: number | null;
  /** Safe, user-facing message. Never includes the key or raw internals. */
  message: string;
}

interface GroqLikeError {
  status?: number;
  code?: string;
  message?: string;
  error?: { code?: string; message?: string; type?: string };
  headers?: { get?(name: string): string | null };
}

function asGroqError(error: unknown): GroqLikeError | null {
  if (typeof error !== "object" || error === null) return null;
  return error as GroqLikeError;
}

function readRetryAfter(error: GroqLikeError): number | null {
  const raw = error.headers?.get?.("retry-after");
  if (!raw) return null;
  const seconds = Number(raw);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null;
}

export function classifyGroqError(error: unknown): ClassifiedFailure {
  // AbortController timeout from our own fetch wrapper.
  if (error instanceof Error && error.name === "AbortError") {
    return {
      kind: "timeout",
      status: undefined,
      retryAfterSeconds: null,
      message: "The model took too long to respond. Please try again.",
    };
  }

  const groq = asGroqError(error);
  if (!groq) {
    return {
      kind: "other",
      status: undefined,
      retryAfterSeconds: null,
      message: "The quiz service is temporarily unavailable. Please try again.",
    };
  }

  const code = `${groq.code ?? ""} ${groq.error?.code ?? ""} ${groq.error?.type ?? ""}`.toLowerCase();
  const detail = `${groq.message ?? ""} ${groq.error?.message ?? ""}`.toLowerCase();
  const retryAfterSeconds = readRetryAfter(groq);

  if (groq.status === 401 || groq.status === 403) {
    return {
      kind: "unauthorized",
      status: groq.status,
      retryAfterSeconds: null,
      message:
        "The AI service rejected the configured API key. Check the GROQ_API_KEY setting.",
    };
  }

  if (groq.status === 429) {
    // Daily quota / trial balance exhausted (distinct from per-minute windows).
    if (
      code.includes("insufficient_quota") ||
      detail.includes("quota") ||
      detail.includes("balance") ||
      detail.includes("trial") ||
      detail.includes("billing")
    ) {
      return {
        kind: "quota_exhausted",
        status: 429,
        retryAfterSeconds,
        message:
          "Your Groq free-tier quota is used up. It resets daily — check the Groq console for the current limits, then try again later.",
      };
    }

    // Tokens-per-minute window (the most common free-trial failure).
    if (detail.includes("token") || code.includes("token")) {
      return {
        kind: "rate_limit_tokens",
        status: 429,
        retryAfterSeconds,
        message:
          "Groq's free-tier token limit was reached. It resets every minute — wait about 30 seconds and try again.",
      };
    }

    return {
      kind: "rate_limit_requests",
      status: 429,
      retryAfterSeconds,
      message: "Too many requests, try again in 30 seconds.",
    };
  }

  return {
    kind: "other",
    status: groq.status,
    retryAfterSeconds,
    message: "The quiz service is temporarily unavailable. Please try again.",
  };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
