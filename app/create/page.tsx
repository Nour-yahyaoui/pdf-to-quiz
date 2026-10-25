import type { Metadata } from "next";
import { CreateQuizClient } from "@/components/create/create-quiz-client";

export const metadata: Metadata = { title: "New quiz" };

export default function CreatePage() {
  return (
    <main className="container-sheet py-10 sm:py-14">
      <header className="mb-10 max-w-measure">
        <p className="exam-label mb-2">New exam sheet</p>
        <h1 className="font-display text-title text-ink">Create a quiz from a PDF</h1>
        <p className="mt-3 text-mute">
          The document is read in memory and discarded immediately. No account is
          needed — the generated quiz is saved and remembered on this device.
        </p>
      </header>
      <CreateQuizClient />
    </main>
  );
}
