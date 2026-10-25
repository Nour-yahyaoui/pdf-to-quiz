import { describe, expect, it } from "vitest";
import { parseQuizResponse } from "@/lib/quiz/parser";
import type { GeneratedQuestion } from "@/lib/types";

function makeQuestion(n: number): GeneratedQuestion {
  return {
    question_text: `Question number ${n} with enough characters to pass validation`,
    options: ["First option", "Second option", "Third option", "Fourth option"],
    correct_answer: "First option",
    explanation: "The first option is correct because of the provided source text.",
  };
}

function validPayload(count = 10) {
  return { questions: Array.from({ length: count }, (_, i) => makeQuestion(i + 1)) };
}

describe("parseQuizResponse", () => {
  it("accepts a well-formed { questions: [...] } object", () => {
    const result = parseQuizResponse(JSON.stringify(validPayload()));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.questions).toHaveLength(10);
  });

  it("accepts a bare top-level array", () => {
    const result = parseQuizResponse(JSON.stringify(validPayload().questions));
    expect(result.ok).toBe(true);
  });

  it("unwraps markdown code fences", () => {
    const fenced = "```json\n" + JSON.stringify(validPayload()) + "\n```";
    const result = parseQuizResponse(fenced);
    expect(result.ok).toBe(true);
  });

  it("rejects non-JSON text", () => {
    const result = parseQuizResponse("I cannot answer that.");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/valid JSON/);
  });

  it("rejects correct_answer that does not match an option", () => {
    const payload = validPayload();
    payload.questions[0].correct_answer = "Fifth option";
    const result = parseQuizResponse(JSON.stringify(payload));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/correct_answer/);
  });

  it("rejects quizzes that are not exactly ten questions", () => {
    const result = parseQuizResponse(JSON.stringify(validPayload(9)));
    expect(result.ok).toBe(false);
  });

  it("rejects duplicate options", () => {
    const payload = validPayload();
    payload.questions[0].options = ["Same", "Same", "Other", "Different"];
    const result = parseQuizResponse(JSON.stringify(payload));
    expect(result.ok).toBe(false);
  });
});
