"use client";

import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

/**
 * The generation request is a single server call, so these phases are honest
 * time-based estimates of what the function is doing — the thresholds mirror
 * the server's real sequence (upload, in-memory PDF parse, three model
 * attempts inside the 50s budget, then the two Supabase inserts).
 */
export const GENERATION_STAGES = [
  "Uploading your PDF",
  "Reading the document text",
  "Crafting 10 exam questions",
  "Saving your quiz",
] as const;

const STAGE_THRESHOLDS_SECONDS = [0, 5, 12, 25] as const;

/** Index of the stage active after `elapsedSeconds` (pure — unit-tested). */
export function stageForElapsed(elapsedSeconds: number): number {
  let stage = 0;
  for (let i = 0; i < STAGE_THRESHOLDS_SECONDS.length; i++) {
    if (elapsedSeconds >= STAGE_THRESHOLDS_SECONDS[i]) stage = i;
  }
  return stage;
}

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function GenerationProgress() {
  const startedAt = useRef(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    startedAt.current = Date.now();
    const timer = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 250);
    return () => clearInterval(timer);
  }, []);

  const activeStage = stageForElapsed(elapsedSeconds);

  return (
    <div
      className="animate-fade-in rounded-md border border-rule bg-raised p-5 sm:p-6"
      aria-busy="true"
    >
      {/* Indeterminate bar — duration is unknown until the server answers. */}
      <div
        className="relative h-1.5 w-full overflow-hidden rounded-sm bg-rule-soft"
        role="progressbar"
        aria-label="Quiz generation in progress"
        aria-valuetext={GENERATION_STAGES[activeStage]}
      >
        <div className="absolute h-full w-1/4 animate-indeterminate rounded-sm bg-accent" />
      </div>

      <ul className="mt-5 space-y-3">
        {GENERATION_STAGES.map((label, index) => {
          const isDone = index < activeStage;
          const isActive = index === activeStage;
          return (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span
                aria-hidden
                className={`flex size-7 shrink-0 items-center justify-center rounded-sm border font-mono text-label ${
                  isDone
                    ? "border-accent bg-accent text-white dark:text-ink"
                    : isActive
                      ? "border-accent text-accent"
                      : "border-rule text-mute"
                }`}
              >
                {isDone ? (
                  <Check size={15} />
                ) : isActive ? (
                  <Spinner size="sm" label="" />
                ) : (
                  index + 1
                )}
              </span>
              <span
                className={
                  isActive
                    ? "font-medium text-ink"
                    : isDone
                      ? "text-mute"
                      : "text-mute/70"
                }
              >
                {label}
                {isActive && <span className="animate-pulse">…</span>}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-rule-soft pt-4">
        {/* One polite live region announces stage changes to screen readers. */}
        <p className="sr-only" role="status" aria-live="polite">
          {GENERATION_STAGES[activeStage]}
        </p>
        <p className="text-sm text-mute">
          Usually takes 15–30 seconds — keep this tab open.
        </p>
        <p className="font-mono text-label uppercase text-mute tabular">
          Elapsed {formatElapsed(elapsedSeconds)}
        </p>
      </div>
    </div>
  );
}
