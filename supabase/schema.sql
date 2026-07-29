-- Family Wordle Tracker schema
-- Run this once in the Supabase SQL editor for your new project.

create extension if not exists "pgcrypto";

create table if not exists weeks (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date,
  winner_player_id uuid,
  comeback_player_id uuid,
  consistent_player_id uuid,
  margin int,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  active boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists scores (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references players(id) on delete cascade,
  week_id uuid not null references weeks(id) on delete cascade,
  play_date date not null,
  guesses int not null check (guesses between 1 and 8),
  created_at timestamptz not null default now(),
  unique (player_id, play_date)
);

alter table weeks
  add constraint weeks_winner_player_id_fkey
  foreign key (winner_player_id) references players(id)
  on delete set null;

alter table weeks
  add constraint weeks_comeback_player_id_fkey
  foreign key (comeback_player_id) references players(id)
  on delete set null;

alter table weeks
  add constraint weeks_consistent_player_id_fkey
  foreign key (consistent_player_id) references players(id)
  on delete set null;

create index if not exists scores_week_id_idx on scores(week_id);
create index if not exists scores_player_id_idx on scores(player_id);

-- Seed the first open week (starts today). The app looks for the row
-- where end_date is null as the "active" week.
insert into weeks (start_date)
select current_date
where not exists (select 1 from weeks where end_date is null);

-- This app has no login and talks to Supabase only via the server-side
-- service role key (never exposed to the browser), so Row Level Security
-- stays enabled with no public policies -- the anon key (if ever used)
-- gets no access, and all reads/writes go through trusted server code.
alter table players enable row level security;
alter table weeks enable row level security;
alter table scores enable row level security;
