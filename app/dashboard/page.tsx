"use client";

import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { QuizRow } from "@/components/dashboard/quiz-row";
import { useQuizHistory } from "@/lib/history";
import { useIsMounted } from "@/lib/use-mounted";

export default function DashboardPage() {
  const mounted = useIsMounted();
  const quizzes = useQuizHistory();

  return (
    <main className="container-sheet py-10 sm:py-14">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="exam-label mb-2">Saved on this device</p>
          <h1 className="font-display text-title text-ink">Your quizzes</h1>
          {mounted && quizzes.length > 0 && (
            <p className="mt-2 font-mono text-label uppercase text-mute tabular">
              {quizzes.length} {quizzes.length === 1 ? "quiz" : "quizzes"}
            </p>
          )}
        </div>
        <ButtonLink href="/create" size="lg">
          <Plus size={18} aria-hidden />
          Create new quiz
        </ButtonLink>
      </div>

      {!mounted ? (
        <DashboardSkeleton />
      ) : quizzes.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="overflow-hidden rounded-md border border-rule bg-raised">
          {quizzes.map((quiz) => (
            <QuizRow key={quiz.id} quiz={quiz} />
          ))}
        </ul>
      )}
    </main>
  );
}
