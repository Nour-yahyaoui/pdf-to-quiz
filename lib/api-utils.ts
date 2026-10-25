import { NextResponse } from "next/server";
import type { ApiErrorBody, ApiErrorCode } from "@/lib/types";

/**
 * One error contract for every route handler (backend-api-design skill):
 * honest HTTP status, machine-readable code, human message, correlation id.
 * Detailed context goes to server logs with the same correlation id.
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

export function newCorrelationId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  correlationId = newCorrelationId(),
): NextResponse<ApiErrorBody> {
  // Server-side detail; the client only ever receives the safe message.
  console.error(`[${correlationId}] API error: ${code} — ${message}`);
  return NextResponse.json(
    { error: { code, message, correlationId } },
    {
      status: STATUS_BY_CODE[code],
      headers: code === "RATE_LIMITED" ? { "Retry-After": "30" } : undefined,
    },
  );
}

export function okJson<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, init);
}
