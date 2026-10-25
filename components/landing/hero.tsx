import { ArrowRight, Zap } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="container-sheet pt-14 sm:pt-20 lg:pt-24">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        <div className="lg:col-span-7">
          <p className="exam-label mb-5 flex items-center gap-2">
            <Zap size={13} aria-hidden className="text-accent" />
            Powered by Groq AI
          </p>
          <h1 className="text-display font-normal text-ink">
            Turn any PDF into a quiz in under 5 seconds
          </h1>
          <p className="mt-6 max-w-measure text-body text-mute">
            Upload lecture notes, a research paper or any document up to 5&nbsp;MB.
            The reader extracts the text, the model writes ten multiple-choice
            questions, and you get a marked exam sheet with explanations — saved
            without any account.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/create" size="lg">
              Build your first quiz
              <ArrowRight size={18} aria-hidden />
            </ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary" size="lg">
              Browse your quizzes
            </ButtonLink>
          </div>
          <p className="mt-5 font-mono text-label uppercase text-mute">
            No account needed · Free to try · PDFs are never stored
          </p>
        </div>

        {/* Signature element: a miniature exam sheet, rendered honestly with type */}
        <div className="lg:col-span-5">
          <ExamSheetPreview />
        </div>
      </div>
    </section>
  );
}

function ExamSheetPreview() {
  const rows = [
    { n: "01", text: "Define the primary claim of the document", mark: "A" },
    { n: "02", text: "Identify the method used in the study", mark: "B" },
    { n: "03", text: "Explain the result in one sentence", mark: "C" },
  ];

  return (
    <div
      aria-hidden
      className="animate-slide-up rounded-md border border-rule bg-raised shadow-float"
    >
      <div className="flex items-center justify-between border-b border-rule px-5 py-4">
        <span className="font-mono text-label uppercase text-mute">
          Exam sheet · 10 questions
        </span>
        <span className="font-mono text-label uppercase text-accent">Easy</span>
      </div>
      <ol>
        {rows.map((row) => (
          <li
            key={row.n}
            className="flex items-center gap-4 border-b border-rule-soft px-5 py-4 last:border-b-0"
          >
            <span className="font-mono text-sm text-mute tabular">{row.n}</span>
            <span className="flex-1 text-sm text-ink">{row.text}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-sm border border-rule font-mono text-xs text-mute">
              {row.mark}
            </span>
          </li>
        ))}
      </ol>
      <div className="px-5 py-4">
        <div className="h-1.5 w-full overflow-hidden rounded-sm bg-rule-soft">
          <div className="h-full w-2/3 bg-accent" />
        </div>
        <p className="mt-3 font-mono text-label uppercase text-mute">
          Score 7 / 10 · review with explanations
        </p>
      </div>
    </div>
  );
}
