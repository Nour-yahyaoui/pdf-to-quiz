"use client";

import { Toaster as SonnerToaster } from "sonner";
import { useTheme } from "next-themes";

export function Toaster() {
  const { resolvedTheme } = useTheme();
  return (
    <SonnerToaster
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            "bg-raised text-ink border border-rule rounded-sm shadow-float",
          error: "text-danger",
          success: "text-success",
        },
      }}
    />
  );
}
