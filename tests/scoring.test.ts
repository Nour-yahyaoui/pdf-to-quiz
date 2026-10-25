import { describe, expect, it } from "vitest";
import { scoreAttempt } from "@/lib/quiz/scoring";
import { SAMPLE_QUESTIONS } from "./fixtures/questions";

describe("scoreAttempt", () => {
  it("scores a perfect attempt", () => {
    const answers = ["const", "null", "map"];
    const { score, total, results } = scoreAttempt(SAMPLE_QUESTIONS, answers);

    expect(total).toBe(3);
    expect(score).toBe(3);
    expect(results.every((r) => r.isCorrect)).toBe(true);
  });

  it("marks wrong and skipped answers without throwing", () => {
    const answers = ["var", null, "map"];
    const { score, results } = scoreAttempt(SAMPLE_QUESTIONS, answers);

    expect(score).toBe(1);
    expect(results[0].isCorrect).toBe(false);
    expect(results[1].isCorrect).toBe(false);
    expect(results[1].userAnswer).toBeNull();
    expect(results[2].isCorrect).toBe(true);
  });

  it("exposes the review fields the results page needs", () => {
    const { results } = scoreAttempt(SAMPLE_QUESTIONS, ["const", "null", "push"]);

    expect(results[0]).toMatchObject({
      questionId: "q-1",
      correctAnswer: "const",
      userAnswer: "const",
      isCorrect: true,
    });
    expect(results[2].explanation).toContain("map returns");
  });

  it("scores zero when every answer is missing", () => {
    const { score, results } = scoreAttempt(SAMPLE_QUESTIONS, [null, null, null]);
    expect(score).toBe(0);
    expect(results).toHaveLength(3);
  });
});
