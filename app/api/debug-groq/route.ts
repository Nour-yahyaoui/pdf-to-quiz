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
  const wantsJson = new URL(request.url).searchParams.get("format") === "json";
  const ip = getClientIp(request.headers);
  const limit = rateLimit(`debug:min:${ip}`, 5, 60 * 1000);
  if (!limit.allowed) {
    const body = { error: { code: "RATE_LIMITED", message: "Too many diagnostic checks." } };
    return wantsJson
      ? Response.json(body, {
          status: 429,
          headers: { "Retry-After": String(limit.retryAfterSeconds) },
        })
      : htmlResponse(429, body, limit.retryAfterSeconds);
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

  if (wantsJson) {
    return Response.json(checks, { headers: { "Cache-Control": "no-store" } });
  }
  return htmlResponse(200, checks);
}

function htmlResponse(status: number, body: unknown, retryAfterSeconds?: number) {
  const json = JSON.stringify(body, null, 2);
  const escaped = json
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (retryAfterSeconds) headers["Retry-After"] = String(retryAfterSeconds);
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>PDF to Quiz — diagnostics</title>` +
      `<style>body{font:14px/1.5 ui-monospace,Menlo,Consolas,monospace;margin:2rem;background:#f7f5f0;color:#1a1a2e}` +
      `h1{font:600 1.1rem system-ui,sans-serif}pre{white-space:pre-wrap;word-break:break-word}</style></head>` +
      `<body><h1>PDF to Quiz — production diagnostics (temporary)</h1><pre>${escaped}</pre></body></html>`,
    { status, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } },
  );
}
