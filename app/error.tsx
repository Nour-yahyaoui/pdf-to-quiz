"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Root error boundary. Next.js renders this in place of the crashed route while
 * keeping the rest of the shell intact.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="container-sheet flex min-h-[70vh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-md border border-rule bg-raised p-8 text-center">
        <p className="exam-label mb-3">Something went wrong</p>
        <h1 className="font-display text-heading text-ink">
          An unexpected error occurred
        </h1>
        <p className="mt-3 text-sm text-mute">
          Your work is saved. Try the action again, or head back to the dashboard
          if the problem persists.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-label uppercase text-mute">
            Reference {error.digest}
          </p>
        )}
        <div className="mt-7 flex justify-center">
          <Button onClick={reset} size="lg">
            <RotateCcw size={18} aria-hidden />
            Try again
          </Button>
        </div>
      </div>
    </main>
  );
}
