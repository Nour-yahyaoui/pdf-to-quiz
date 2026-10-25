import { FileUp, BrainCircuit, ClipboardCheck } from "lucide-react";

const STEPS = [
  {
    icon: FileUp,
    number: "01",
    title: "Drop in a PDF",
    body: "Drag and drop any PDF up to 5 MB directly in the browser. The file is parsed in memory and discarded — it is never written to storage.",
  },
  {
    icon: BrainCircuit,
    number: "02",
    title: "The model writes the exam",
    body: "Groq's Llama 3.3 70B model reads the document and produces exactly ten questions at your chosen difficulty, each with four answers and an explanation.",
  },
  {
    icon: ClipboardCheck,
    number: "03",
    title: "Take it and get marked",
    body: "Answer one question at a time, submit, and receive your score immediately alongside a full review of every question — right or wrong.",
  },
] as const;

export function HowItWorks() {
  return (
    <section className="container-sheet mt-20 sm:mt-28">
      <p className="exam-label mb-3">How it works</p>
      <h2 className="font-display text-title text-ink">Three steps to a finished quiz</h2>

      <ol className="mt-10 grid gap-px overflow-hidden rounded-md border border-rule bg-rule sm:grid-cols-3">
        {STEPS.map((step) => (
          <li key={step.number} className="flex flex-col gap-4 bg-raised p-6 sm:p-7">
            <div className="flex items-center justify-between">
              <step.icon size={22} aria-hidden className="text-accent" />
              <span className="font-mono text-sm text-mute tabular">{step.number}</span>
            </div>
            <h3 className="font-display text-heading text-ink">{step.title}</h3>
            <p className="text-[0.95rem] leading-relaxed text-mute">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
