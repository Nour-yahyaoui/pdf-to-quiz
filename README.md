# PDF to Quiz

**Live:** https://pdf-to-quiz-neon.vercel.app

Upload a PDF (max 5 MB) and get a ten-question multiple-choice quiz in seconds.
The document is parsed in memory, Groq's `llama-3.3-70b-versatile` writes the
questions, and every quiz and attempt is saved privately to the user's account.

- **Framework:** Next.js 16 (App Router) · React 19 · TypeScript
- **Styling:** Tailwind CSS, "Exam Paper" design system — see [`docs/STYLE.md`](docs/STYLE.md)
- **Database & auth:** Supabase (Postgres, RLS, email/password + Google OAuth)
- **AI:** Groq via `groq-sdk`, with `llama-3.1-8b-instant` fallback
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

## Local setup

```bash
npm ci
cp .env.example .env.local   # fill in the four variables
npm run dev                  # http://localhost:3000
```

Required environment variables:

| Variable | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase API keys | Public, RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase API keys | Server only; app intentionally never uses it |
| `GROQ_API_KEY` | console.groq.com | Server only |

### Database

Apply [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
in the Supabase SQL editor (or via the management API). It creates `quizzes`,
`questions`, `attempts`, indexes, and owner-only RLS policies.

Google OAuth additionally needs a Google Cloud client configured in
**Authentication → Providers** in the Supabase dashboard.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | vitest unit tests (22 tests) |
| `npm run typecheck` | Strict TypeScript check |
| `npm run secrets:scan` | Fail if a secret pattern is tracked in git |

## Project map

```
app/
  page.tsx                  Landing (public)
  login/ signup/            Auth pages
  dashboard/                Quiz list with loading/empty/error states
  create/                   Upload + difficulty + generation
  quiz/[id]/                Quiz runner (safe fields only)
  quiz/[id]/results/        Score, confetti, answer review
  api/generate-quiz/        PDF parse + Groq + persistence
  api/submit-quiz/          Server scoring + attempt storage
  api/auth/*, auth/callback Auth handlers and OAuth exchange
lib/
  groq/                     Client, versioned prompts, retry policy
  pdf/                      In-memory extraction
  quiz/                     JSON parser (zod) and pure scoring
  supabase/                 SSR browser/server/middleware clients
```

## Security

RLS on every table, server-side validation of all inputs and model output,
per-user rate limits and a daily generation quota, no PDF storage, and a
secret-scan gate. Full details in [`docs/SECURITY.md`](docs/SECURITY.md).

## Deployment

Deploys to Vercel with the Next.js preset. All four environment variables must
be set in the Vercel project (production + preview). Migrations run separately
against Supabase and are never part of the build.
