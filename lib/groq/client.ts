import Groq from "groq-sdk";
import { env } from "@/lib/env";

/**
 * Server-only singleton. The API key never leaves the server — browsers only
 * ever talk to /api/generate-quiz (ai-features-in-production skill).
 */
let client: Groq | null = null;

export function getGroqClient(): Groq {
  if (!client) {
    client = new Groq({ apiKey: env.GROQ_API_KEY });
  }
  return client;
}

export const PRIMARY_MODEL = "llama-3.3-70b-versatile";
export const FALLBACK_MODEL = "llama-3.1-8b-instant";
