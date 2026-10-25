"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface SafeQuestion {
  id: string;
  question_text: string;
  options: string[];
}

interface QuizRunnerProps {
  quizId: string;
  questions: SafeQuestion[];
}

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

export function QuizRunner({ quizId, questions }: QuizRunnerProps) {
  const router = useRouter();
  const total = questions.length;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(
    () => Array.from({ length: total }, () => null),
  );
  const [submitting, setSubmitting] = useState(false);

  const question = questions[currentIndex];
  const selected = answers[currentIndex];
  const isLast = currentIndex === total - 1;
  const progress = useMemo(
    () => Math.round(((currentIndex + 1) / total) * 100),
    [currentIndex, total],
  );

  function choose(option: string) {
    if (submitting) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = option;
      return next;
    });
  }

  function goNext() {
    if (currentIndex < total - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }

  async function submit() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId, answers }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        toast.error(data?.error?.message ?? "Could not submit your quiz.");
        setSubmitting(false);
        return;
      }
      router.push(`/quiz/${quizId}/results?attempt=${data.attemptId}`);
    } catch {
      toast.error("Network problem — check your connection and try again.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="exam-label" aria-live="polite" role="status">
            Question {currentIndex + 1} of {total}
          </span>
          <span className="font-mono text-label uppercase text-mute tabular">
            {progress}%
          </span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-sm bg-rule-soft"
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label="Quiz progress"
        >
          <div
            className="h-full bg-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card — keyed so the transition replays per question */}
      <div key={question.id} className="animate-fade-in">
        <h2 className="font-display text-heading leading-snug text-ink sm:text-title">
          {question.question_text}
        </h2>

        <fieldset className="mt-8">
          <legend className="sr-only">Choose one answer</legend>
          <ul className="overflow-hidden rounded-md border border-rule bg-raised">
            {question.options.map((option, index) => {
              const isSelected = selected === option;
              return (
                <li key={option} className="hairline last:border-b-0">
                  <label
                    className={`flex min-h-14 cursor-pointer items-center gap-4 px-4 py-4 transition-colors sm:px-5 ${
                      isSelected ? "bg-accent-tint" : "hover:bg-accent-tint/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={isSelected}
                      onChange={() => choose(option)}
                      className="sr-only"
                    />
                    <span
                      aria-hidden
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border font-mono text-sm ${
                        isSelected
                          ? "border-accent bg-accent text-white dark:text-ink"
                          : "border-rule bg-paper text-mute"
                      }`}
                    >
                      {isSelected ? <Check size={16} /> : OPTION_LETTERS[index]}
                    </span>
                    <span
                      className={`flex-1 text-[0.975rem] ${
                        isSelected ? "font-medium text-ink" : "text-ink/90"
                      }`}
                    >
                      {option}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-label uppercase text-mute">
            {answers.filter(Boolean).length} of {total} answered
          </p>
          {isLast ? (
            <Button size="lg" onClick={submit} disabled={!selected || submitting}>
              {submitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" aria-hidden />
                  Marking your exam…
                </>
              ) : (
                "Submit quiz"
              )}
            </Button>
          ) : (
            <Button size="lg" onClick={goNext} disabled={!selected}>
              Next question
              <ArrowRight size={18} aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
