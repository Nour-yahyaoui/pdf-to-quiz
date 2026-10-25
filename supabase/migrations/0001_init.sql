-- PDF to Quiz — initial schema
-- Applied through the Supabase connection (create_migration).
-- Every table enforces Row Level Security: users only ever see their own rows.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Table: quizzes
-- ---------------------------------------------------------------------------
create table if not exists public.quizzes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  pdf_name    text not null,
  difficulty  text check (difficulty in ('easy', 'medium', 'hard')),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Table: questions
-- options must be a JSON array of exactly 4 strings.
-- ---------------------------------------------------------------------------
create table if not exists public.questions (
  id              uuid primary key default gen_random_uuid(),
  quiz_id         uuid not null references public.quizzes (id) on delete cascade,
  question_text   text not null,
  options         jsonb not null,
  correct_answer  text not null,
  explanation     text,
  order_index     integer not null check (order_index >= 0),
  constraint questions_options_are_four check (
    jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4
  )
);

-- ---------------------------------------------------------------------------
-- Table: attempts
-- ---------------------------------------------------------------------------
create table if not exists public.attempts (
  id               uuid primary key default gen_random_uuid(),
  quiz_id          uuid not null references public.quizzes (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  score            integer not null check (score >= 0),
  total_questions  integer not null check (total_questions > 0 and score <= total_questions),
  answers          jsonb,
  completed_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes for the real query paths (dashboard list, quiz fetch, history)
-- ---------------------------------------------------------------------------
create index if not exists quizzes_user_created_idx
  on public.quizzes (user_id, created_at desc);
create index if not exists questions_quiz_order_idx
  on public.questions (quiz_id, order_index);
create index if not exists attempts_user_completed_idx
  on public.attempts (user_id, completed_at desc);
create index if not exists attempts_quiz_idx
  on public.attempts (quiz_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.quizzes   enable row level security;
alter table public.questions enable row level security;
alter table public.attempts  enable row level security;

-- quizzes: owner-only CRUD
create policy "quizzes_select_own" on public.quizzes
  for select using (auth.uid() = user_id);
create policy "quizzes_insert_own" on public.quizzes
  for insert with check (auth.uid() = user_id);
create policy "quizzes_update_own" on public.quizzes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quizzes_delete_own" on public.quizzes
  for delete using (auth.uid() = user_id);

-- questions: access only through a quiz the caller owns
create policy "questions_select_own" on public.questions
  for select using (
    exists (
      select 1 from public.quizzes q
      where q.id = questions.quiz_id and q.user_id = auth.uid()
    )
  );
create policy "questions_insert_own" on public.questions
  for insert with check (
    exists (
      select 1 from public.quizzes q
      where q.id = questions.quiz_id and q.user_id = auth.uid()
    )
  );
create policy "questions_update_own" on public.questions
  for update using (
    exists (
      select 1 from public.quizzes q
      where q.id = questions.quiz_id and q.user_id = auth.uid()
    )
  );
create policy "questions_delete_own" on public.questions
  for delete using (
    exists (
      select 1 from public.quizzes q
      where q.id = questions.quiz_id and q.user_id = auth.uid()
    )
  );

-- attempts: owner-only CRUD
create policy "attempts_select_own" on public.attempts
  for select using (auth.uid() = user_id);
create policy "attempts_insert_own" on public.attempts
  for insert with check (auth.uid() = user_id);
create policy "attempts_update_own" on public.attempts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "attempts_delete_own" on public.attempts
  for delete using (auth.uid() = user_id);
