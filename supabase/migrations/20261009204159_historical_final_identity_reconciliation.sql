-- Reviewed identity-only repair of 29 Week 3-5 verified finals.
-- Scores in this manifest are preconditions, never replacement values.
-- No permanent bypass, function, policy, grant, or trigger change is installed.
-- An ACCESS EXCLUSIVE lock prevents concurrent game-state access while triggers
-- are temporarily suspended. Any failure rolls back data and trigger changes.
do $repair$
declare
  manifest constant jsonb := $manifest$[
  {
    "game_id": "abilene-texas-leadership-at-coleman-2026-week-3",
    "away_school_slug": "abilene-texas-leadership",
    "home_school_slug": "coleman",
    "away_score": 12,
    "home_score": 47
  },
  {
    "game_id": "albany-at-coleman-2026-week-4",
    "away_school_slug": "albany",
    "home_school_slug": "coleman",
    "away_score": 31,
    "home_score": 8
  },
  {
    "game_id": "bowie-at-city-view-2026-week-5",
    "away_school_slug": "bowie",
    "home_school_slug": "city-view",
    "away_score": 56,
    "home_score": 0
  },
  {
    "game_id": "breckenridge-at-anson-2026-week-5",
    "away_school_slug": "breckenridge",
    "home_school_slug": "anson",
    "away_score": 19,
    "home_score": 43
  },
  {
    "game_id": "bridgeport-at-henrietta-2026-week-5",
    "away_school_slug": "bridgeport",
    "home_school_slug": "henrietta",
    "away_score": 14,
    "home_score": 37
  },
  {
    "game_id": "chico-at-abilene-texas-leadership-2026-week-5",
    "away_school_slug": "chico",
    "home_school_slug": "abilene-texas-leadership",
    "away_score": 8,
    "home_score": 40
  },
  {
    "game_id": "cisco-at-stamford-2026-week-4",
    "away_school_slug": "cisco",
    "home_school_slug": "stamford",
    "away_score": 7,
    "home_score": 27
  },
  {
    "game_id": "clifton-at-rio-vista-2026-week-5",
    "away_school_slug": "clifton",
    "home_school_slug": "rio-vista",
    "away_score": 42,
    "home_score": 32
  },
  {
    "game_id": "comanche-at-clifton-2026-week-4",
    "away_school_slug": "comanche",
    "home_school_slug": "clifton",
    "away_score": 21,
    "home_score": 14
  },
  {
    "game_id": "crawford-at-santo-2026-week-5",
    "away_school_slug": "crawford",
    "home_school_slug": "santo",
    "away_score": 10,
    "home_score": 28
  },
  {
    "game_id": "de-leon-at-goldthwaite-2026-week-4",
    "away_school_slug": "de-leon",
    "home_school_slug": "goldthwaite",
    "away_score": 13,
    "home_score": 24
  },
  {
    "game_id": "dublin-at-millsap-2026-week-5",
    "away_school_slug": "dublin",
    "home_school_slug": "millsap",
    "away_score": 7,
    "home_score": 60
  },
  {
    "game_id": "early-at-hawley-2026-week-4",
    "away_school_slug": "early",
    "home_school_slug": "hawley",
    "away_score": 21,
    "home_score": 14
  },
  {
    "game_id": "florence-at-hico-2026-week-5",
    "away_school_slug": "florence",
    "home_school_slug": "hico",
    "away_score": 0,
    "home_score": 50
  },
  {
    "game_id": "hamilton-at-eastland-2026-week-5",
    "away_school_slug": "hamilton",
    "home_school_slug": "eastland",
    "away_score": 51,
    "home_score": 0
  },
  {
    "game_id": "hamlin-at-cross-plains-2026-week-5",
    "away_school_slug": "hamlin",
    "home_school_slug": "cross-plains",
    "away_score": 12,
    "home_score": 39
  },
  {
    "game_id": "hawley-at-post-2026-week-5",
    "away_school_slug": "hawley",
    "home_school_slug": "post",
    "away_score": 21,
    "home_score": 56
  },
  {
    "game_id": "hico-at-meridian-2026-week-4",
    "away_school_slug": "hico",
    "home_school_slug": "meridian",
    "away_score": 57,
    "home_score": 7
  },
  {
    "game_id": "holliday-at-whitesboro-2026-week-5",
    "away_school_slug": "holliday",
    "home_school_slug": "whitesboro",
    "away_score": 14,
    "home_score": 52
  },
  {
    "game_id": "jacksboro-at-cisco-2026-week-5",
    "away_school_slug": "jacksboro",
    "home_school_slug": "cisco",
    "away_score": 42,
    "home_score": 49
  },
  {
    "game_id": "meridian-at-hubbard-2026-week-5",
    "away_school_slug": "meridian",
    "home_school_slug": "hubbard",
    "away_score": 8,
    "home_score": 21
  },
  {
    "game_id": "miles-at-stamford-2026-week-5",
    "away_school_slug": "miles",
    "home_school_slug": "stamford",
    "away_score": 7,
    "home_score": 69
  },
  {
    "game_id": "roscoe-at-santo-2026-week-4",
    "away_school_slug": "roscoe",
    "home_school_slug": "santo",
    "away_score": 0,
    "home_score": 48
  },
  {
    "game_id": "san-angelo-texas-leadership-at-merkel-2026-week-5",
    "away_school_slug": "san-angelo-texas-leadership",
    "home_school_slug": "merkel",
    "away_score": 0,
    "home_score": 54
  },
  {
    "game_id": "stephenville-at-abilene-wylie-2026-week-4",
    "away_school_slug": "stephenville",
    "home_school_slug": "abilene-wylie",
    "away_score": 42,
    "home_score": 23
  },
  {
    "game_id": "stephenville-vs-canyon-west-plains-2026-week-5",
    "away_school_slug": "canyon-west-plains",
    "home_school_slug": "stephenville",
    "away_score": 17,
    "home_score": 35
  },
  {
    "game_id": "tolar-at-comanche-2026-week-5",
    "away_school_slug": "tolar",
    "home_school_slug": "comanche",
    "away_score": 42,
    "home_score": 24
  },
  {
    "game_id": "winters-at-goldthwaite-2026-week-5",
    "away_school_slug": "winters",
    "home_school_slug": "goldthwaite",
    "away_score": 0,
    "home_score": 69
  },
  {
    "game_id": "wortham-at-mart-2026-week-5",
    "away_school_slug": "wortham",
    "home_school_slug": "mart",
    "away_score": 14,
    "home_score": 43
  }
]$manifest$::jsonb;
  before_rows jsonb;
  expected_rows jsonb;
  before_triggers jsonb;
  after_triggers jsonb;
  trigger_row record;
  changed integer;
  prior_lock_timeout text := current_setting('lock_timeout');
