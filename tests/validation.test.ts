import { describe, expect, it } from "vitest";
import {
  difficultySchema,
  loginSchema,
  signupSchema,
  submitQuizSchema,
  MAX_PDF_BYTES,
} from "@/lib/validation";

describe("validation schemas", () => {
  it("accepts the three difficulty levels only", () => {
    expect(difficultySchema.safeParse("easy").success).toBe(true);
    expect(difficultySchema.safeParse("medium").success).toBe(true);
    expect(difficultySchema.safeParse("hard").success).toBe(true);
    expect(difficultySchema.safeParse("extreme").success).toBe(false);
  });

  it("requires a valid email and any non-empty password for login", () => {
    expect(loginSchema.safeParse({ email: "a@b.co", password: "x" }).success).toBe(true);
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("enforces a 12-character minimum for signup", () => {
    expect(
      signupSchema.safeParse({ email: "a@b.co", password: "short" }).success,
    ).toBe(false);
    expect(
      signupSchema.safeParse({ email: "a@b.co", password: "twelvechars1" }).success,
    ).toBe(true);
  });

  it("rejects unknown keys (strict object)", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.co", password: "x", role: "admin" }).success,
    ).toBe(false);
  });

  it("validates the submit payload bounds", () => {
    expect(
      submitQuizSchema.safeParse({ quizId: crypto.randomUUID(), answers: ["a"] }).success,
    ).toBe(true);
    expect(
      submitQuizSchema.safeParse({ quizId: "not-a-uuid", answers: ["a"] }).success,
    ).toBe(false);
    expect(
      submitQuizSchema.safeParse({ quizId: crypto.randomUUID(), answers: [] }).success,
    ).toBe(false);
  });

  it("keeps the PDF limit at exactly 5 MB", () => {
    expect(MAX_PDF_BYTES).toBe(5 * 1024 * 1024);
  });
});
