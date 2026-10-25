import { z } from "zod";

/**
 * Server-side environment validation. Imported only by route handlers and
 * server code — never by client components. Fails fast at boot if a secret
 * is missing or malformed instead of failing deep inside a request.
 */
const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  // Present for completeness/parity with the deployment env. The app never
  // builds a service-role client: RLS is the only data-access path.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20).optional(),
  GROQ_API_KEY: z.string().startsWith("gsk_", "Groq API keys start with gsk_"),
});

const parsed = serverEnvSchema.safeParse(process.env);

if (!parsed.success) {
  // Do not echo values — list only the missing/invalid variable names.
  const fields = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
  throw new Error(`Invalid or missing server environment variables: ${fields}`);
}

export const env = parsed.data;
