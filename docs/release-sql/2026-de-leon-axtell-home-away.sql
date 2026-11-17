-- OWNER APPROVAL REQUIRED: proposed only; NOT executed against production.
-- Existing game only. No INSERT, score/result, schedule, role or permission changes.
-- Keep this game out of score entry until BOTH approved catalog and identity are verified.
begin;
set local lock_timeout = '5s';
set local statement_timeout = '15s';
-- These locks exclude concurrent identity, score, report and evidence writes.
-- internal_score_submissions is a moderation view over score_submissions.
lock table private.canonical_game_identity, public.game_state,
  public.score_submissions, public.missing_score_intelligence,
  public.missing_score_evidence in share row exclusive mode;
do $guard$
declare
  target constant text := '2026-area-2a-d1-ii-4';
  old_away text;
  old_home text;
  changed integer;
begin
  select away_school_slug, home_school_slug into old_away, old_home
    from private.canonical_game_identity where game_id = target;
  if not found then
    raise exception 'De Leon–Axtell identity is missing; reviewed correction aborted';
  end if;
  if exists (select 1 from public.game_state where game_id = target)
     or exists (select 1 from public.score_submissions where game_id = target)
     or exists (select 1 from public.missing_score_intelligence where game_id = target) then
    raise exception 'De Leon–Axtell has score state, submission/report or candidate evidence; correction aborted';
  end if;
  if old_away = 'de-leon' and old_home = 'axtell' then
    update private.canonical_game_identity
      set away_school_slug = 'axtell', home_school_slug = 'de-leon'
      where game_id = target and away_school_slug = 'de-leon' and home_school_slug = 'axtell';
    get diagnostics changed = row_count;
    if changed <> 1 then
      raise exception 'Expected exactly one existing identity update; correction aborted';
    end if;
  elsif old_away = 'axtell' and old_home = 'de-leon' then
    raise notice 'De Leon–Axtell identity already matches approved orientation; no update';
  else
    raise exception 'De Leon–Axtell identity conflicts with both reviewed orientations; correction aborted';
  end if;
  if not exists (select 1 from private.canonical_game_identity
      where game_id = target and away_school_slug = 'axtell' and home_school_slug = 'de-leon') then
    raise exception 'De Leon–Axtell postcondition failed; correction aborted';
  end if;
end $guard$;
select game_id, away_school_slug, home_school_slug
from private.canonical_game_identity where game_id = '2026-area-2a-d1-ii-4';
commit;
