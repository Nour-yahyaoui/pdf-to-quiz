import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { classifyGroqError } from "@/lib/groq/errors";
// Importing the extractor runs its module side effect that registers the
// in-process pdfjs worker on globalThis (the v2.0.1 serverless fix).
import { extractPdfText } from "@/lib/pdf/extract";

// TEMPORARY diagnostic endpoint (v2.0.3): reports whether the production
// function can reach Groq and Supabase with the configured environment.
// Read-only, rate limited, and every value is sanitised — no secrets are
// ever returned. Scheduled for removal once the generation failure is
// resolved. See PR description for the full investigation.
export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: Request) {
  const ip = getClientIp(request.headers);
  const limit = rateLimit(`debug:min:${ip}`, 5, 60 * 1000);
  if (!limit.allowed) {
    return Response.json(
      { error: { code: "RATE_LIMITED", message: "Too many diagnostic checks." } },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  const checks: Record<string, unknown> = {
    node: process.version,
    time: new Date().toISOString(),
  };

  // 1. Environment shape — presence and prefix only, never the value.
  const groqKey = process.env.GROQ_API_KEY ?? "";
  checks.env = {
    GROQ_API_KEY: {
      present: groqKey.length > 0,
      startsWithGsk: groqKey.startsWith("gsk_"),
      length: groqKey.length,
    },
    NEXT_PUBLIC_SUPABASE_URL: { present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
  };

  // 2. The in-process pdfjs worker must be registered (the v2.0.1 fix).
  checks.pdfWorker = {
    registered: Boolean(globalThis.pdfjsWorker?.WorkerMessageHandler),
    extractorLoaded: typeof extractPdfText === "function",
  };

  // 3. Live, minimal Groq call on the fast fallback model (15s ceiling).
  if (groqKey.length > 0) {
    try {
      const client = new Groq({ apiKey: groqKey });
      const startedAt = Date.now();
      const completion = await client.chat.completions.create(
        {
          model: "llama-3.1-8b-instant",
          max_tokens: 5,
          messages: [{ role: "user", content: "Reply with the single word: ok" }],
        },
        { signal: AbortSignal.timeout(15_000) },
      );
      checks.groq = {
        ok: true,
        model: completion.model,
        latencyMs: Date.now() - startedAt,
        reply: (completion.choices[0]?.message?.content ?? "").slice(0, 40),
      };
    } catch (error) {
      const failure = classifyGroqError(error);
      checks.groq = {
        ok: false,
        kind: failure.kind,
        status: failure.status,
        retryAfterSeconds: failure.retryAfterSeconds,
        message: failure.message,
      };
    }
  } else {
    checks.groq = { ok: false, skipped: "GROQ_API_KEY is not set in this environment" };
  }

  // 4. Supabase reachability through the RLS client (read-only head query).
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("quizzes")
      .select("id", { count: "exact", head: true });
    checks.supabase = error
      ? { ok: false, message: error.message.slice(0, 150) }
      : { ok: true };
  } catch (error) {
    checks.supabase = {
      ok: false,
      message: error instanceof Error ? error.message.slice(0, 150) : "unknown error",
    };
  }

  return Response.json(checks, { headers: { "Cache-Control": "no-store" } });
}
