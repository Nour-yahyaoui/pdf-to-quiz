import { createClient } from "@/lib/supabase/server";
import { apiError, newCorrelationId, okJson } from "@/lib/api-utils";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const correlationId = newCorrelationId();
  const ip = getClientIp(request.headers);
  const limit = rateLimit(`oauth:${ip}`, 20, 10 * 60 * 1000);
  if (!limit.allowed) {
    return apiError("RATE_LIMITED", "Too many requests. Try again shortly.", correlationId);
  }

  const origin = new URL(request.url).origin;
  const supabase = await createClient();

  // Supabase manages the OAuth state/PKCE parameters internally.
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) {
    console.error(`[${correlationId}] oauth start failed:`, error?.message);
    return apiError(
      "INTERNAL_ERROR",
      "Google sign-in could not be started. Please use email and password for now.",
      correlationId,
    );
  }

  return okJson({ url: data.url });
}
