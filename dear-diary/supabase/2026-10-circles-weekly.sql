-- My Inner Circle, part 2: weekly challenge check-ins, affirmation notes, Grove shares
-- Run once in Supabase → SQL Editor → New query → paste → Run. Safe to run more than once.

alter table public.circle_posts add column if not exists kind text not null default 'post';

create table if not exists public.circle_checkins (
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_email text not null,
  week_key date not null,
  created_at timestamptz not null default now(),
  primary key (circle_id, user_email, week_key)
);

create table if not exists public.circle_notes (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  from_email text not null,
  from_name text,
  to_email text not null,
  message text not null,
  seen boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists circle_notes_to_idx on public.circle_notes (to_email, seen);

alter table public.circle_checkins enable row level security;
alter table public.circle_notes enable row level security;
revoke all on public.circle_checkins, public.circle_notes from anon, authenticated;

select table_name from information_schema.tables
where table_schema = 'public' and table_name in ('circle_checkins', 'circle_notes') order by table_name;
