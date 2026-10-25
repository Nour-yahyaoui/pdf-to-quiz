import { z } from "zod";
import type { Difficulty } from "@/lib/types";

/**
 * Every external input is validated at the boundary with zod (api-abuse-defense
 * skill). Unknown keys are rejected; strings and arrays are bounded.
 */

export const DIFFICULTIES: readonly Difficulty[] = ["easy", "medium", "hard"];

export const difficultySchema = z.enum(DIFFICULTIES);

// Vercel rejects request bodies over 4.5 MB with a platform HTML error, so
// the app cap stays just under that to keep every rejection a JSON response.
export const MAX_PDF_BYTES = Math.floor(4.5 * 1024 * 1024); // 4.5 MB, client AND server

export const submitQuizSchema = z
  .object({
    quizId: z.string().uuid(),
    answers: z.array(z.string().max(500)).min(1).max(10),
  })
  .strict();

export type SubmitQuizInput = z.infer<typeof submitQuizSchema>;
