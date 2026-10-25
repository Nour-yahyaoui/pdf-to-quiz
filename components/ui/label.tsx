import type { ComponentProps } from "react";

export function Label({ className, ...rest }: ComponentProps<"label">) {
  return (
    <label
      className={`block font-mono text-label uppercase text-mute mb-2 ${className ?? ""}`}
      {...rest}
    />
  );
}
