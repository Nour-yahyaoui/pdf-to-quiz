# Security notes

Decisions mapped to the `security/` and `platform/ai-features-in-production` skills.

## Access model (no accounts)

The product has no login. Anyone can generate a quiz; quizzes are reachable
through their unguessable UUID URL (capability URL) and listed only in the
browser that created them (localStorage history). There is no endpoint that
enumerates other quizzes.

### Database isolation

- Row Level Security is enabled on `quizzes`, `questions` and `attempts`.
- Policies allow the Postgres `anon` and `authenticated` roles to SELECT and
  INSERT only. There are deliberately **no UPDATE or DELETE policies and no
  table grants** for those operations, so every stored row is write-once and
  immutable from the client API. Verified: an `anon` UPDATE returns
  `42501 permission denied`.
- `user_id` is nullable; anonymous rows store no owner. The service-role key is
  accepted by the environment but the application never instantiates a
  service-role client — the anon client behind RLS is the only data path.
- Capability URLs are the boundary: UUIDv4 ids are unguessable, and no route
  lists ids globally. A quiz link can be shared intentionally by its holder.

## Input & API abuse defense

- `zod` validates every request body and the model's JSON output; strict
  objects reject unknown fields; strings and arrays are bounded.
- PDF uploads are checked twice (client and server): extension, 5 MB cap, and
  the `%PDF` magic bytes.
- Anonymous, IP-based rate limits: generation 8/minute and 30/hour,
  submission 30/minute. In-memory windows are defense-in-depth across a single
  serverless instance; the platform WAF is the shared-instance layer.
- One API error contract with machine code, safe human message and
  correlation id; detailed errors are logged server-side only.

## AI pipeline

- The Groq key is server-only; the browser only ever calls our route handler.
- Model output is treated as untrusted: parsed defensively (fence-stripping,
  bare-array support), schema-validated, retried once with a stricter prompt,
  then either accepted or failed with a typed error. It is never rendered as HTML.
- 45 s `AbortController` timeout; rate-limit/timeout fallback to
  `llama-3.1-8b-instant`; prompts are versioned in `lib/groq/prompts.ts`.
- Groq failures are classified (`lib/groq/errors.ts`, unit-tested) into
  token-per-minute, request-per-minute, daily-quota, bad-key and timeout cases,
  each with an accurate user message and a `Retry-After` header where provided.
- Source text is truncated to 24k characters (~6k tokens) on a word boundary.

## File handling & privacy

- PDFs are parsed in memory (`pdf-parse`, Node runtime) and never written to
  disk, object storage, logs, or the database. Only generated text is persisted.
- No personal data is collected: no accounts, emails, analytics events, or
  identifiers. Request logs keep correlation ids, not file content.

## Secrets

- `.env.local` is gitignored; `.env.example` ships placeholders only.
- `npm run secrets:scan` greps tracked files for high-confidence key patterns.
- Env validation is lazy so CI builds succeed without secrets; a real request
  fails fast naming the missing variable, never its value.
- Accepted risk: the Groq API key was shared in chat during setup — rotate it
  in the Groq console and update Vercel/local env when convenient.

## Dependencies

- All versions pinned exact in `package.json`; lockfile committed; `npm ci` in deploy.
- `npm audit`: zero critical/high. Three moderate advisories remain in the
  Tailwind 3 / PostCSS build-time chain (selector-parser CPU exhaustion). They
  execute on our own CSS at build time with no untrusted input; tracked for the
  Tailwind 4 migration.
