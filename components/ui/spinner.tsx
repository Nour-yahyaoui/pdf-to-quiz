import { Loader2 } from "lucide-react";
import type { ComponentProps } from "react";

type SpinnerSize = "sm" | "md" | "lg";

const sizeClass: Record<SpinnerSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-7",
};

interface SpinnerProps extends Omit<ComponentProps<typeof Loader2>, "size"> {
  size?: SpinnerSize;
  /** Accessible label; defaults to a generic loading announcement. */
  label?: string;
}

/**
 * Single spinner used by every pending state. The icon is decorative — pair
 * it with visible status text or pass `label` for stand-alone use.
 */
export function Spinner({ size = "md", label, className = "", ...rest }: SpinnerProps) {
  return (
    <span {...(label ? { role: "status" } : { "aria-hidden": true })} className="inline-flex">
      <Loader2
        aria-hidden="true"
        className={`animate-spin ${sizeClass[size]} ${className}`.trim()}
        {...rest}
      />
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
}
