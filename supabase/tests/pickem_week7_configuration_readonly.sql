-- Production-safe assertions: reads only; no fixture writes or contest mutations.
begin read only;
do $$
declare w public.pickem_weeks%rowtype; actual text[]; expected text[] := array[
  'albany-at-stamford-2026-week-7','anson-at-cisco-2026-week-7',
  'comanche-at-millsap-2026-week-7','crawford-at-hubbard-2026-week-7',
  'de-leon-at-hawley-2026-week-7','eastland-at-clifton-2026-week-7',
  'lampasas-at-stephenville-2026-week-7','merkel-at-jacksboro-2026-week-7',
  'miles-at-winters-2026-week-7','rio-vista-at-tolar-2026-week-7'];
begin
  select * into strict w from public.pickem_weeks where season=2026 and week=7;
  select array_agg(game_id order by sort_order) into actual
    from public.pickem_games where week_id=w.id;
  if actual is distinct from expected then raise exception 'Week 7 canonical slate/order mismatch'; end if;
  if w.status::text <> 'open' then raise exception 'Week 7 is not open'; end if;
  if w.entry_deadline_at is distinct from '2026-10-10T00:00:00Z'::timestamptz then
    raise exception 'Week 7 entry deadline mismatch'; end if;
  if w.outcome_resolution_at is distinct from '2026-10-13T05:00:00Z'::timestamptz then
    raise exception 'Week 7 exclusive Monday result cutoff mismatch'; end if;
  if exists(select 1 from public.pickem_games where week_id=w.id
    and lock_at is distinct from '2026-10-10T00:00:00Z'::timestamptz) then
    raise exception 'Week 7 individual lock mismatch'; end if;
  if not exists(select 1 from public.pickem_games where week_id=w.id
    and id=w.tiebreaker_game_id and game_id='albany-at-stamford-2026-week-7') then
    raise exception 'Week 7 tiebreaker mismatch'; end if;
end $$;
select 'PASS: Week 7 identifiers, tiebreaker, deadline, locks and result cutoff' as verification;
commit;
