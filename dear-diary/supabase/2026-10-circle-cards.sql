-- My Inner Circle, part 3: kind replies on Inner Circle Card answers (and any circle post)
-- Run once in Supabase → SQL Editor → New query → paste → Run. Safe to run more than once.

create table if not exists public.circle_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.circle_posts(id) on delete cascade,
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_email text not null,
  display_name text,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists circle_replies_post_idx on public.circle_replies (post_id, created_at);

alter table public.circle_replies enable row level security;
revoke all on public.circle_replies from anon, authenticated;

select table_name from information_schema.tables
where table_schema = 'public' and table_name = 'circle_replies';
