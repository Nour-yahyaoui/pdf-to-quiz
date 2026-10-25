import Link from "next/link";
import { RotateCcw, LayoutGrid } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Confetti } from "@/components/results/confetti";

interface ScoreHeroProps {
  score: number;
  total: number;
  quizId: string;
}

function messageFor(ratio: number): string {
  if (ratio >= 0.9) return "Outstanding. You have mastered this sheet.";
  if (ratio > 0.7) return "Well done — a strong pass.";
  if (ratio >= 0.5) return "A solid foundation. Review the misses below.";
  return "Keep going — the review below explains every answer.";
}

export function ScoreHero({ score, total, quizId }: ScoreHeroProps) {
  const ratio = total === 0 ? 0 : score / total;
  const percent = Math.round(ratio * 100);
  const celebrate = ratio > 0.7;

  return (
    <section className="rounded-md border border-rule bg-raised p-6 sm:p-10">
      {celebrate && <Confetti />}
      <p className="exam-label">Your result</p>
      <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-2">
        <p className="font-display text-display leading-none text-ink tabular">
          {score}
          <span className="text-mute"> / {total}</span>
        </p>
        <p className="pb-2 font-mono text-title text-accent tabular">{percent}%</p>
      </div>
      <p className="mt-5 max-w-measure text-body text-mute">{messageFor(ratio)}</p>

      <div className="mt-9 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href={`/quiz/${quizId}`} size="lg">
          <RotateCcw size={18} aria-hidden />
          Retake quiz
        </ButtonLink>
        <ButtonLink href="/dashboard" variant="secondary" size="lg">
          <LayoutGrid size={18} aria-hidden />
          Back to dashboard
        </ButtonLink>
      </div>

      <p className="mt-6 text-sm text-mute">
        <Link href="#review" className="text-accent underline-offset-4 hover:underline">
          Jump to the answer review
        </Link>
      </p>
    </section>
  );
}
