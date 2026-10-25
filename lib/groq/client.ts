import Groq from "groq-sdk";
import { getEnv } from "@/lib/env";

/**
 * Server-only singleton. The API key never leaves the server — browsers only
 * ever talk to /api/generate-quiz (ai-features-in-production skill).
 */
let client: Groq | null = null;

export function getGroqClient(): Groq {
  if (!client) {
    client = new Groq({ apiKey: getEnv().GROQ_API_KEY });
  }
  return client;
}

// Groq retired llama-3.3-70b-versatile and llama-3.1-8b-instant for free and
// developer keys on 2026-08-16. gpt-oss-120b is Groq's recommended 70B-class
// replacement; gpt-oss-20b replaces the 8B instant model and keeps its own,
// higher rate-limit allowance for fallback traffic.
export const PRIMARY_MODEL = "openai/gpt-oss-120b";
export const FALLBACK_MODEL = "openai/gpt-oss-20b";
