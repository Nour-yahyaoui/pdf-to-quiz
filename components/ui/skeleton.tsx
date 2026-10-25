import type { ComponentProps } from "react";

/**
 * One skeleton block for every loading surface. Uses the same pulse and
 * hairline palette as the raised sheets it stands in for, so route-level
 * loading.tsx screens and inline pending states read identically.
 *
 * The global reduced-motion rule in globals.css neutralises the pulse for
 * users who prefer less motion; the block itself stays visible.
 */
export function Skeleton({ className = "", ...rest }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-sm bg-rule ${className}`}
      {...rest}
    />
  );
}
