"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <main className="container-sheet flex min-h-[60vh] items-center justify-center py-10">
      <div className="w-full max-w-md rounded-md border border-rule bg-raised p-8 text-center">
        <p className="exam-label mb-3">Something went wrong</p>
        <h1 className="font-display text-heading text-ink">
          We couldn&apos;t load your quizzes
        </h1>
        <p className="mt-3 text-sm text-mute">
          This is usually a temporary connection problem. Your data is safe — try
          loading the page again.
        </p>
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
