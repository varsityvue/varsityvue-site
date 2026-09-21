alter table public.game_state add column if not exists kickoff_override timestamptz null;
comment on column public.game_state.kickoff_override is 'Verified moderator/admin override for canonical game kickoff. Null preserves schedule-file kickoff.';
