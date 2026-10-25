import { createClient } from "@/lib/supabase/server";
import { apiError, newCorrelationId, okJson } from "@/lib/api-utils";
import { loginSchema } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// 10 attempts / 15 min / IP — auth-and-access skill guidance.
const LOGIN_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const correlationId = newCorrelationId();
  const json = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(json);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid request.",
      correlationId,
    );
  }

  const ip = getClientIp(request.headers);
  const limit = rateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);
  if (!limit.allowed) {
    return apiError(
      "RATE_LIMITED",
      "Too many sign-in attempts. Try again in a minute.",
      correlationId,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // Generic message for every failure — no account enumeration.
    return apiError(
      "UNAUTHENTICATED",
      "Invalid email or password.",
      correlationId,
    );
  }

  return okJson({ ok: true, redirect: "/dashboard" });
}
