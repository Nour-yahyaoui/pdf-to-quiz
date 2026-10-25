import type { QuestionRow, QuizResultItem } from "@/lib/types";

/**
 * Pure scoring function — no I/O, fully unit-testable.
 * A missing answer is never correct; comparison is exact because the client can
 * only ever submit option strings that came from the database.
 */
export function scoreAttempt(
  questions: QuestionRow[],
  answers: (string | null)[],
): { score: number; total: number; results: QuizResultItem[] } {
  const results: QuizResultItem[] = questions.map((question, index) => {
    const userAnswer = answers[index] ?? null;
    const isCorrect = userAnswer !== null && userAnswer === question.correct_answer;

    return {
      questionId: question.id,
      question: question.question_text,
      options: question.options,
      userAnswer,
      correctAnswer: question.correct_answer,
      explanation: question.explanation,
      isCorrect,
    };
  });

  return {
    score: results.filter((result) => result.isCorrect).length,
    total: questions.length,
    results,
  };
}
