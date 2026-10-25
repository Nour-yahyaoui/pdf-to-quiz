import { describe, expect, it } from "vitest";
import { classifyGroqError } from "@/lib/groq/errors";

function groqError(overrides: Record<string, unknown>) {
  return { name: "APIError", ...overrides };
}

describe("classifyGroqError", () => {
  it("detects the free-tier tokens-per-minute limit", () => {
    const failure = classifyGroqError(
      groqError({
        status: 429,
        error: {
          code: "rate_limit_exceeded",
          message: "Rate limit reached for tokens per minute (TPM)",
        },
      }),
    );
    expect(failure.kind).toBe("rate_limit_tokens");
    expect(failure.message).toMatch(/token limit/i);
  });

  it("detects the requests-per-minute limit", () => {
    const failure = classifyGroqError(
      groqError({
        status: 429,
        error: { code: "rate_limit_exceeded", message: "Too many requests" },
      }),
    );
    expect(failure.kind).toBe("rate_limit_requests");
    expect(failure.message).toMatch(/too many requests/i);
  });

  it("detects an exhausted trial/daily quota", () => {
    const failure = classifyGroqError(
      groqError({
        status: 429,
        error: { type: "insufficient_quota", message: "You exceeded your monthly quota" },
      }),
    );
    expect(failure.kind).toBe("quota_exhausted");
    expect(failure.message).toMatch(/quota/i);
  });

  it("honours the provider retry-after header", () => {
    const headers = { get: (name: string) => (name === "retry-after" ? "12" : null) };
    const failure = classifyGroqError(
      groqError({
        status: 429,
        headers,
        error: { message: "tokens per minute exceeded" },
      }),
    );
    expect(failure.retryAfterSeconds).toBe(12);
  });

  it("classifies key problems as unauthorized", () => {
    const failure = classifyGroqError(
      groqError({ status: 401, error: { message: "Invalid API key" } }),
    );
    expect(failure.kind).toBe("unauthorized");
    expect(failure.message).toMatch(/API key/i);
  });

  it("classifies aborts as timeouts", () => {
    const failure = classifyGroqError(new DOMException("aborted", "AbortError"));
    expect(failure.kind).toBe("timeout");
  });

  it("falls back safely for unknown errors", () => {
    const failure = classifyGroqError(new Error("boom"));
    expect(failure.kind).toBe("other");
    expect(failure.message).toMatch(/temporarily unavailable/i);
  });
});
