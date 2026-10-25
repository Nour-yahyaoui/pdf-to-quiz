import { describe, expect, it } from "vitest";
import {
  difficultySchema,
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

  it("rejects unknown keys (strict object)", () => {
    expect(
      submitQuizSchema.safeParse({
        quizId: crypto.randomUUID(),
        answers: ["a"],
        extra: "nope",
      }).success,
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

  it("keeps the PDF limit under Vercel's 4.5 MB request body cap", () => {
    expect(MAX_PDF_BYTES).toBe(Math.floor(4.5 * 1024 * 1024));
    expect(MAX_PDF_BYTES).toBeLessThan(4.5 * 1024 * 1024 + 1);
  });
});
