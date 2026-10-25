# Deployment record

## Verified production deployment

- **Vercel project:** `pdf-to-quiz` (`prj_LzpHyzYP7WiZc1K7bYp3IWAtiB3j`)
- **Framework preset:** Next.js · Node 24.x · Turbopack · region iad1
- **Public production URL:** https://pdf-to-quiz-neon.vercel.app
- Team alias: https://pdf-to-quiz-nour-yahyaouis-projects.vercel.app
- All required environment variables are present in the build.

## Environment variables (set in Vercel, all targets)

| Key | Type | Used |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | plain | yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | plain | yes |
| `GROQ_API_KEY` | sensitive | yes (server only) |
| `SUPABASE_SERVICE_ROLE_KEY` | sensitive | unused — kept for compatibility |

## Smoke test checklist (anonymous build)

| Check | Expected |
| --- | --- |
| `GET /` | 200 — landing page |
| `GET /create`, `/dashboard` | 200 — no redirect, no login wall |
| `GET /login`, `/signup` | 404 — routes removed |
| `POST /api/generate-quiz` without multipart | 400 standard error contract (no 401) |
| `POST /api/submit-quiz` with bad payload | 400 validation error |
| Postgres `anon` role | SELECT/INSERT allowed; UPDATE/DELETE denied (42501) |
| `npm run build` | passes without secrets (lazy env validation) |
| `npm test` | all passing |
| `npm run secrets:scan` | clean |

## Database migrations (apply in order)

1. `0001_init.sql` — quizzes/questions/attempts, constraints, indexes
2. `0002_anonymous_access.sql` — nullable `user_id`, public RLS policies
3. `0003_anon_grants.sql` — GRANT SELECT/INSERT to `anon`/`authenticated`

Note: RLS policies alone are insufficient — the Postgres roles also need
table-level GRANTs, which migration 0003 adds.

## Known follow-ups

1. **Vercel Deployment Protection (SSO):** the project was created with
   `ssoProtection = all_except_custom_domains`. The released production alias
   `pdf-to-quiz-neon.vercel.app` serves publicly; the team-scoped
   `*.vercel.app` alias shows Vercel's SSO wall. For a single clean public URL,
   in Vercel go to **Settings → Deployment Protection → Vercel Authentication →
   Disabled** (the connected toolset cannot toggle this field).
2. **Groq free-tier limits:** when the token/request window is hit the UI shows
   a precise retry message and a Try-again button; the fallback 8B model is
   tried automatically first. If the daily quota is exhausted, generation
   resumes after the Groq reset.
3. **Groq key rotation:** the key was shared in chat during setup; rotate it in
   the Groq console and update the Vercel env var when convenient.
