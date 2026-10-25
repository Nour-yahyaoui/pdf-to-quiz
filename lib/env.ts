import { z } from "zod";

/**
 * Server-side environment validation. Imported only by server code — never by
 * client components. Validation is lazy so `next build` succeeds in CI without
 * secrets; a real request fails fast with the missing variable names instead.
 */
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  // Present for parity with the deployment env. The app never builds a
  // service-role client: RLS is the only data-access path.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  GROQ_API_KEY: z.string().startsWith("gsk_", "Groq API keys start with gsk_"),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;
let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // Do not echo values — list only the missing/invalid variable names.
    const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Invalid or missing server environment variables: ${fields}`);
  }

  cached = parsed.data;
  return cached;
}
