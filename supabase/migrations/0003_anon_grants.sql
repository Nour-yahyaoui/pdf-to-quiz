-- PDF to Quiz — grants for anonymous access
-- RLS policies (0002) permit rows, but Postgres also requires table-level
-- privileges for the anon/authenticated roles. Write-once: SELECT + INSERT only.

grant usage on schema public to anon, authenticated;

grant select, insert on public.quizzes   to anon, authenticated;
grant select, insert on public.questions to anon, authenticated;
grant select, insert on public.attempts  to anon, authenticated;

-- Explicitly no UPDATE/DELETE grants: clients can never mutate stored rows.
