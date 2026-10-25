import type { QuestionRow } from "@/lib/types";

export function makeQuestion(overrides: Partial<QuestionRow> = {}): QuestionRow {
  return {
    id: "q-1",
    quiz_id: "quiz-1",
    question_text: "Which keyword declares a constant in modern JavaScript?",
    options: ["var", "let", "const", "static"],
    correct_answer: "const",
    explanation: "const declares a block-scoped binding that cannot be reassigned.",
    order_index: 0,
    ...overrides,
  };
}

export const SAMPLE_QUESTIONS: QuestionRow[] = [
  makeQuestion({
    id: "q-1",
    order_index: 0,
    correct_answer: "const",
  }),
  makeQuestion({
    id: "q-2",
    quiz_id: "quiz-1",
    order_index: 1,
    question_text: "What does JSON.parse return for the string 'null'?",
    options: ["undefined", "null", "an empty object", "a syntax error"],
    correct_answer: "null",
    explanation: "The JSON literal null parses to the JavaScript value null.",
  }),
  makeQuestion({
    id: "q-3",
    quiz_id: "quiz-1",
    order_index: 2,
    question_text: "Which array method does not mutate the original array?",
    options: ["push", "splice", "sort", "map"],
    correct_answer: "map",
    explanation: "map returns a new array; the others mutate the receiver.",
  }),
];
