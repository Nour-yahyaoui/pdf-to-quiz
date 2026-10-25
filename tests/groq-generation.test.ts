import { beforeEach, describe, expect, it, vi } from "vitest";

// Hoisted mock: a controllable fake Groq client. Variable names prefixed
// `mock` satisfy vitest's mock-hoisting rules.
const mockCreate = vi.fn();

vi.mock("@/lib/groq/client", () => ({
  getGroqClient: () => ({ chat: { completions: { create: mockCreate } } }),
  PRIMARY_MODEL: "primary-test-model",
  FALLBACK_MODEL: "fallback-test-model",
}));

import { generateQuestions } from "@/lib/groq/generate-questions";

const validQuiz = {
  questions: Array.from({ length: 10 }, (_, i) => ({
    question_text: `What is the correct answer for question number ${i + 1}?`,
    options: ["alpha choice", "beta choice", "gamma choice", "delta choice"],
    correct_answer: "alpha choice",
    explanation: "Alpha is correct because this is a controlled test fixture.",
  })),
};

const SAMPLE_TEXT = "Photosynthesis converts sunlight into chemical energy. ".repeat(8);

function groq429() {
  return {
    status: 429,
    error: { code: "rate_limit_exceeded", message: "tokens per minute exceeded" },
    headers: { get: () => null },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.GROQ_GENERATION_BUDGET_MS;
  delete process.env.GROQ_BACKOFF_MS;
});

describe("generateQuestions", () => {
  it("returns all ten parsed questions on a valid model response", async () => {
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validQuiz) } }],
    });

    const questions = await generateQuestions(SAMPLE_TEXT, "easy");

    expect(questions).toHaveLength(10);
    expect(questions[0].question_text).toContain("question number 1");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("throws AI_UNAVAILABLE with a JSON error when calls hang past the budget", async () => {
    process.env.GROQ_GENERATION_BUDGET_MS = "150";

    // Simulate a network call that only settles when aborted, like a hung fetch.
    mockCreate.mockImplementation(
      (_body: unknown, options: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) => {
          // Settle only when the caller aborts, like a hung network request.
          options.signal.addEventListener("abort", () => {
            const error = new Error("The operation was aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    );

    await expect(generateQuestions(SAMPLE_TEXT, "easy")).rejects.toMatchObject({
      name: "QuizGenerationError",
      code: "AI_UNAVAILABLE",
      message: expect.stringMatching(/took too long/i),
    });
  });

  it("surfaces a fallback-model 429 as RATE_LIMITED with a specific message", async () => {
    // Shrink the backoff so the retry sequence stays fast and deterministic.
    process.env.GROQ_GENERATION_BUDGET_MS = "2000";
    process.env.GROQ_BACKOFF_MS = "30";
    mockCreate.mockRejectedValue(groq429()).mockRejectedValue(groq429());

    await expect(generateQuestions(SAMPLE_TEXT, "easy")).rejects.toMatchObject({
      name: "QuizGenerationError",
      code: "RATE_LIMITED",
    });
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });
});
