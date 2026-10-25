import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import type { HistoryEntry } from "@/lib/history";
import type { Difficulty } from "@/lib/types";

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export function QuizRow({ quiz }: { quiz: HistoryEntry }) {
  const dateLabel = new Date(quiz.createdAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  return (
    <li className="hairline last:border-b-0">
      <Link
        href={`/quiz/${quiz.id}`}
        className="flex min-h-16 items-center gap-4 py-4 transition-colors hover:bg-accent-tint/50 focus-visible:bg-accent-tint/50"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-rule bg-paper text-mute">
          <FileText size={18} aria-hidden />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-ink">{quiz.pdf_name}</span>
          <span className="mt-1 block font-mono text-label uppercase text-mute">
            {dateLabel}
            {quiz.difficulty ? ` · ${DIFFICULTY_LABEL[quiz.difficulty]}` : ""}
          </span>
        </span>

        <span className="shrink-0 text-right">
          {quiz.latestScore !== null && quiz.latestTotal !== null ? (
            <span className="font-mono text-sm tabular text-ink">
              {quiz.latestScore}
              <span className="text-mute"> / {quiz.latestTotal}</span>
            </span>
          ) : (
            <span className="font-mono text-label uppercase text-mute">Not taken</span>
          )}
        </span>

        <ChevronRight size={18} aria-hidden className="shrink-0 text-mute" />
      </Link>
    </li>
  );
}
