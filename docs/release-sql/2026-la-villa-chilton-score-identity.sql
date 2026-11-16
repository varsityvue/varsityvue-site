-- OWNER APPROVAL REQUIRED. Not applied by the game-night sprint.
-- Register canonical score slots only; no scores, permissions or schedules change.
begin;
insert into private.canonical_game_identity (game_id, away_school_slug, home_school_slug)
values ('2026-area-2a-d2-iv-4', 'chilton', 'la-villa')
on conflict (game_id) do nothing;
do $$
begin
  if not exists (
    select 1 from private.canonical_game_identity
    where game_id = '2026-area-2a-d2-iv-4'
      and away_school_slug = 'chilton' and home_school_slug = 'la-villa'
  ) then
    raise exception 'La Villa–Chilton canonical score identity conflicts; transaction aborted';
  end if;
end $$;
commit;
