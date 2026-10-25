"use client";

import { useEffect, useRef } from "react";
import { recordAttempt } from "@/lib/history";
import type { Difficulty } from "@/lib/types";

interface AttemptRecorderProps {
  quizId: string;
  score: number;
  total: number;
  pdfName: string;
  difficulty?: Difficulty | null;
}

/** Writes the latest score into this browser's local history, once. */
export function AttemptRecorder({ quizId, score, total, pdfName, difficulty }: AttemptRecorderProps) {
  const recorded = useRef(false);

  useEffect(() => {
    if (recorded.current) return;
    recorded.current = true;
    recordAttempt(quizId, score, total, { pdf_name: pdfName, difficulty: difficulty ?? null });
  }, [quizId, score, total, pdfName, difficulty]);

  return null;
}
