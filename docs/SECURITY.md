# Security notes

Decisions mapped to the `security/` and `platform/ai-features-in-production` skills.

## Authentication & sessions
- Managed auth via Supabase Auth (`@supabase/ssr`), cookie-based sessions. No
  hand-rolled tokens, no JWTs in `localStorage`.
- Middleware refreshes sessions on every request and redirects unauthenticated
  visitors away from `/dashboard`, `/create`, `/quiz/*`. Every protected page
  also re-checks the user server-side — the middleware is never the only gate.
- Login/signup responses are generic on failure: no account enumeration.
- OAuth (Google) uses Supabase's PKCE flow with an exact `/auth/callback` redirect.
  Note: the Google provider must be enabled in the Supabase dashboard with Google
  Cloud credentials before the button works.
- Signup passwords: minimum 12 characters, no composition rules, managers allowed.

## Authorization & data isolation
- Row Level Security is enabled on `quizzes`, `questions` and `attempts`.
- All application queries use the cookie-authenticated user client, so RLS runs
  on every row. The service-role key exists in the environment for parity but
  the application intentionally never instantiates a service-role client.
- Questions are gated through quiz ownership; attempts and quizzes require
  `auth.uid() = user_id` for every operation.

## Input & API abuse defense
- `zod` validates every request body and the model's JSON output; strict objects
  reject unknown fields; strings and arrays are bounded.
- PDF uploads are checked twice (client and server): extension, 5 MB cap, and
  the `%PDF` magic bytes.
- Rate limits: login 10/15 min/IP, signup 5/hour/IP, generation 8/min/user,
  plus a durable **20 quizzes/day/user quota counted in the database** (the
  shared-store control that survives serverless instances). In-memory counters
  are documented as defense-in-depth, not a hard guarantee.
- One API error contract with machine code, safe human message and correlation
  id; detailed errors are logged server-side only.

## AI pipeline
- The Groq key is server-only; the browser only ever calls our route handler.
- Model output is treated as untrusted: parsed defensively (fence-stripping,
  bare-array support), schema-validated, retried once with a stricter prompt,
  then either accepted or failed with a typed error. It is never rendered as HTML.
- 45 s `AbortController` timeout; rate-limit/timeout fallback to
  `llama-3.1-8b-instant`; prompts are versioned in `lib/groq/prompts.ts`.
- Source text is truncated to 24k characters (~6k tokens) on a word boundary.

## File handling & privacy
- PDFs are parsed in memory (`pdf-parse`, Node runtime) and never written to
  disk, object storage, logs, or the database. Only generated text is persisted.
- No personal data in URLs, logs, or analytics events.

## Secrets
- `.env.local` is gitignored; `.env.example` ships placeholders only.
- `npm run secrets:scan` greps tracked files for high-confidence key patterns
  and runs in CI before deploy.
- Accepted risk: the Groq API key was shared in chat during setup — rotate it
  in the Groq console and update Vercel/local env when convenient.

## Dependencies
- All versions pinned exact in `package.json`; lockfile committed.
- `npm audit`: zero critical/high. Three moderate advisories remain in the
  Tailwind 3 / PostCSS build-time chain (selector-parser CPU exhaustion). They
  execute on our own CSS at build time with no untrusted input; tracked for the
  Tailwind 4 migration.
