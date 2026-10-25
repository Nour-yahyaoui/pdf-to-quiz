# Deployment record

## Verified production deployment (2026-10-25)

- **Vercel project:** `pdf-to-quiz` (`prj_LzpHyzYP7WiZc1K7bYp3IWAtiB3j`)
- **Deployment:** `dpl_z5UanySGZuLzBHx7SQKKUwvsEWPw` — state `READY`, substate `PROMOTED`
- **Framework preset:** Next.js · Node 24.x · Turbopack · region iad1
- **Source:** branch `arena/5a139d5c-pdf-to-quiz`, SHA `d370656` of `Nour-yahyaoui/pdf-to-quiz`
- **Public production URL:** https://pdf-to-quiz-neon.vercel.app
- Team alias: https://pdf-to-quiz-nour-yahyaouis-projects.vercel.app
- Build time: ~37 s. All four environment variables were present in the build.

## Environment variables (set in Vercel, all targets)

| Key | Type |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | plain |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | plain |
| `SUPABASE_SERVICE_ROLE_KEY` | sensitive (unused by app code; RLS-only architecture) |
| `GROQ_API_KEY` | sensitive |

## Smoke test results

| Check | Result |
| --- | --- |
| `GET /` | 200 — full landing page incl. Groq badge and spec table |
| `GET /login`, `/signup` | 200 — auth cards render |
| `GET /dashboard` unauthenticated | 307 → `/login?redirectedFrom=%2Fdashboard` |
| `GET /quiz/<id>` unauthenticated | 307 → `/login` |
| `POST /api/generate-quiz` unauthenticated | 401 with the standard error contract |
| `GET /icon.svg` | 200 |
| Local `npm run build` | passes, 15 routes |
| `npm test` | 22/22 passing |
| `npm run secrets:scan` | clean |

## Known follow-ups

1. **Vercel Deployment Protection (SSO):** the project was created with
   `ssoProtection = all_except_custom_domains`. The released production alias
   `pdf-to-quiz-neon.vercel.app` serves publicly; the team-scoped
   `*.vercel.app` alias shows Vercel's SSO wall. For a single clean public URL,
   in Vercel go to **Settings → Deployment Protection → Vercel Authentication →
   Disabled** (or "Preview only"). The connected toolset cannot toggle this field.
2. **Google OAuth:** enable the Google provider in Supabase
   (Authentication → Providers) with Google Cloud OAuth credentials and add the
   Vercel origin to the allowed redirect URLs. Email/password works without this.
3. **Groq key rotation:** the key was shared in chat during setup; rotate it in
   the Groq console and update the Vercel env var when convenient.
4. Supabase email confirmation: if enabled, new users must confirm via email
   before their first sign-in.
