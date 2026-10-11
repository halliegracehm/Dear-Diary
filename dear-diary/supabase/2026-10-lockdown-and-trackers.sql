-- My Inner Mind: lock down direct database access + add tracker tables
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run more than once.
--
-- After this, the public "anon" key in the app can no longer read or write any table.
-- The app reaches the database only through its own server functions (/api/db, /api/auth),
-- which use the service key and check who is signed in.

-- 1. Tracker tables
create table if not exists public.trackers (
  id          text primary key,
  user_email  text not null,
  name        text not null,
  emoji       text,
  kind        text not null check (kind in ('scale','yesno','number','note')),
  unit        text,
  archived    boolean not null default false,
  sort        integer not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists trackers_user_idx on public.trackers (user_email);

create table if not exists public.tracker_logs (
  id          text primary key,              -- "<tracker id>_<YYYY-MM-DD>", one log per tracker per day
  user_email  text not null,
  tracker_id  text not null references public.trackers(id) on delete cascade,
  date        date not null,
  value       numeric,
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists tracker_logs_user_date_idx on public.tracker_logs (user_email, date);

-- 2. Turn on row level security for every table, with no public policies
do $$
declare t record;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t.tablename);
  end loop;
end $$;

-- 3. Remove any existing policies that let the public key in
do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- 4. Take away table permissions from the public roles (now and for future tables)
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

-- Quick check: this should return 0 rows when everything is locked
select table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and grantee in ('anon', 'authenticated');
