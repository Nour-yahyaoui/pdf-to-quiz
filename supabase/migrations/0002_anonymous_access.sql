-- PDF to Quiz — anonymous (no-login) access
-- The product no longer has accounts. Quizzes are reachable by their unguessable
-- UUID (capability URL) and stored immutably: clients may insert and select,
-- never update or delete. RLS stays enabled on every table.

-- 1. user_id becomes nullable: anonymous quizzes/attempts carry no owner.
alter table public.quizzes  alter column user_id drop not null;
alter table public.attempts alter column user_id drop not null;

-- 2. Remove the owner-only policies from 0001_init.
drop policy if exists "quizzes_select_own" on public.quizzes;
drop policy if exists "quizzes_insert_own" on public.quizzes;
drop policy if exists "quizzes_update_own" on public.quizzes;
drop policy if exists "quizzes_delete_own" on public.quizzes;

drop policy if exists "questions_select_own" on public.questions;
drop policy if exists "questions_insert_own" on public.questions;
drop policy if exists "questions_update_own" on public.questions;
drop policy if exists "questions_delete_own" on public.questions;

drop policy if exists "attempts_select_own" on public.attempts;
drop policy if exists "attempts_insert_own" on public.attempts;
drop policy if exists "attempts_update_own" on public.attempts;
drop policy if exists "attempts_delete_own" on public.attempts;

-- 3. Public read/insert for the anon + authenticated roles.
--    No UPDATE/DELETE policies exist, so rows are write-once.
create policy "quizzes_public_select" on public.quizzes
  for select to anon, authenticated using (true);

create policy "quizzes_public_insert" on public.quizzes
  for insert to anon, authenticated with check (true);

create policy "questions_public_select" on public.questions
  for select to anon, authenticated using (true);

create policy "questions_public_insert" on public.questions
  for insert to anon, authenticated with check (true);

create policy "attempts_public_select" on public.attempts
  for select to anon, authenticated using (true);

create policy "attempts_public_insert" on public.attempts
  for insert to anon, authenticated with check (true);
