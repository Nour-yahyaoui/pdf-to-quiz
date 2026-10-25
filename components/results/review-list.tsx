import { Check, X, Minus } from "lucide-react";
import type { QuizResultItem } from "@/lib/types";

const OPTION_LETTERS = ["A", "B", "C", "D"];

export function ReviewList({ results }: { results: QuizResultItem[] }) {
  return (
    <ol id="review" className="space-y-8 scroll-mt-24">
      {results.map((item, index) => (
        <li
          key={item.questionId}
          className="overflow-hidden rounded-md border border-rule bg-raised"
        >
          <div className="flex items-start justify-between gap-4 border-b border-rule-soft px-5 py-4 sm:px-7">
            <div>
              <p className="exam-label">Question {String(index + 1).padStart(2, "0")}</p>
              <h2 className="mt-2 font-display text-heading leading-snug text-ink">
                {item.question}
              </h2>
            </div>
            <OutcomeBadge isCorrect={item.isCorrect} answered={item.userAnswer !== null} />
          </div>

          <ul>
            {item.options.map((option, optionIndex) => {
              const isCorrect = option === item.correctAnswer;
              const isUserChoice = option === item.userAnswer;

              let classes = "border-rule-soft text-ink/80";
              let tag: string | null = null;
              if (isCorrect) {
                classes = "border-success/50 bg-success/10 text-ink";
                tag = "Correct answer";
              } else if (isUserChoice) {
                classes = "border-danger/50 bg-danger/10 text-ink";
                tag = "Your answer";
              }

              return (
                <li
                  key={option}
                  className={`flex items-start gap-3 border-b px-5 py-3.5 last:border-b-0 sm:px-7 ${classes}`}
                >
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-sm border border-rule font-mono text-xs"
                  >
                    {OPTION_LETTERS[optionIndex]}
                  </span>
                  <span className="flex-1 text-[0.95rem]">{option}</span>
                  {tag && (
                    <span className="shrink-0 font-mono text-label uppercase text-mute">
                      {tag}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          {item.userAnswer === null && (
            <p className="border-b border-rule-soft bg-rule-soft/40 px-5 py-3 text-sm text-mute sm:px-7">
              No answer was selected for this question.
            </p>
          )}

          {item.explanation && (
            <div className="px-5 py-5 sm:px-7">
              <p className="exam-label mb-2">Explanation</p>
              <p className="text-[0.95rem] leading-relaxed text-mute">
                {item.explanation}
              </p>
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

function OutcomeBadge({
  isCorrect,
  answered,
}: {
  isCorrect: boolean;
  answered: boolean;
}) {
  if (!answered) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-rule px-2.5 py-1 font-mono text-label uppercase text-mute">
        <Minus size={13} aria-hidden /> Skipped
      </span>
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-2.5 py-1 font-mono text-label uppercase ${
        isCorrect
          ? "border-success/50 text-success"
          : "border-danger/50 text-danger"
      }`}
    >
      {isCorrect ? <Check size={13} aria-hidden /> : <X size={13} aria-hidden />}
      {isCorrect ? "Correct" : "Incorrect"}
    </span>
  );
}
