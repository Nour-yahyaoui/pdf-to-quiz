import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/dashboard/empty-state";
import { QuizRow, type DashboardQuiz } from "@/components/dashboard/quiz-row";

export const metadata: Metadata = { title: "Dashboard" };
// Always show the current list — never a cached dashboard from another session.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defense in depth — middleware already redirects, but the page never trusts it alone.
  if (!user) redirect("/login?redirectedFrom=/dashboard");

  const [quizzesResult, attemptsResult] = await Promise.all([
    supabase
      .from("quizzes")
      .select("id, pdf_name, difficulty, created_at")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("attempts")
      .select("quiz_id, score, total_questions, completed_at")
      .order("completed_at", { ascending: false }),
  ]);

  if (quizzesResult.error) {
    // The nearest error.tsx renders the retryable error state.
    throw new Error(quizzesResult.error.message);
  }

  const quizzes = quizzesResult.data ?? [];

  if (quizzes.length === 0) {
    return (
      <main className="container-sheet py-10 sm:py-14">
        <DashboardHeading count={0} />
        <EmptyState />
      </main>
    );
  }

  // Keep only the most recent attempt per quiz (rows arrive newest-first).
  const latestByQuiz = new Map<string, { score: number; total_questions: number }>();
  for (const attempt of attemptsResult.data ?? []) {
    if (!latestByQuiz.has(attempt.quiz_id)) {
      latestByQuiz.set(attempt.quiz_id, {
        score: attempt.score,
        total_questions: attempt.total_questions,
      });
    }
  }

  const dashboardQuizzes: DashboardQuiz[] = quizzes.map((quiz) => {
    const latest = latestByQuiz.get(quiz.id);
    return {
      id: quiz.id,
      pdf_name: quiz.pdf_name,
      difficulty: quiz.difficulty,
      created_at: quiz.created_at,
      latestScore: latest?.score ?? null,
      latestTotal: latest?.total_questions ?? null,
    };
  });

  return (
    <main className="container-sheet py-10 sm:py-14">
      <DashboardHeading count={dashboardQuizzes.length} />
      <ul className="overflow-hidden rounded-md border border-rule bg-raised">
        {dashboardQuizzes.map((quiz) => (
          <QuizRow key={quiz.id} quiz={quiz} />
        ))}
      </ul>
    </main>
  );
}

function DashboardHeading({ count }: { count: number }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="exam-label mb-2">Your exam sheets</p>
        <h1 className="font-display text-title text-ink">Dashboard</h1>
        {count > 0 && (
          <p className="mt-2 font-mono text-label uppercase text-mute tabular">
            {count} {count === 1 ? "quiz" : "quizzes"}
          </p>
        )}
      </div>
      <ButtonLink href="/create" size="lg">
        <Plus size={18} aria-hidden />
        Create new quiz
      </ButtonLink>
    </div>
  );
}
