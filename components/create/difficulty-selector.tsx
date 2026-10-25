"use client";

import type { Difficulty } from "@/lib/types";

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (value: Difficulty) => void;
  disabled?: boolean;
}

const OPTIONS: {
  value: Difficulty;
  label: string;
  hint: string;
}[] = [
  { value: "easy", label: "Easy", hint: "Recall and definitions from the text" },
  { value: "medium", label: "Medium", hint: "Understanding and relationships" },
  { value: "hard", label: "Hard", hint: "Analysis and applying ideas" },
];

export function DifficultySelector({ value, onChange, disabled }: DifficultySelectorProps) {
  return (
    <fieldset disabled={disabled}>
      <legend className="exam-label mb-3">Step 2 — choose difficulty</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={`flex min-h-20 cursor-pointer flex-col justify-center gap-1 rounded-md border p-4 transition-colors ${
                selected
                  ? "border-accent bg-accent-tint"
                  : "border-rule bg-raised hover:border-accent/50"
              } ${disabled ? "opacity-60" : ""}`}
            >
              <span className="flex items-center gap-2.5">
                <input
                  type="radio"
                  name="difficulty"
                  value={option.value}
                  checked={selected}
                  onChange={() => onChange(option.value)}
                  className="h-4 w-4 accent-[rgb(var(--accent))]"
                />
                <span className="font-medium text-ink">{option.label}</span>
              </span>
              <span className="pl-7 text-sm text-mute">{option.hint}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
