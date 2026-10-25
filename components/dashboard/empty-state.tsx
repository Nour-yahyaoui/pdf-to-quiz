import { FileUp } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="rounded-md border border-dashed border-rule bg-raised px-6 py-16 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-sm border border-rule bg-paper text-accent">
        <FileUp size={24} aria-hidden />
      </span>
      <h2 className="mt-6 font-display text-heading text-ink">No quizzes yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-mute">
        Upload your first PDF and the exam sheet will appear here, ready to retake
        whenever you need it.
      </p>
      <div className="mt-8 flex justify-center">
        <ButtonLink href="/create" size="lg">
          Create your first quiz
        </ButtonLink>
      </div>
    </div>
  );
}
