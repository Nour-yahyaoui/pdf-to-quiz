import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ButtonLink } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b border-rule bg-paper">
      <div className="container-sheet flex h-16 items-center justify-between gap-1.5 sm:gap-4">
        <Link href="/" className="flex min-w-0 items-baseline gap-2">
          {/* nowrap keeps the wordmark on one line at every width; it must
              never stack and overflow the fixed-height header on mobile. */}
          <span className="whitespace-nowrap font-display text-lg tracking-tight text-ink sm:text-xl">
            PDF to Quiz
          </span>
          <span className="hidden font-mono text-label uppercase text-mute sm:inline">
            exam sheet
          </span>
        </Link>

        <nav
          className="flex shrink-0 items-center gap-1 sm:gap-3"
          aria-label="Primary"
        >
          <ThemeToggle />
          {/* Icon-only on phones (full 44px touch target), labelled from sm up.
              Hidden below 360px so the header never overflows on tiny devices;
              the dashboard stays reachable via the landing and footer links. */}
          <ButtonLink
            href="/dashboard"
            variant="ghost"
            aria-label="Your quizzes"
            className="hidden w-11 justify-center px-0 min-[360px]:inline-flex sm:w-auto sm:px-3"
          >
            <LayoutGrid size={18} aria-hidden className="sm:hidden" />
            <span className="hidden sm:inline">Your quizzes</span>
          </ButtonLink>
          <ButtonLink href="/create" size="md" className="px-2.5 sm:px-5">
            Create quiz
          </ButtonLink>
        </nav>
      </div>
    </header>
  );
}
