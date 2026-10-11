-- My Inner Mind: "Bring to therapy" list + timestamps on Set It Down
-- Run once in Supabase → SQL Editor → New query → paste → Run. Safe to run more than once.

create table if not exists public.therapy_items (
  id          text primary key,
  user_email  text not null,
  text        text not null,
  entry_id    text,
  entry_date  date,
  discussed   boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists therapy_items_user_idx on public.therapy_items (user_email, created_at desc);

-- So Hallie's Set It Down view can show when each one came in
alter table public.set_it_down_submissions add column if not exists created_at timestamptz default now();

-- Keep the new table locked to the app's server, like everything else
alter table public.therapy_items enable row level security;
revoke all on public.therapy_items from anon, authenticated;
