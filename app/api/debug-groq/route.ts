import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { buildDiagnostics } from "@/lib/diagnostics";

// TEMPORARY diagnostic endpoint (v2.0.3): reports whether the production
// function can reach Groq and Supabase with the configured environment.
// Read-only, rate limited, and every value is sanitised — no secrets are
// ever returned. Scheduled for removal once the generation failure is
// resolved. The same checks render as a page at /debug.
export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const wantsJson = requestUrl.searchParams.get("format") === "json";
  const fast = requestUrl.searchParams.get("fast") === "1";
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

  const checks = await buildDiagnostics(fast);

  if (wantsJson) {
    return Response.json(checks, { headers: { "Cache-Control": "no-store" } });
  }
  return htmlResponse(200, checks);
}

function esc(value: unknown): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function rows(prefix: string, value: unknown): string {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, nested]) => rows(prefix ? `${prefix} · ${key}` : key, nested))
      .join("");
  }
  return `<tr><th scope="row">${esc(prefix)}</th><td>${esc(JSON.stringify(value))}</td></tr>`;
}

function htmlResponse(status: number, body: unknown, retryAfterSeconds?: number) {
  const headers: Record<string, string> = { "Cache-Control": "no-store" };
  if (retryAfterSeconds) headers["Retry-After"] = String(retryAfterSeconds);
  const html =
    `<!doctype html><html lang="en"><head><meta charset="utf-8">` +
    `<meta name="robots" content="noindex"><title>PDF to Quiz diagnostics</title></head>` +
    `<body style="font-family:system-ui,sans-serif;margin:2rem;line-height:1.6">` +
    `<h1>PDF to Quiz production diagnostics</h1>` +
    `<p>Temporary read-only health check. No secret values are shown.</p>` +
    `<table border="1" cellpadding="8" style="border-collapse:collapse">` +
    `<thead><tr><th>Check</th><th>Result</th></tr></thead><tbody>${rows("", body)}</tbody></table>` +
    `</body></html>`;
  return new Response(html, {
    status,
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
  });
}
