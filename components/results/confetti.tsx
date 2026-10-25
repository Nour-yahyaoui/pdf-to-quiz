"use client";

import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";

const PALETTE = ["#4F46E5", "#2F6B45", "#A9701A", "#1C1933", "#8B80F9"];

/** Fires once on mount. Honors reduced-motion preferences. */
export function Confetti() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    confetti({
      particleCount: 130,
      spread: 78,
      origin: { y: 0.28 },
      colors: PALETTE,
      disableForReducedMotion: true,
    });
  }, []);

  return null;
}
