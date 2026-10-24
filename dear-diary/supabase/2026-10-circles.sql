-- My Inner Mind: My Inner Circle (private circles for friends and family)
-- Run once in Supabase → SQL Editor → New query → paste → Run.
-- Safe to run more than once.
--
-- The app reaches these tables only through /api/circles, which checks who is signed in
-- and whether they belong to the circle. The public key gets no access (same as every other table).

create extension if not exists pgcrypto;

-- A private circle
create table if not exists public.circles (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  emoji        text not null default '🌿',
  owner_email  text not null,
  invite_code  text not null unique,
  prompt       text,                         -- this week's shared prompt, set by the owner
  created_at   timestamptz not null default now()
);
create index if not exists circles_owner_idx on public.circles (owner_email);

-- Who is in each circle
create table if not exists public.circle_members (
  id            uuid primary key default gen_random_uuid(),
  circle_id     uuid not null references public.circles(id) on delete cascade,
  user_email    text not null,
  display_name  text,
  role          text not null default 'member' check (role in ('owner','member')),
  joined_at     timestamptz not null default now(),
  unique (circle_id, user_email)
);
create index if not exists circle_members_user_idx on public.circle_members (user_email);

-- Posts inside a circle (only members can see them)
create table if not exists public.circle_posts (
  id            uuid primary key default gen_random_uuid(),
  circle_id     uuid not null references public.circles(id) on delete cascade,
  user_email    text not null,
  display_name  text,
  content       text not null,
  prompt        text,                        -- the prompt this post answered, if any
  created_at    timestamptz not null default now()
);
create index if not exists circle_posts_circle_idx on public.circle_posts (circle_id, created_at desc);

-- 💛 encouragement on a post, one per person per post
create table if not exists public.circle_reactions (
  post_id     uuid not null references public.circle_posts(id) on delete cascade,
  user_email  text not null,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_email)
);

-- Reports from inside circles, for Hallie to review
create table if not exists public.circle_reports (
  id                  uuid primary key default gen_random_uuid(),
  circle_id           uuid,
  post_id             uuid,
  reporter_email      text not null,
  reported_email      text,
  content             text,
  created_at          timestamptz not null default now()
);

-- Keep these tables locked to the public key, like the rest of the database
alter table public.circles          enable row level security;
alter table public.circle_members   enable row level security;
alter table public.circle_posts     enable row level security;
alter table public.circle_reactions enable row level security;
alter table public.circle_reports   enable row level security;
revoke all on public.circles, public.circle_members, public.circle_posts, public.circle_reactions, public.circle_reports from anon, authenticated;

-- Quick check: this should list the five circle tables
select table_name from information_schema.tables
where table_schema = 'public' and table_name like 'circle%' order by table_name;
