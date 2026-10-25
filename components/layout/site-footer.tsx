import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-rule">
      <div className="container-sheet flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-lg text-ink">PDF to Quiz</p>
          <p className="mt-1 text-sm text-mute">
            Exam-sheet quizzes generated from your documents. No account needed.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Footer">
          <Link href="/create" className="text-mute hover:text-accent">
            Create quiz
          </Link>
          <Link href="/dashboard" className="text-mute hover:text-accent">
            Your quizzes
          </Link>
          <a
            href="https://console.groq.com"
            target="_blank"
            rel="noreferrer"
            className="text-mute hover:text-accent"
          >
            Groq AI
          </a>
        </nav>
      </div>
    </footer>
  );
}
