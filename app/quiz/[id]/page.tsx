import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QuizRunner } from "@/components/quiz/quiz-runner";

export const metadata: Metadata = { title: "Quiz" };
export const dynamic = "force-dynamic";

export default async function QuizPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, pdf_name, difficulty, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!quiz) notFound();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_text, options, order_index")
    .eq("quiz_id", id)
    .order("order_index", { ascending: true });

  if (!questions || questions.length === 0) notFound();

  // Only safe fields cross into the client — no correct_answer, no explanation.
  const safeQuestions = questions.map((q) => ({
    id: q.id,
    question_text: q.question_text,
    options: q.options,
  }));

  return (
    <main className="container-sheet py-8 sm:py-12">
      <Link
        href="/dashboard"
        className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-mute hover:text-accent"
      >
        <ArrowLeft size={16} aria-hidden />
        Back to your quizzes
      </Link>

      <header className="mb-10">
        <p className="exam-label mb-2 truncate">{quiz.pdf_name}</p>
        <h1 className="font-display text-title text-ink">
          {safeQuestions.length}-question exam
        </h1>
      </header>

      <div className="mx-auto max-w-measure">
        <QuizRunner quizId={quiz.id} questions={safeQuestions} />
      </div>
    </main>
  );
}
