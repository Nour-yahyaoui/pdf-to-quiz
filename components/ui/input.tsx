import type { ComponentProps } from "react";

const base =
  "w-full rounded-sm border border-rule bg-raised px-4 py-3 text-ink " +
  "placeholder:text-mute/70 min-h-11 transition-colors " +
  "focus:border-accent focus-visible:outline-2 " +
  "aria-[invalid=true]:border-danger";

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={`${base} ${className ?? ""}`} {...rest} />;
}
