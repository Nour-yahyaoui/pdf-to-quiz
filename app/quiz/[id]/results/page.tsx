import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { scoreAttempt } from "@/lib/quiz/scoring";
import { ScoreHero } from "@/components/results/score-hero";
import { ReviewList } from "@/components/results/review-list";
import { AttemptRecorder } from "@/components/results/attempt-recorder";
import type { QuestionRow } from "@/lib/types";

export const metadata: Metadata = { title: "Results" };
export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attempt?: string }>;
}) {
  const { id: quizId } = await params;
  const { attempt: attemptId } = await searchParams;

  const supabase = await createClient();

  // RLS allows public reads; a missing/unknown id is a 404.
  const { data: attempt } = await supabase
    .from("attempts")
    .select("id, quiz_id, score, total_questions, answers")
    .eq("id", attemptId ?? "")
    .eq("quiz_id", quizId)
    .maybeSingle();

  if (!attempt) notFound();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, pdf_name")
    .eq("id", quizId)
    .maybeSingle();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, quiz_id, question_text, options, correct_answer, explanation, order_index")
    .eq("quiz_id", quizId)
    .order("order_index", { ascending: true });

  if (!quiz || !questions || questions.length === 0) notFound();

  const savedAnswers = (attempt.answers ?? []) as (string | null)[];
  const { score, total, results } = scoreAttempt(
    questions as QuestionRow[],
    savedAnswers,
  );

  return (
    <main className="container-sheet py-8 sm:py-12">
      <AttemptRecorder quizId={quizId} score={score} total={total} pdfName={quiz.pdf_name} />
      <Link
        href="/dashboard"
        className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-mute hover:text-accent"
      >
        <ArrowLeft size={16} aria-hidden />
        Back to your quizzes
      </Link>

      <header className="mb-8">
        <p className="exam-label mb-2 truncate">{quiz.pdf_name}</p>
        <h1 className="font-display text-title text-ink">Exam marked</h1>
      </header>

      <div className="space-y-12">
        <ScoreHero score={score} total={total} quizId={quizId} />
        <section>
          <h2 className="mb-6 font-display text-heading text-ink">Answer review</h2>
          <ReviewList results={results} />
        </section>
      </div>
    </main>
  );
}
