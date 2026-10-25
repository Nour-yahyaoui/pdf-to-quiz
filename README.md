# PDF to Quiz

**Live:** https://pdf-to-quiz-neon.vercel.app

Upload a PDF (max 4.5 MB) and get a ten-question multiple-choice quiz in seconds —
**no account or sign-up required**. The document is parsed in memory, Groq's
`llama-3.3-70b-versatile` writes the questions, and quizzes are reachable via
unique links and remembered in the visitor's own browser.

- **Framework:** Next.js 16 (App Router) · React 19 · TypeScript
- **Styling:** Tailwind CSS, "Exam Paper" design system — see [`docs/STYLE.md`](docs/STYLE.md)
- **Database:** Supabase (Postgres, RLS) — anonymous access, write-once rows
- **AI:** Groq via `groq-sdk`, with `llama-3.1-8b-instant` fallback and token-limit handling
- **PDF parsing:** `pdf-parse` v2, server-side, in-memory only
- **Extras:** dark mode (`next-themes`), toasts (`sonner`), confetti, vitest

## How it works

1. Drag and drop a PDF and pick easy / medium / hard.
2. The server validates the file, extracts text, and calls Groq with a versioned
   JSON prompt (retry once with a stricter prompt on malformed output).
3. Questions are saved behind Row Level Security; the quiz runner never receives
   correct answers in the browser.
4. Submission is scored server-side, the attempt is stored, and the results page
   marks every answer with explanations — confetti above 70%.
5. The quiz id is kept in this browser's `localStorage`, so the dashboard lists
   quizzes created on the device without any login.

## No-account model

- No Supabase Auth, no login or signup screens, no middleware.
- RLS policies grant the Postgres `anon` role `SELECT`/`INSERT` only — there are
  deliberately no `UPDATE`/`DELETE` policies or grants, so stored rows are immutable.
- Quiz URLs contain an unguessable UUID (capability URL). Anyone with the link can
  open the quiz; there is no global listing endpoint in the application.

## Groq free-tier handling

The free trial enforces separate requests-per-minute and tokens-per-minute windows
plus a daily quota. The app handles all three explicitly:

- **429 (token/request limit):** short backoff, then automatic retry on
  `llama-3.1-8b-instant`, which has its own separate allowance.
- **Still limited:** a precise message — e.g. *"Groq's free-tier token limit was
  reached. It resets every minute — wait about 30 seconds and try again."* — with a
  **Try again** button and a `Retry-After` header.
- **Quota exhausted:** a distinct message explaining the daily reset.
- **Timeout (45 s):** one retry on the fallback model, then a clear error.

## Local setup

```bash
npm ci
cp .env.example .env.local   # fill in the three variables
npm run dev                  # http://localhost:3000
```

Required environment variables:

| Variable | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase API keys | Public, RLS still applies |
| `GROQ_API_KEY` | console.groq.com | Server only |

`SUPABASE_SERVICE_ROLE_KEY` is accepted for compatibility but never used — the
app only ever talks to Postgres through the anon client behind RLS.

### Database

Apply the migrations in `supabase/migrations/` in order:

1. `0001_init.sql` — tables, constraints, indexes
2. `0002_anonymous_access.sql` — nullable owner, public RLS policies
3. `0003_anon_grants.sql` — table grants for the `anon` role (RLS alone is not enough)

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (passes without secrets) |
| `npm test` | vitest unit tests (27 tests) |
| `npm run lint` | ESLint 9 flat config |
| `npm run typecheck` | Strict TypeScript check |
| `npm run secrets:scan` | Fail if a secret pattern is tracked in git |

## Project map

```
app/
  page.tsx                  Landing (public)
  create/                   Upload + difficulty + generation
  dashboard/                Browser-local quiz history (localStorage)
  quiz/[id]/                Quiz runner (safe fields only)
  quiz/[id]/results/        Score, confetti, answer review
  api/generate-quiz/        PDF parse + Groq + persistence
  api/submit-quiz/          Server scoring + attempt storage
lib/
  groq/                     Client, versioned prompts, error classifier, retry policy
  pdf/                      In-memory extraction
  quiz/                     JSON parser (zod) and pure scoring
  history.ts                useSyncExternalStore localStorage history
  supabase/                 SSR anon client + database types
```

## Security

RLS on every table with write-once grants, zod validation of all inputs and model
output, IP-based rate limits, no PDF storage, and a secret-scan gate. Full details
in [`docs/SECURITY.md`](docs/SECURITY.md).

## Deployment

Deploys to Vercel with the Next.js preset. Environment variables are set in the
Vercel project (production + preview). Migrations run separately against Supabase.
See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).
