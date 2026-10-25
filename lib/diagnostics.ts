import Groq from "groq-sdk";
import { createClient } from "@/lib/supabase/server";
import { classifyGroqError } from "@/lib/groq/errors";
// Side effect: registers the in-process pdfjs worker on globalThis.
import "@/lib/pdf/extract";

/**
 * TEMPORARY production self-check (v2.0.3, removed with the debug page).
 * Builds a sanitised diagnostic object — never includes secret values,
 * only presence, prefixes, lengths, and classified failure reasons.
 */
export async function buildDiagnostics(fast = false): Promise<Record<string, unknown>> {
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
  };

  if (fast) {
    checks.groq = { ok: null, skipped: "fast mode — live call skipped" };
    checks.supabase = { ok: null, skipped: "fast mode — live call skipped" };
    return checks;
  }

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

  return checks;
}

/** Flatten a nested object into dot/separator-labelled rows for display. */
export function flattenDiagnostics(
  value: unknown,
  prefix = "",
): Array<{ label: string; value: string }> {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>).flatMap(([key, nested]) =>
      flattenDiagnostics(nested, prefix ? `${prefix} · ${key}` : key),
    );
  }
  return [{ label: prefix, value: JSON.stringify(value) }];
}
