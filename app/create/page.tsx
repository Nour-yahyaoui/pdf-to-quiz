import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateQuizClient } from "@/components/create/create-quiz-client";

export const metadata: Metadata = { title: "New quiz" };

export default async function CreatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?redirectedFrom=/create");

  return (
    <main className="container-sheet py-10 sm:py-14">
      <header className="mb-10 max-w-measure">
        <p className="exam-label mb-2">New exam sheet</p>
        <h1 className="font-display text-title text-ink">Create a quiz from a PDF</h1>
        <p className="mt-3 text-mute">
          The document is read in memory and discarded immediately. Only the generated
          questions are saved to your account.
        </p>
      </header>
      <CreateQuizClient />
    </main>
  );
}