begin
  perform set_config('lock_timeout', '3s', true);
  lock table public.game_state in access exclusive mode;
  lock table private.canonical_game_identity in share mode;

  if exists (
    select 1 from jsonb_to_recordset(manifest) as m(
      game_id text, away_school_slug text, home_school_slug text,
      away_score integer, home_score integer)
    left join private.canonical_game_identity c using (game_id)
    where c.game_id is null
       or c.away_school_slug is distinct from m.away_school_slug
       or c.home_school_slug is distinct from m.home_school_slug
  ) then
    raise exception 'Reviewed historical identity manifest disagrees with canonical registry';
  end if;

  if exists (
    select 1 from public.game_state s
    join jsonb_to_recordset(manifest) as m(
      game_id text, away_school_slug text, home_school_slug text,
      away_score integer, home_score integer) using (game_id)
    where
      (s.away_school_slug is not null and s.away_school_slug <> m.away_school_slug)
      or (s.home_school_slug is not null and s.home_school_slug <> m.home_school_slug)
      or ((s.away_school_slug is null or s.home_school_slug is null) and (
        s.away_school_slug is not null or s.home_school_slug is not null
        or s.verified is distinct from true or s.status <> 'final'
        or s.result_type is distinct from 'played'
        or s.away_score is distinct from m.away_score
        or s.home_score is distinct from m.home_score
        or s.score_revision <> 0 or s.schedule_revision <> 0 or s.outcome_revision <> 0
      ))
  ) then
    raise exception 'Historical FINAL changed since review; reconciliation aborted';
  end if;

  select coalesce(jsonb_agg(to_jsonb(s) order by game_id), '[]'::jsonb)
  into before_rows from public.game_state s;

  select coalesce(jsonb_agg(
    case when m.game_id is not null
      and row_data->'away_school_slug' = 'null'::jsonb
      and row_data->'home_school_slug' = 'null'::jsonb
    then row_data || jsonb_build_object(
      'away_school_slug', m.away_school_slug, 'home_school_slug', m.home_school_slug)
    else row_data end order by row_data->>'game_id'), '[]'::jsonb)
  into expected_rows
  from jsonb_array_elements(before_rows) row_data
  left join jsonb_to_recordset(manifest) as m(
    game_id text, away_school_slug text, home_school_slug text,
    away_score integer, home_score integer)
    on m.game_id = row_data->>'game_id';

  select coalesce(jsonb_agg(jsonb_build_object(
    'name', tgname, 'enabled', tgenabled, 'definition', pg_get_triggerdef(oid))
    order by tgname), '[]'::jsonb)
  into before_triggers from pg_trigger
  where tgrelid = 'public.game_state'::regclass and not tgisinternal;

  -- Preserve every original enabled mode, including disabled/replica/always.
  for trigger_row in select * from jsonb_to_recordset(before_triggers)
    as t(name text, enabled text, definition text)
  loop
    execute format('alter table public.game_state disable trigger %I', trigger_row.name);
  end loop;

  update public.game_state s
  set away_school_slug = m.away_school_slug, home_school_slug = m.home_school_slug
  from jsonb_to_recordset(manifest) as m(
    game_id text, away_school_slug text, home_school_slug text,
    away_score integer, home_score integer)
  where s.game_id = m.game_id
    and s.away_school_slug is null and s.home_school_slug is null;
  get diagnostics changed = row_count;

  for trigger_row in select * from jsonb_to_recordset(before_triggers)
    as t(name text, enabled text, definition text)
  loop
    execute format('alter table public.game_state %s trigger %I',
      case trigger_row.enabled
        when 'D' then 'disable' when 'R' then 'enable replica'
        when 'A' then 'enable always' else 'enable' end, trigger_row.name);
  end loop;

  if expected_rows is distinct from (
    select coalesce(jsonb_agg(to_jsonb(s) order by game_id), '[]'::jsonb)
    from public.game_state s
  ) then
    raise exception 'Identity-only invariant failed; reconciliation rolled back';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'name', tgname, 'enabled', tgenabled, 'definition', pg_get_triggerdef(oid))
    order by tgname), '[]'::jsonb)
  into after_triggers from pg_trigger
  where tgrelid = 'public.game_state'::regclass and not tgisinternal;
  if before_triggers is distinct from after_triggers then
    raise exception 'Trigger restoration invariant failed; reconciliation rolled back';
  end if;
  perform set_config('lock_timeout', prior_lock_timeout, true);
  raise notice 'Historical FINAL identity reconciliation: % rows repaired', changed;
end;
$repair$;
