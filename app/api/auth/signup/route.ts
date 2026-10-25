import { createClient } from "@/lib/supabase/server";
import { apiError, newCorrelationId, okJson } from "@/lib/api-utils";
import { signupSchema } from "@/lib/validation";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

// 5 signups / hour / IP.
const SIGNUP_LIMIT = 5;
const SIGNUP_WINDOW_MS = 60 * 60 * 1000;

export async function POST(request: Request) {
  const correlationId = newCorrelationId();
  const json = await request.json().catch(() => null);
  const parsed = signupSchema.safeParse(json);

  if (!parsed.success) {
    return apiError(
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid request.",
      correlationId,
    );
  }

  const ip = getClientIp(request.headers);
  const limit = rateLimit(`signup:${ip}`, SIGNUP_LIMIT, SIGNUP_WINDOW_MS);
  if (!limit.allowed) {
    return apiError(
      "RATE_LIMITED",
      "Too many accounts created from this network. Try again later.",
      correlationId,
    );
  }

  const origin = new URL(request.url).origin;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });

  if (error) {
    // Do not reveal whether the email is already registered.
    console.error(`[${correlationId}] signup failed:`, error.message);
    return apiError(
      "VALIDATION_ERROR",
      "We could not create that account. Check your details and try again.",
      correlationId,
    );
  }

  // Supabase returns an empty identities array when the email already exists.
  const alreadyRegistered = (data.user?.identities?.length ?? 0) === 0;

  return okJson({
    ok: true,
    // The UI shows the same neutral instruction either way (no enumeration).
    confirmRequired: !alreadyRegistered,
    redirect: "/login",
  });
}
