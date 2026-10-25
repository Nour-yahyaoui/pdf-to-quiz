import { Check } from "lucide-react";

/**
 * Signature element per docs/STYLE.md: a dense typographic spec sheet listing
 * exactly what the product does — real data, no invented statistics.
 */
const SPEC_ROWS = [
  ["Input", "One PDF, max 5 MB, parsed entirely in server memory"],
  ["Output", "10 multiple-choice questions, 4 options each"],
  ["Difficulty", "Easy, medium or hard — chosen before generation"],
  ["Model", "Llama 3.3 70B Versatile on Groq, instant fallback model"],
  ["Review", "Per-question marking with an AI-written explanation"],
  ["Storage", "Quizzes remembered in this browser, content stored behind RLS"],
  ["Privacy", "No account required; Row-Level Security on every table; PDFs never stored"],
] as const;

export function SpecTable() {
  return (
    <section className="container-sheet mt-20 sm:mt-28">
      <p className="exam-label mb-3">The spec sheet</p>
      <h2 className="font-display text-title text-ink">Exactly what you get</h2>

      <dl className="mt-8 overflow-hidden rounded-md border border-rule">
        {SPEC_ROWS.map(([label, value], index) => (
          <div
            key={label}
            className={`grid grid-cols-1 gap-1 bg-raised px-5 py-4 sm:grid-cols-12 sm:gap-6 sm:px-7 ${
              index !== SPEC_ROWS.length - 1 ? "border-b border-rule-soft" : ""
            }`}
          >
            <dt className="font-mono text-label uppercase text-mute sm:col-span-3 sm:pt-1">
              {label}
            </dt>
            <dd className="flex items-start gap-2 text-[0.95rem] text-ink sm:col-span-9">
              <Check size={16} aria-hidden className="mt-0.5 shrink-0 text-success" />
              <span>{value}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
