import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function CtaBand() {
  return (
    <section className="container-sheet mt-20 sm:mt-28">
      <div className="rounded-md border border-rule bg-raised px-6 py-12 text-center sm:px-12 sm:py-16">
        <p className="exam-label mb-4">Ready when you are</p>
        <h2 className="mx-auto max-w-measure font-display text-title text-ink">
          Your next reading assignment can grade itself
        </h2>
        <p className="mx-auto mt-4 max-w-measure text-mute">
          No account needed — upload a PDF and walk through your first quiz before
          your coffee gets cold.
        </p>
        <div className="mt-8 flex justify-center">
          <ButtonLink href="/create" size="lg">
            Upload a PDF now
            <ArrowRight size={18} aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
