alter table weeks add column if not exists comeback_player_id uuid references players(id) on delete set null;
alter table weeks add column if not exists consistent_player_id uuid references players(id) on delete set null;
alter table weeks add column if not exists margin int;
