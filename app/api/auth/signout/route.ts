import { createClient } from "@/lib/supabase/server";
import { okJson } from "@/lib/api-utils";

export async function POST() {
  const supabase = await createClient();
  // Signing out invalidates the session server-side, not just the cookie.
  await supabase.auth.signOut();
  return okJson({ ok: true, redirect: "/" });
}
