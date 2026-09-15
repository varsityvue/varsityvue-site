alter table public.school_roster_players
  add column if not exists player_profile_id text;

create index if not exists school_roster_players_profile_idx
  on public.school_roster_players (player_profile_id)
  where player_profile_id is not null;
