import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ButtonLink } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b border-rule bg-paper">
      <div className="container-sheet flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display text-xl tracking-tight text-ink">
            PDF to Quiz
          </span>
          <span className="hidden font-mono text-label uppercase text-mute sm:inline">
            exam sheet
          </span>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Primary">
          <ThemeToggle />
          <ButtonLink href="/dashboard" variant="ghost" className="px-3">
            Your quizzes
          </ButtonLink>
          <ButtonLink href="/create" size="md">
            Create quiz
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
