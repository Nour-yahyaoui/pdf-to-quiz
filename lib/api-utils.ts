import { NextResponse } from "next/server";
import type { ApiErrorBody, ApiErrorCode } from "@/lib/types";

/**
 * One error contract for every route handler (backend-api-design skill):
 * honest HTTP status, machine-readable code, human message, correlation id,
 * and an optional sanitised technical detail for the UI. Full context goes to
 * server logs with the same correlation id.
 */
const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  UNAUTHENTICATED: 401,
  VALIDATION_ERROR: 400,
  FILE_TOO_LARGE: 413,
  INVALID_FILE_TYPE: 415,
  EMPTY_PDF: 422,
  RATE_LIMITED: 429,
  AI_UNAVAILABLE: 502,
  AI_MALFORMED_OUTPUT: 502,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500,
};

const MAX_DETAIL_CHARS = 300;

/**
 * Flatten an unknown thrown value into a one-line, truncated technical
 * description safe to return to the browser. Only the error name and message
 * are used — never stack traces, environment values, or request bodies.
 */
export function toErrorDetail(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`.slice(0, MAX_DETAIL_CHARS);
  }
  try {
    return String(error).slice(0, MAX_DETAIL_CHARS);
  } catch {
    return "Unknown error";
  }
}

export function newCorrelationId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  correlationId = newCorrelationId(),
  retryAfterSeconds?: number | null,
  detail?: string,
): NextResponse<ApiErrorBody> {
  // Server-side detail; the client only ever receives the safe message.
  console.error(`[${correlationId}] API error: ${code} — ${message}${detail ? ` — ${detail}` : ""}`);
  const retryAfter =
    code === "RATE_LIMITED"
      ? { "Retry-After": String(retryAfterSeconds ?? 30) }
      : undefined;
  return NextResponse.json(
    {
      error: {
        code,
        message,
        correlationId,
        ...(detail ? { detail: detail.slice(0, MAX_DETAIL_CHARS) } : {}),
      },
    },
    {
      status: STATUS_BY_CODE[code],
      headers: retryAfter,
    },
  );
}

export function okJson<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, init);
}
