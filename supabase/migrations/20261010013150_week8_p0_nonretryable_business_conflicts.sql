-- Package 1: exact deployed business-conflict replacements; no permission or data changes.
-- Generated with Supabase CLI 2.100.1. History mirror must precede this migration.
-- Refuse unreviewed drift. CREATE OR REPLACE retains existing ACLs and owners.
begin;
set local lock_timeout = '3s';
set local statement_timeout = '15s';
do $baseline$
begin
  if md5(pg_get_functiondef('public.update_canonical_game_kickoff(text,bigint,timestamp with time zone,timestamp without time zone,text,text,text)'::regprocedure)) is distinct from 'dec5dd57a68753f96455ac28e07e8070' then raise exception 'Package 1 baseline drift: public.update_canonical_game_kickoff(text,bigint,timestamp with time zone,timestamp without time zone,text,text,text)'; end if;
  if md5(pg_get_functiondef('public.sync_pickem_game_lock(uuid,text,integer,timestamp with time zone,bigint,text,text)'::regprocedure)) is distinct from '5f1cd432651650a6950dc27275ec762e' then raise exception 'Package 1 baseline drift: public.sync_pickem_game_lock(uuid,text,integer,timestamp with time zone,bigint,text,text)'; end if;
  -- Repository replay includes two explanatory comments absent from production; executable SQL is identical.
  if md5(pg_get_functiondef('public.admin_originate_canonical_game_outcome(text,bigint,text,text,text,text,text,text)'::regprocedure)) not in ('b5b55ebbc09b6641159fe48e96b42879', 'dbb50408b8e09ab39d3e8ca5cbddba49') then raise exception 'Package 1 baseline drift: public.admin_originate_canonical_game_outcome(text,bigint,text,text,text,text,text,text)'; end if;
  if md5(pg_get_functiondef('public.admin_reopen_pickem_game(uuid,timestamp with time zone,bigint,text)'::regprocedure)) is distinct from 'c935fb6573b4b3cac0676dd333df251a' then raise exception 'Package 1 baseline drift: public.admin_reopen_pickem_game(uuid,timestamp with time zone,bigint,text)'; end if;
  if md5(pg_get_functiondef('public.admin_set_canonical_game_outcome(text,bigint,text,text,text,integer,integer)'::regprocedure)) is distinct from 'ed97d85ad84065926ba6b53f9541200c' then raise exception 'Package 1 baseline drift: public.admin_set_canonical_game_outcome(text,bigint,text,text,text,integer,integer)'; end if;
  if md5(pg_get_functiondef('private.correct_game_score_base(text,timestamp with time zone,bigint,text,integer,integer,text,text,text)'::regprocedure)) is distinct from 'e4b8a95b30fd78dd0f36375b4b315a25' then raise exception 'Package 1 baseline drift: private.correct_game_score_base(text,timestamp with time zone,bigint,text,integer,integer,text,text,text)'; end if;
  if md5(pg_get_functiondef('public.configure_pickem_draft(integer,integer,bigint,text,jsonb,text[])'::regprocedure)) is distinct from 'd74eec20f12f1e5132981e5cc26b5d97' then raise exception 'Package 1 baseline drift: public.configure_pickem_draft(integer,integer,bigint,text,jsonb,text[])'; end if;
  if md5(pg_get_functiondef('public.apply_score_submission_review()'::regprocedure)) is distinct from 'f4348c664d665991cce8ff3e6bd2d11e' then raise exception 'Package 1 baseline drift: public.apply_score_submission_review()'; end if;
  if md5(pg_get_functiondef('public.open_pickem_draft(uuid,bigint,jsonb)'::regprocedure)) is distinct from 'b3d3ada3c2bf7e223ba25748da0b1ce9' then raise exception 'Package 1 baseline drift: public.open_pickem_draft(uuid,bigint,jsonb)'; end if;
  if md5(pg_get_functiondef('public.review_missing_score_evidence(uuid,text,text,text,timestamp with time zone,bigint,boolean,jsonb,boolean,text)'::regprocedure)) is distinct from '25a31ca3dae54958194a6c77010c92b9' then raise exception 'Package 1 baseline drift: public.review_missing_score_evidence(uuid,text,text,text,timestamp with time zone,bigint,boolean,jsonb,boolean,text)'; end if;
  if md5(pg_get_functiondef('private.publish_trusted_score(text,integer,integer,text,text,text,text,timestamp with time zone,bigint,boolean,boolean,boolean)'::regprocedure)) is distinct from '36d91bbeb1860236a10bbd34f555ee42' then raise exception 'Package 1 baseline drift: private.publish_trusted_score(text,integer,integer,text,text,text,text,timestamp with time zone,bigint,boolean,boolean,boolean)'; end if;
end;
$baseline$;

CREATE OR REPLACE FUNCTION public.update_canonical_game_kickoff(p_game_id text, p_expected_revision bigint, p_expected_current_kickoff timestamp with time zone, p_kickoff_local timestamp without time zone, p_reason text, p_away_school_slug text, p_home_school_slug text)
 RETURNS TABLE(schedule_revision bigint, canonical_kickoff timestamp with time zone, changed boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor_id uuid := auth.uid();
  current_state public.game_state%rowtype;
  previous_kickoff timestamptz;
  next_kickoff timestamptz;
  revised_at timestamptz;
  pickem_game public.pickem_games%rowtype;
  next_lock timestamptz;
  next_lock_revision bigint;
  audited_pickem boolean := false;
begin
  if actor_id is null or not private.can_moderate_scores() then
    raise exception using errcode = '42501', message = 'Schedule update is not authorized.';
  end if;
  if nullif(btrim(p_game_id), '') is null then
    raise exception using errcode = '22023', message = 'Canonical game ID is required.';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception using errcode = '22023', message = 'A schedule-change reason is required.';
  end if;
  if nullif(btrim(p_away_school_slug), '') is null
    or nullif(btrim(p_home_school_slug), '') is null
    or p_away_school_slug = p_home_school_slug then
    raise exception using errcode = '22023', message = 'Canonical matchup identity is invalid.';
  end if;

  next_kickoff := private.resolve_chicago_local_kickoff(p_kickoff_local);

  select * into current_state
  from public.game_state
  where game_id = p_game_id
  for update;

  if not found then
    if p_expected_revision <> 0 or p_expected_current_kickoff is null then
      raise exception using errcode = 'PT409', message = 'Stale schedule revision. Refresh and try again.';
    end if;

    if next_kickoff = p_expected_current_kickoff then
      return query select 0::bigint, p_expected_current_kickoff, false;
      return;
    end if;

    insert into public.game_state (
      game_id, status, verified, verified_at, updated_by,
      kickoff_override, away_school_slug, home_school_slug,
      schedule_revision, schedule_revised_at
    ) values (
      p_game_id, 'upcoming', true, clock_timestamp(), actor_id,
      p_expected_current_kickoff, p_away_school_slug, p_home_school_slug,
      0, null
    )
    returning * into current_state;
  end if;

  if current_state.schedule_revision <> p_expected_revision then
    raise exception using errcode = 'PT409', message = 'Stale schedule revision. Refresh and try again.';
  end if;
  if current_state.status not in ('scheduled', 'upcoming', 'postponed') then
    raise exception using errcode = '22023', message = 'Final, live, or cancelled games cannot be rescheduled.';
  end if;
  if current_state.away_school_slug is not null
    and current_state.away_school_slug <> p_away_school_slug then
    raise exception using errcode = '22023', message = 'Canonical away team does not match the stored matchup.';
  end if;
  if current_state.home_school_slug is not null
    and current_state.home_school_slug <> p_home_school_slug then
    raise exception using errcode = '22023', message = 'Canonical home team does not match the stored matchup.';
  end if;

  previous_kickoff := coalesce(current_state.kickoff_override, p_expected_current_kickoff);
  if previous_kickoff is null then
    raise exception using errcode = '22023', message = 'Current canonical kickoff is required.';
  end if;

  if next_kickoff = previous_kickoff then
    update public.game_state
    set away_school_slug = coalesce(away_school_slug, p_away_school_slug),
        home_school_slug = coalesce(home_school_slug, p_home_school_slug)
    where game_id = p_game_id;

    return query select current_state.schedule_revision, previous_kickoff, false;
    return;
  end if;

  revised_at := clock_timestamp();
  update public.game_state
  set status = 'upcoming',
      home_score = null,
      away_score = null,
      period = null,
      clock = null,
      source_submission_id = null,
      verified = true,
      verified_at = revised_at,
      updated_by = actor_id,
      kickoff_override = next_kickoff,
      away_school_slug = coalesce(away_school_slug, p_away_school_slug),
      home_school_slug = coalesce(home_school_slug, p_home_school_slug),
      result_type = null,
      official_winner_school_slug = null,
      schedule_revision = current_state.schedule_revision + 1,
      schedule_revised_at = revised_at,
      updated_at = revised_at
  where game_id = p_game_id;

  for pickem_game in
    select * from public.pickem_games
    where game_id = p_game_id
    order by id
    for update
  loop
    audited_pickem := true;
    next_lock := pickem_game.lock_at;
    next_lock_revision := pickem_game.lock_revision;

    if now() < pickem_game.lock_at and pickem_game.lock_at is distinct from next_kickoff then
      next_lock := next_kickoff;
      next_lock_revision := pickem_game.lock_revision + 1;
      update public.pickem_games
      set lock_at = next_lock,
          lock_revision = next_lock_revision
      where id = pickem_game.id;
    end if;

    insert into private.game_schedule_audit (
      game_id, pickem_game_id, action_type, actor_id,
      previous_canonical_kickoff, new_canonical_kickoff,
      previous_pickem_lock, new_pickem_lock, reason,
      previous_schedule_revision, new_schedule_revision,
      previous_lock_revision, new_lock_revision, automatic
    ) values (
      p_game_id, pickem_game.id, 'schedule_update', actor_id,
      previous_kickoff, next_kickoff,
      pickem_game.lock_at, next_lock, btrim(p_reason),
      current_state.schedule_revision, current_state.schedule_revision + 1,
      pickem_game.lock_revision, next_lock_revision, true
    );
  end loop;

  if not audited_pickem then
    insert into private.game_schedule_audit (
      game_id, action_type, actor_id,
      previous_canonical_kickoff, new_canonical_kickoff,
      previous_pickem_lock, new_pickem_lock, reason,
      previous_schedule_revision, new_schedule_revision,
      previous_lock_revision, new_lock_revision, automatic
    ) values (
      p_game_id, 'schedule_update', actor_id,
      previous_kickoff, next_kickoff,
      null, null, btrim(p_reason),
      current_state.schedule_revision, current_state.schedule_revision + 1,
      null, null, true
    );
  end if;

  update public.score_submissions
  set status = 'superseded',
      reviewed_by = actor_id,
      reviewed_at = revised_at,
      review_note = 'Superseded when game kickoff was rescheduled.'
  where game_id = p_game_id and status = 'pending';

  return query select current_state.schedule_revision + 1, next_kickoff, true;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_pickem_game_lock(p_week_id uuid, p_game_id text, p_sort_order integer, p_canonical_kickoff timestamp with time zone, p_expected_schedule_revision bigint, p_away_school_slug text, p_home_school_slug text)
 RETURNS TABLE(pickem_game_id uuid, lock_at timestamp with time zone, lock_revision bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor_id uuid := auth.uid();
  stored public.pickem_games%rowtype;
  next_lock timestamptz;
  next_lock_revision bigint;
  stored_schedule_revision bigint;
  stored_canonical_kickoff timestamptz;
begin
  if actor_id is null or not private.can_moderate_scores() then
    raise exception using errcode = '42501', message = 'Pick Em lock synchronization is not authorized.';
  end if;
  if p_canonical_kickoff is null then
    raise exception using errcode = '22023', message = 'Canonical kickoff is required.';
  end if;
  if nullif(btrim(p_away_school_slug), '') is null
    or nullif(btrim(p_home_school_slug), '') is null
    or p_away_school_slug = p_home_school_slug then
    raise exception using errcode = '22023', message = 'Canonical matchup identity is invalid.';
  end if;

  select state.schedule_revision, state.kickoff_override
  into stored_schedule_revision, stored_canonical_kickoff
  from public.game_state state
  where state.game_id = p_game_id
  for update;

  if found then
    if stored_schedule_revision <> p_expected_schedule_revision
      or (stored_canonical_kickoff is not null and stored_canonical_kickoff <> p_canonical_kickoff) then
      raise exception using errcode = 'PT409', message = 'Stale schedule revision. Refresh and try again.';
    end if;
  elsif p_expected_schedule_revision <> 0 then
    raise exception using errcode = 'PT409', message = 'Stale schedule revision. Refresh and try again.';
  end if;

  select * into stored
  from public.pickem_games
  where week_id = p_week_id and game_id = p_game_id
  for update;

  if not found then
    insert into public.pickem_games (
      week_id, game_id, sort_order, lock_at,
      away_school_slug, home_school_slug, lock_revision
    ) values (
      p_week_id, p_game_id, p_sort_order, p_canonical_kickoff,
      p_away_school_slug, p_home_school_slug, 0
    ) returning * into stored;

    return query select stored.id, stored.lock_at, stored.lock_revision;
    return;
  end if;

  next_lock := stored.lock_at;
  next_lock_revision := stored.lock_revision;
  if now() < stored.lock_at and stored.lock_at is distinct from p_canonical_kickoff then
    next_lock := p_canonical_kickoff;
    next_lock_revision := stored.lock_revision + 1;
  end if;

  update public.pickem_games
  set sort_order = p_sort_order,
      lock_at = next_lock,
      lock_revision = next_lock_revision,
      away_school_slug = p_away_school_slug,
      home_school_slug = p_home_school_slug
  where id = stored.id;

  if next_lock is distinct from stored.lock_at then
    insert into private.game_schedule_audit (
      game_id, pickem_game_id, action_type, actor_id,
      previous_canonical_kickoff, new_canonical_kickoff,
      previous_pickem_lock, new_pickem_lock, reason,
      previous_schedule_revision, new_schedule_revision,
      previous_lock_revision, new_lock_revision, automatic
    ) values (
      p_game_id, stored.id, 'slate_sync', actor_id,
      coalesce(stored_canonical_kickoff, p_canonical_kickoff),
      coalesce(stored_canonical_kickoff, p_canonical_kickoff),
      stored.lock_at, next_lock, 'Pick Em slate synchronized to canonical kickoff.',
      coalesce(stored_schedule_revision, 0),
      coalesce(stored_schedule_revision, 0),
      stored.lock_revision, next_lock_revision, true
    );
  end if;

  return query select stored.id, next_lock, next_lock_revision;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_originate_canonical_game_outcome(p_game_id text, p_expected_outcome_revision bigint, p_result_type text, p_official_winner_school_slug text, p_source text, p_reason text, p_away_school_slug text, p_home_school_slug text)
 RETURNS TABLE(game_id text, result_type text, official_winner_school_slug text, outcome_revision bigint, away_score integer, home_score integer, verified boolean, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor_id uuid := auth.uid();
  stored public.game_state%rowtype;
  had_state boolean := false;
  normalized_game_id text := nullif(btrim(p_game_id), '');
  normalized_result_type text := lower(nullif(btrim(p_result_type), ''));
  normalized_winner text := nullif(btrim(p_official_winner_school_slug), '');
  normalized_source text := nullif(btrim(p_source), '');
  normalized_reason text := nullif(btrim(p_reason), '');
  normalized_away_slug text := nullif(btrim(p_away_school_slug), '');
  normalized_home_slug text := nullif(btrim(p_home_school_slug), '');
  next_winner text;
  previous_revision bigint := 0;
  changed_at timestamptz := clock_timestamp();
begin
  if actor_id is null or not private.has_role('admin'::public.user_role) then
    raise exception using
      errcode = '42501',
      message = 'Exceptional outcome origination requires an active administrator.';
  end if;
  if normalized_game_id is null then
    raise exception using errcode = '22023', message = 'Canonical game ID is required.';
  end if;
  if p_expected_outcome_revision is null or p_expected_outcome_revision < 0 then
    raise exception using errcode = '22023', message = 'A valid expected outcome revision is required.';
  end if;
  if normalized_result_type is null
    or normalized_result_type not in ('forfeit', 'no_contest') then
    raise exception using errcode = '22023', message = 'Choose forfeit or no-contest.';
  end if;
  if normalized_source is null then
    raise exception using errcode = '22023', message = 'A nonblank authoritative source is required.';
  end if;
  if char_length(normalized_source) > 300 then
    raise exception using errcode = '22023', message = 'Authoritative source must be 300 characters or fewer.';
  end if;
  if normalized_reason is null then
    raise exception using errcode = '22023', message = 'A nonblank outcome reason is required.';
  end if;
  if char_length(normalized_reason) > 500 then
    raise exception using errcode = '22023', message = 'Outcome reason must be 500 characters or fewer.';
  end if;
  if normalized_away_slug is null
    or normalized_home_slug is null
    or normalized_away_slug = normalized_home_slug then
    raise exception using errcode = '22023', message = 'The canonical matchup identity is incomplete.';
  end if;

  case normalized_result_type
    when 'forfeit' then
      if normalized_winner is null then
        raise exception using errcode = '22023', message = 'Forfeit requires an explicit authoritative winner.';
      end if;
      if normalized_winner not in (normalized_away_slug, normalized_home_slug) then
        raise exception using errcode = '22023', message = 'Forfeit winner must be a participating school.';
      end if;
      next_winner := normalized_winner;
    when 'no_contest' then
      if normalized_winner is not null then
        raise exception using errcode = '22023', message = 'No-contest cannot have an official winner.';
      end if;
      next_winner := null;
  end case;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(normalized_game_id, 891734221)
  );

  select state.* into stored
  from public.game_state state
  where state.game_id = normalized_game_id
  for update;

  had_state := found;
  if had_state then
    previous_revision := stored.outcome_revision;
    if stored.outcome_revision <> p_expected_outcome_revision then
      raise exception using errcode = 'PT409', message = 'Stale outcome revision. Refresh and try again.';
    end if;
    if stored.verified is true and stored.status = 'final' then
      raise exception using errcode = '22023', message = 'A verified final already exists. Use the canonical correction workflow.';
    end if;
    if stored.away_school_slug is not null and stored.away_school_slug <> normalized_away_slug then
      raise exception using errcode = '22023', message = 'Away-school identity does not match the existing canonical state.';
    end if;
    if stored.home_school_slug is not null and stored.home_school_slug <> normalized_home_slug then
      raise exception using errcode = '22023', message = 'Home-school identity does not match the existing canonical state.';
    end if;
  elsif p_expected_outcome_revision <> 0 then
    raise exception using errcode = 'PT409', message = 'Stale outcome revision. Refresh and try again.';
  end if;

  insert into public.game_state (
    game_id, status, home_score, away_score, period, clock,
    source_submission_id, verified, verified_at, updated_by, updated_at,
    result_type, official_winner_school_slug, away_school_slug,
    home_school_slug, outcome_revision
  ) values (
    normalized_game_id, 'final', null, null, null, null,
    null, true, changed_at, actor_id, changed_at,
    normalized_result_type, next_winner, normalized_away_slug,
    normalized_home_slug, previous_revision + 1
  )
  on conflict on constraint game_state_pkey do update set
    status = excluded.status,
    home_score = null,
    away_score = null,
    period = null,
    clock = null,
    source_submission_id = null,
    verified = true,
    verified_at = excluded.verified_at,
    updated_by = excluded.updated_by,
    updated_at = excluded.updated_at,
    result_type = excluded.result_type,
    official_winner_school_slug = excluded.official_winner_school_slug,
    away_school_slug = coalesce(public.game_state.away_school_slug, excluded.away_school_slug),
    home_school_slug = coalesce(public.game_state.home_school_slug, excluded.home_school_slug),
    outcome_revision = excluded.outcome_revision;

  insert into private.game_outcome_audit (
    game_id, actor_id, occurred_at, source, reason,
    previous_result_type, new_result_type,
    previous_official_winner_school_slug, new_official_winner_school_slug,
    previous_away_score, previous_home_score, new_away_score, new_home_score,
    previous_status, new_status, previous_verified, new_verified,
    previous_verified_at, new_verified_at,
    previous_outcome_revision, new_outcome_revision
  ) values (
    normalized_game_id, actor_id, changed_at, normalized_source, normalized_reason,
    case when had_state then stored.result_type else null end, normalized_result_type,
    case when had_state then stored.official_winner_school_slug else null end, next_winner,
    case when had_state then stored.away_score else null end,
    case when had_state then stored.home_score else null end,
    null, null,
    case when had_state then stored.status else 'untracked' end, 'final',
    case when had_state then stored.verified else false end, true,
    case when had_state then stored.verified_at else null end, changed_at,
    previous_revision, previous_revision + 1
  );

  update public.score_submissions
  set status = 'superseded',
      reviewed_by = actor_id,
      reviewed_at = changed_at,
      review_note = coalesce(
        review_note,
        'Superseded by administrator scoreless ' || replace(normalized_result_type, '_', '-') || ' ruling.'
      )
  where public.score_submissions.game_id = normalized_game_id
    and public.score_submissions.status = 'pending';

  return query
  select updated.game_id, updated.result_type,
         updated.official_winner_school_slug, updated.outcome_revision,
         updated.away_score, updated.home_score, updated.verified, updated.status
  from public.game_state updated
  where updated.game_id = normalized_game_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_reopen_pickem_game(p_pickem_game_id uuid, p_new_lock timestamp with time zone, p_expected_lock_revision bigint, p_reason text)
 RETURNS TABLE(lock_at timestamp with time zone, lock_revision bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor_id uuid := auth.uid();
  stored public.pickem_games%rowtype;
  schedule_state record;
begin
  if actor_id is null or not private.has_role('admin'::public.user_role) then
    raise exception using errcode = '42501', message = 'Manual reopening requires administrator authority.';
  end if;
  if nullif(btrim(p_reason), '') is null then
    raise exception using errcode = '22023', message = 'A manual-reopen reason is required.';
  end if;
  if p_new_lock is null or p_new_lock <= now() then
    raise exception using errcode = '22023', message = 'Manual reopen time must be in the future.';
  end if;

  select * into stored
  from public.pickem_games
  where id = p_pickem_game_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Pick Em game not found.';
  end if;
  if stored.lock_revision <> p_expected_lock_revision then
    raise exception using errcode = 'PT409', message = 'Stale lock revision. Refresh and try again.';
  end if;
  if now() < stored.lock_at then
    raise exception using errcode = '22023', message = 'This matchup is not locked and does not require manual reopening.';
  end if;

  select state.kickoff_override, state.schedule_revision
  into schedule_state
  from public.game_state state
  where state.game_id = stored.game_id;

  if schedule_state.kickoff_override is not null
    and p_new_lock > schedule_state.kickoff_override then
    raise exception using
      errcode = '22023',
      message = 'Manual reopen time cannot be later than the canonical kickoff.';
  end if;

  update public.pickem_games
  set lock_at = p_new_lock,
      lock_revision = stored.lock_revision + 1
  where id = stored.id;

  insert into private.game_schedule_audit (
    game_id, pickem_game_id, action_type, actor_id,
    previous_canonical_kickoff, new_canonical_kickoff,
    previous_pickem_lock, new_pickem_lock, reason,
    previous_schedule_revision, new_schedule_revision,
    previous_lock_revision, new_lock_revision, automatic
  ) values (
    stored.game_id, stored.id, 'manual_reopen', actor_id,
    schedule_state.kickoff_override, schedule_state.kickoff_override,
    stored.lock_at, p_new_lock, btrim(p_reason),
    coalesce(schedule_state.schedule_revision, 0),
    coalesce(schedule_state.schedule_revision, 0),
    stored.lock_revision, stored.lock_revision + 1, false
  );

  return query select p_new_lock, stored.lock_revision + 1;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.admin_set_canonical_game_outcome(p_game_id text, p_expected_outcome_revision bigint, p_result_type text, p_official_winner_school_slug text, p_reason text, p_away_score integer DEFAULT NULL::integer, p_home_score integer DEFAULT NULL::integer)
 RETURNS TABLE(game_id text, result_type text, official_winner_school_slug text, outcome_revision bigint, away_score integer, home_score integer, verified boolean, status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor_id uuid := auth.uid();
  stored public.game_state%rowtype;
  normalized_result_type text := lower(nullif(btrim(p_result_type), ''));
  normalized_winner text := nullif(btrim(p_official_winner_school_slug), '');
  normalized_reason text := nullif(btrim(p_reason), '');
  next_winner text;
  next_away_score integer;
  next_home_score integer;
  changed_at timestamptz := clock_timestamp();
begin
  if actor_id is null or not private.has_role('admin'::public.user_role) then
    raise exception using
      errcode = '42501',
      message = 'Canonical outcome changes require an active administrator.';
  end if;
  if nullif(btrim(p_game_id), '') is null then
    raise exception using errcode = '22023', message = 'Canonical game ID is required.';
  end if;
  if p_expected_outcome_revision is null or p_expected_outcome_revision < 0 then
    raise exception using errcode = '22023', message = 'A valid expected outcome revision is required.';
  end if;
  if normalized_result_type is null
    or normalized_result_type not in ('played', 'tie', 'forfeit', 'no_contest') then
    raise exception using errcode = '22023', message = 'Choose played, tie, forfeit, or no-contest.';
  end if;
  if normalized_reason is null then
    raise exception using errcode = '22023', message = 'A nonblank outcome-change reason is required.';
  end if;
  if char_length(normalized_reason) > 500 then
    raise exception using errcode = '22023', message = 'Outcome-change reason must be 500 characters or fewer.';
  end if;

  select state.* into stored
  from public.game_state state
  where state.game_id = p_game_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'Canonical game state was not found.';
  end if;
  if stored.outcome_revision <> p_expected_outcome_revision then
    raise exception using errcode = 'PT409', message = 'Stale outcome revision. Refresh and try again.';
  end if;
  if stored.verified is not true or stored.status <> 'final' then
    raise exception using errcode = '22023', message = 'Canonical outcomes can be changed only for verified final games.';
  end if;
  if stored.away_school_slug is null
    or stored.home_school_slug is null
    or stored.away_school_slug = stored.home_school_slug then
    raise exception using errcode = '22023', message = 'The canonical matchup identity is incomplete.';
  end if;

  next_away_score := stored.away_score;
  next_home_score := stored.home_score;

  case normalized_result_type
    when 'played' then
      if p_away_score is not null or p_home_score is not null then
        next_away_score := p_away_score;
        next_home_score := p_home_score;
      end if;
      if next_away_score is null or next_home_score is null then
        raise exception using errcode = '22023', message = 'Played requires both final scores.';
      end if;
      if next_away_score < 0 or next_home_score < 0 then
        raise exception using errcode = '22023', message = 'Played scores must be nonnegative whole numbers.';
      end if;
      if next_away_score = next_home_score then
        raise exception using errcode = '22023', message = 'Played requires unequal final scores.';
      end if;
      if normalized_winner is not null then
        raise exception using errcode = '22023', message = 'Played derives its winner from scores; do not submit a winner.';
      end if;
      next_winner := null;
    when 'tie' then
      if p_away_score is not null or p_home_score is not null then
        next_away_score := p_away_score;
        next_home_score := p_home_score;
      end if;
      if next_away_score is null or next_home_score is null then
        raise exception using errcode = '22023', message = 'Tie requires both final scores.';
      end if;
      if next_away_score < 0 or next_home_score < 0 then
        raise exception using errcode = '22023', message = 'Tie scores must be nonnegative whole numbers.';
      end if;
      if next_away_score <> next_home_score then
        raise exception using errcode = '22023', message = 'Tie requires equal final scores.';
      end if;
      if normalized_winner is not null then
        raise exception using errcode = '22023', message = 'Tie cannot have an official winner.';
      end if;
      next_winner := null;
    when 'forfeit' then
      if normalized_winner is null then
        raise exception using errcode = '22023', message = 'Forfeit requires an explicit authoritative winner.';
      end if;
      if normalized_winner not in (stored.away_school_slug, stored.home_school_slug) then
        raise exception using errcode = '22023', message = 'Forfeit winner must be a participating school.';
      end if;
      next_winner := normalized_winner;
    when 'no_contest' then
      if normalized_winner is not null then
        raise exception using errcode = '22023', message = 'No-contest cannot have an official winner.';
      end if;
      next_winner := null;
  end case;

  if stored.result_type is not distinct from normalized_result_type
    and stored.official_winner_school_slug is not distinct from next_winner
    and stored.away_score is not distinct from next_away_score
    and stored.home_score is not distinct from next_home_score then
    raise exception using errcode = '22023', message = 'The requested canonical outcome is already recorded.';
  end if;

  update public.game_state
  set result_type = normalized_result_type,
      official_winner_school_slug = next_winner,
      away_score = next_away_score,
      home_score = next_home_score,
      outcome_revision = stored.outcome_revision + 1,
      updated_by = actor_id,
      updated_at = changed_at
  where public.game_state.game_id = p_game_id;

  insert into private.game_outcome_audit (
    game_id, actor_id, occurred_at, reason,
    previous_result_type, new_result_type,
    previous_official_winner_school_slug, new_official_winner_school_slug,
    previous_away_score, previous_home_score, new_away_score, new_home_score,
    previous_status, new_status, previous_verified, new_verified,
    previous_verified_at, new_verified_at,
    previous_outcome_revision, new_outcome_revision
  ) values (
    stored.game_id, actor_id, changed_at, normalized_reason,
    stored.result_type, normalized_result_type,
    stored.official_winner_school_slug, next_winner,
    stored.away_score, stored.home_score, next_away_score, next_home_score,
    stored.status, stored.status, stored.verified, stored.verified,
    stored.verified_at, stored.verified_at,
    stored.outcome_revision, stored.outcome_revision + 1
  );

  return query
  select updated.game_id, updated.result_type,
         updated.official_winner_school_slug, updated.outcome_revision,
         updated.away_score, updated.home_score, updated.verified, updated.status
  from public.game_state updated
  where updated.game_id = p_game_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION private.correct_game_score_base(p_game_id text, p_expected_updated_at timestamp with time zone, p_expected_outcome_revision bigint, p_status text, p_away_score integer, p_home_score integer, p_period text, p_clock text, p_reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  actor_id uuid := auth.uid();
  stored public.game_state%rowtype;
  next_result text;
  next_period text := nullif(btrim(p_period), '');
  next_clock text := nullif(btrim(p_clock), '');
  reason text := nullif(btrim(p_reason), '');
  changed_at timestamptz := clock_timestamp();
begin
  if actor_id is null or not (private.has_role('moderator'::public.user_role) or private.has_role('admin'::public.user_role)) then
    raise exception using errcode = '42501', message = 'Score correction requires a moderator or administrator.';
  end if;
  if nullif(btrim(p_game_id), '') is null or p_expected_updated_at is null or p_expected_outcome_revision is null then
    raise exception using errcode = '22023', message = 'A game and current revision are required.';
  end if;
  if p_status not in ('upcoming', 'live', 'final') or p_away_score is null or p_home_score is null
     or p_away_score < 0 or p_home_score < 0 or p_away_score > 150 or p_home_score > 150
     or char_length(coalesce(next_period, '')) > 30 or char_length(coalesce(next_clock, '')) > 30
     or reason is null or char_length(reason) > 500 then
    raise exception using errcode = '22023', message = 'Invalid score, state, period, clock, or correction reason.';
  end if;
  select state.* into stored from public.game_state state where state.game_id = p_game_id for update;
  if not found or stored.verified is not true or stored.status not in ('upcoming', 'scheduled', 'live', 'final') then
    raise exception using errcode = '22023', message = 'Only an existing verified playable game may be corrected.';
  end if;
  if stored.updated_at is distinct from p_expected_updated_at or stored.outcome_revision <> p_expected_outcome_revision then
    raise exception using errcode = 'PT409', message = 'Game changed after opening the editor. Refresh and review it again.';
  end if;
  if (stored.status = 'final' or p_status = 'final') and not private.has_role('admin'::public.user_role) then
    raise exception using errcode = '42501', message = 'Only an administrator may set or correct a final score.';
  end if;
  if stored.status = 'final' and p_status <> 'final' then
    raise exception using errcode = '22023', message = 'A finalized result cannot be reopened from score correction.';
  end if;
  if stored.result_type in ('forfeit', 'no_contest') then
    raise exception using errcode = '22023', message = 'Use the canonical outcome editor for an exceptional result.';
  end if;
  if p_status = 'final' and (stored.away_school_slug is null or stored.home_school_slug is null or stored.away_school_slug = stored.home_school_slug) then
    raise exception using errcode = '22023', message = 'Final requires complete canonical team identity.';
  end if;
  if p_status = 'final' then
    next_result := case when p_away_score = p_home_score then 'tie' else 'played' end;
  else
    next_result := null;
  end if;
  if stored.status is not distinct from p_status and stored.away_score is not distinct from p_away_score
    and stored.home_score is not distinct from p_home_score and stored.period is not distinct from next_period
    and stored.clock is not distinct from next_clock and stored.result_type is not distinct from next_result then
    raise exception using errcode = '22023', message = 'Nothing changed.';
  end if;
  update public.game_state set status = p_status, away_score = p_away_score, home_score = p_home_score,
    period = next_period, clock = next_clock, result_type = next_result,
    official_winner_school_slug = null,
    outcome_revision = stored.outcome_revision + 1,
    source_submission_id = null,
    verified = true, verified_at = case when p_status = 'final' and stored.status <> 'final' then changed_at else stored.verified_at end,
    updated_by = actor_id, updated_at = changed_at
  where game_id = p_game_id;
  insert into private.game_score_correction_audit(game_id, actor_id, occurred_at, reason, previous_state, corrected_state)
  select p_game_id, actor_id, changed_at, reason,
    jsonb_build_object('status', stored.status, 'away_score', stored.away_score, 'home_score', stored.home_score,
      'period', stored.period, 'clock', stored.clock, 'result_type', stored.result_type,
      'official_winner_school_slug', stored.official_winner_school_slug, 'outcome_revision', stored.outcome_revision),
    jsonb_build_object('status', state.status, 'away_score', state.away_score, 'home_score', state.home_score,
      'period', state.period, 'clock', state.clock, 'result_type', state.result_type,
      'official_winner_school_slug', state.official_winner_school_slug, 'outcome_revision', state.outcome_revision)
  from public.game_state state where state.game_id = p_game_id;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.configure_pickem_draft(p_season integer, p_week integer, p_expected_revision bigint, p_title text, p_games jsonb, p_tiebreaker_game_ids text[])
 RETURNS pickem_weeks
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare w public.pickem_weeks%rowtype; item record; catalog record; tb uuid;
  ids text[]; desired jsonb; stored jsonb; changed boolean;
begin
  if auth.uid() is null or not private.can_moderate_scores() then
    raise exception using errcode='42501', message='Pick Em setup requires an active administrator or moderator.';
  end if;
  if p_season is distinct from 2026 or p_week is null or p_week not between 5 and 11 then
    raise exception using errcode='22023', message='Setup supports 2026 Weeks 5 through 11 only.';
  end if;
  if nullif(btrim(p_title),'') is null or length(btrim(p_title))>150
    or p_games is null or jsonb_typeof(p_games)<>'array' then
    raise exception using errcode='22023', message='A title and canonical slate are required.';
  end if;
  if jsonb_array_length(p_games) not between 1 and 12 then
    raise exception using errcode='22023', message='Select between 1 and 12 canonical games.';
  end if;
  select array_agg(x.game_id order by x.ordinality) into ids
    from (select value->>'game_id' as game_id, ordinality from jsonb_array_elements(p_games) with ordinality) x;
  if cardinality(ids)<>(select count(distinct id) from unnest(ids) id) then
    raise exception using errcode='22023', message='Slate games must be unique.';
  end if;
  if cardinality(p_tiebreaker_game_ids) is distinct from 1
    or p_tiebreaker_game_ids[1] is null or not (p_tiebreaker_game_ids[1]=any(ids)) then
    raise exception using errcode='22023', message='Select exactly one Pick Em tiebreaker from the selected slate.';
  end if;
  -- Serializes both initial creation and edits; the revision rejects stale tabs.
  perform pg_advisory_xact_lock(hashtextextended('pickem-setup:'||p_season||':'||p_week,0));
  select * into w from public.pickem_weeks where season=p_season and week=p_week for update;
  if found then
    perform private.assert_pickem_setup_draft(w.id);
    if p_expected_revision is distinct from w.configuration_revision then
      raise exception using errcode = 'PT409', message='The draft changed. Refresh before saving.';
    end if;
  else
    if p_expected_revision is distinct from -1 then
      raise exception using errcode = 'PT409', message='The draft changed. Refresh before saving.';
    end if;
    insert into public.pickem_weeks(season,week,title,status,created_by)
      values(p_season,p_week,btrim(p_title),'draft',auth.uid()) returning * into w;
  end if;
  select coalesce(jsonb_agg(jsonb_build_array(g.game_id,g.sort_order,g.lock_at,g.lock_revision) order by g.sort_order,g.game_id),'[]')
    into stored from public.pickem_games g where g.week_id=w.id;
  -- Lock game_state in deterministic order and validate every caller-supplied ID.
  -- The RPC never accepts arbitrary matchup identity, kickoff or editorial text.
  for item in select * from jsonb_to_recordset(p_games) as x(game_id text, schedule_revision bigint) order by game_id loop
    select * into catalog from private.pickem_admin_catalog() c where c.game_id=item.game_id and c.week=p_week;
    if not found then raise exception using errcode='22023', message='A selected game is outside this canonical week.'; end if;
    if item.schedule_revision is null or item.schedule_revision < 0 then
      raise exception using errcode='22023', message='Every selected game requires an expected schedule revision.';
    end if;
    perform 1 from public.game_state where game_id=item.game_id for update;
    if exists (select 1 from public.game_state s where s.game_id=item.game_id
      and (s.status not in ('upcoming','scheduled') or s.result_type is not null)) then
      raise exception using errcode='55000', message='Only unplayed future games may be configured.';
    end if;
    perform public.sync_pickem_game_lock(w.id,item.game_id,array_position(ids,item.game_id),
      coalesce((select kickoff_override from public.game_state where game_id=item.game_id),catalog.kickoff),
      item.schedule_revision,catalog.away_school_slug,catalog.home_school_slug);
    if exists (select 1 from public.pickem_games where week_id=w.id and game_id=item.game_id and lock_at<=clock_timestamp()) then
      raise exception using errcode='55000', message='Every draft game must have a future kickoff.';
    end if;
  end loop;
  select id into tb from public.pickem_games where week_id=w.id and game_id=p_tiebreaker_game_ids[1];
  -- Move the FK before removing a former tiebreaker; the entire RPC rolls back on failure.
  changed := w.title is distinct from btrim(p_title) or w.tiebreaker_game_id is distinct from tb
    or (p_week>=6 and (w.official_rules_version is distinct from '2026-pickem-cash-v1'
      or w.official_rules_published_at is distinct from '2026-09-27T05:08:44.209029Z'::timestamptz
      or w.presenting_sponsor_name is distinct from 'Gilder Storage'))
    or exists (select 1 from public.pickem_games where week_id=w.id and not(game_id=any(ids)));
  update public.pickem_weeks set tiebreaker_game_id=tb where id=w.id and tiebreaker_game_id is distinct from tb;
  delete from public.pickem_games where week_id=w.id and not(game_id=any(ids));
  -- Detect slate changes as well as week metadata changes.
  select coalesce(jsonb_agg(jsonb_build_array(g.game_id,g.sort_order,g.lock_at,g.lock_revision) order by g.sort_order,g.game_id),'[]')
    into desired from public.pickem_games g where g.week_id=w.id;
  changed := changed or desired is distinct from stored;
  if not changed then return w; end if;
  update public.pickem_weeks set title=btrim(p_title),
    official_rules_version=case when p_week>=6 then '2026-pickem-cash-v1' else w.official_rules_version end,
    official_rules_published_at=case when p_week>=6 then '2026-09-27T05:08:44.209029Z'::timestamptz else w.official_rules_published_at end,
    presenting_sponsor_name=case when p_week>=6 then 'Gilder Storage' else w.presenting_sponsor_name end,
    configuration_revision=configuration_revision+1
    where id=w.id returning * into w;
  return w;
end; $function$
;

CREATE OR REPLACE FUNCTION public.apply_score_submission_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  affected_rows integer;
  current_state public.game_state%rowtype;
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'approved' then
      perform pg_advisory_xact_lock(hashtextextended(new.game_id, 7319));
      select * into current_state from public.game_state where game_id = new.game_id for update;
      if (found and (new.expected_state_absent or new.expected_state_updated_at is null
                     or new.expected_state_revision is null
                     or current_state.updated_at is distinct from new.expected_state_updated_at
                     or current_state.score_revision is distinct from new.expected_state_revision))
         or (not found and (not new.expected_state_absent or new.expected_state_updated_at is not null
                            or new.expected_state_revision is not null)) then
        raise exception using errcode = 'PT409', message = 'Game changed — review the current score.';
      end if;
      new.reviewed_at := coalesce(new.reviewed_at, now());
      insert into public.score_submission_events (submission_id,event_type,actor_id,note,payload)
      values (new.id,'approved',new.reviewed_by,new.review_note,
        jsonb_build_object('game_id',new.game_id,'home_score',new.home_score,
          'away_score',new.away_score,'game_status',new.game_status,'period',new.period,'clock',new.clock));
      insert into public.game_state (
        game_id,status,home_score,away_score,period,clock,source_submission_id,
        verified,verified_at,updated_by,result_type
      ) values (
        new.game_id,new.game_status,new.home_score,new.away_score,new.period,new.clock,
        new.id,true,now(),new.reviewed_by,
        case when new.game_status='final' and new.home_score<>new.away_score then 'played' else null end
      )
      on conflict (game_id) do update set
        status=excluded.status,home_score=excluded.home_score,away_score=excluded.away_score,
        period=excluded.period,clock=excluded.clock,source_submission_id=excluded.source_submission_id,
        verified=true,verified_at=excluded.verified_at,updated_by=excluded.updated_by,
        result_type=excluded.result_type,official_winner_school_slug=null,updated_at=now()
      where not (public.game_state.verified and public.game_state.status in ('final','cancelled','postponed'));
      get diagnostics affected_rows = row_count;
      if affected_rows = 0 then
        raise exception using errcode = 'P0001', message = 'Approval blocked: this game already has a verified terminal state.';
      end if;
      update public.score_submissions set status='superseded', reviewed_by=new.reviewed_by,
        reviewed_at=now(), review_note=coalesce(review_note,'Superseded by approved score update '||new.id::text)
      where game_id=new.game_id and id<>new.id and status='pending';
    elsif new.status='rejected' then
      new.reviewed_at := coalesce(new.reviewed_at,now());
      insert into public.score_submission_events(submission_id,event_type,actor_id,note)
      values(new.id,'rejected',new.reviewed_by,new.review_note);
    elsif new.status='superseded' then
      insert into public.score_submission_events(submission_id,event_type,actor_id,note)
      values(new.id,'superseded',new.reviewed_by,new.review_note);
    end if;
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.open_pickem_draft(p_week_id uuid, p_expected_revision bigint, p_schedule_revisions jsonb)
 RETURNS pickem_weeks
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare w public.pickem_weeks%rowtype; g record; c record; s public.game_state%rowtype; n integer;
begin
  if auth.uid() is null or not private.can_moderate_scores() then
    raise exception using errcode='42501', message='Pick Em setup requires an active administrator or moderator.';
  end if;
  select * into w from public.pickem_weeks where id=p_week_id for update;
  if not found or w.season<>2026 or w.week not between 5 and 11 then
    raise exception using errcode='22023', message='Setup supports 2026 Weeks 5 through 11 only.';
  end if;
  perform private.assert_pickem_setup_draft(w.id);
  if p_expected_revision is distinct from w.configuration_revision then
    raise exception using errcode = 'PT409', message='The draft changed. Refresh before opening.';
  end if;
  if p_schedule_revisions is null or jsonb_typeof(p_schedule_revisions)<>'object' then
    raise exception using errcode='22023', message='Schedule revisions are required.';
  end if;
  select count(*) into n from public.pickem_games where week_id=w.id;
  if n not between 1 and 12 or not exists(select 1 from public.pickem_games where id=w.tiebreaker_game_id and week_id=w.id)
    or (w.week>=6 and (w.official_rules_version is distinct from '2026-pickem-cash-v1'
      or w.official_rules_published_at is distinct from '2026-09-27T05:08:44.209029Z'::timestamptz
      or w.presenting_sponsor_name is distinct from 'Gilder Storage')) then
    raise exception using errcode='22023', message='Save a complete draft with approved rules, sponsor and tiebreaker first.';
  end if;
  for g in select * from public.pickem_games where week_id=w.id order by game_id loop
    select * into c from private.pickem_admin_catalog() where game_id=g.game_id and week=w.week;
    if not found then raise exception using errcode='22023', message='A selected game is outside this canonical week.'; end if;
    select * into s from public.game_state where game_id=g.game_id for update;
    if s.game_id is not null and (s.status not in ('upcoming','scheduled') or s.result_type is not null) then
      raise exception using errcode='55000', message='Only unplayed future games may be opened.';
    end if;
    if (p_schedule_revisions->>g.game_id)::bigint is distinct from coalesce(s.schedule_revision,0)
      or g.lock_at is distinct from coalesce(s.kickoff_override,c.kickoff)
      or g.away_school_slug is distinct from c.away_school_slug or g.home_school_slug is distinct from c.home_school_slug then
      raise exception using errcode = 'PT409', message='The schedule changed. Refresh and save the draft before opening.';
    end if;
  end loop;
  update public.pickem_weeks set status='open',opens_at=now(),
    closes_at=(select max(lock_at)+interval '1 second' from public.pickem_games where week_id=w.id),
    configuration_revision=configuration_revision+1 where id=w.id returning * into w;
  return w;
end; $function$
;

CREATE OR REPLACE FUNCTION public.review_missing_score_evidence(target_evidence_id uuid, decision text, note text, p_expected_game_id text, p_expected_state_updated_at timestamp with time zone, p_expected_state_revision bigint, p_expected_state_absent boolean, p_evidence_snapshot jsonb, p_confirm_final boolean, p_result_type text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  actor uuid := auth.uid(); e public.missing_score_evidence%rowtype;
  i public.missing_score_intelligence%rowtype; g public.game_state%rowtype;
  submission uuid; actual_snapshot jsonb;
  clean_note text := nullif(left(btrim(coalesce(note,'')),1000),'');
begin
  if actor is null or not private.can_moderate_scores() then
    raise exception using errcode='42501',message='Moderator access required.';
  end if;
  if decision is null or decision not in('approve','reject','defer') or nullif(p_expected_game_id,'') is null then
    raise exception using errcode='22023',message='Invalid evidence decision.';
  end if;
  -- Match the scoring order: game advisory lock -> game_state -> candidate -> evidence.
  -- Publication's AFTER trigger resolves the candidate; never hold it before the game lock.
  perform pg_advisory_xact_lock(hashtextextended(p_expected_game_id,7319));
  select * into g from public.game_state where game_id=p_expected_game_id for update;
  select * into i from public.missing_score_intelligence
    where id=(select intelligence_id from public.missing_score_evidence where id=target_evidence_id) for update;
  select * into e from public.missing_score_evidence where id=target_evidence_id for update;
  if e.id is null or i.id is null then
    raise exception using errcode='P0002',message='Score evidence not found.';
  end if;
  if e.intelligence_id is distinct from i.id or i.game_id is distinct from p_expected_game_id then
    raise exception using errcode = 'PT409',message='Game mapping changed — review the evidence again.';
  end if;
  if i.status<>'open' then
    raise exception using errcode='55000',message='This missing-score item is no longer open.';
  end if;
  actual_snapshot := jsonb_build_object('id',e.id,'intelligence_id',e.intelligence_id,'game_id',i.game_id,
    'away_score',e.away_score,'home_score',e.home_score,'source_name',e.source_name,
    'source_type',e.source_type,'source_url',e.source_url,'ingestion_method',e.ingestion_method,
    'evidence_note',e.evidence_note,'captured_at',e.captured_at,'review_status',e.review_status,
    'away_school_slug',i.away_school_slug,'home_school_slug',i.home_school_slug);
  if p_evidence_snapshot is distinct from actual_snapshot then
    raise exception using errcode = 'PT409',message='Evidence changed — review the evidence again.';
  end if;
  if e.review_status not in('pending','deferred') then
    raise exception using errcode='55000',message='This evidence can no longer be reviewed.';
  end if;
  if decision<>'approve' then
    update public.missing_score_evidence set review_status=case when decision='reject' then 'rejected' else 'deferred' end,
      reviewed_by=actor,reviewed_at=now(),review_note=clean_note where id=e.id;
    return jsonb_build_object('decision',decision,'game_id',i.game_id);
  end if;
  if p_confirm_final is not true then
    raise exception using errcode='22023',message='Confirm the teams, scores, and ordinary FINAL result before publishing.';
  end if;
  if p_result_type is distinct from 'played' or g.result_type in('forfeit','no_contest','tie')
    or g.status in('cancelled','postponed') then
    raise exception using errcode='22023',message='Exceptional outcomes require the existing authorized outcome workflow.';
  end if;
  if e.home_score is null or e.away_score is null then
    raise exception using errcode='22023',message='Approved evidence must include both final scores.';
  end if;
  if e.home_score=e.away_score then
    raise exception using errcode='22023',message='Tied results require the existing authorized outcome workflow.';
  end if;
  if (g.game_id is not null and (p_expected_state_absent is distinct from false
      or p_expected_state_updated_at is null or p_expected_state_revision is null
      or g.updated_at is distinct from p_expected_state_updated_at
      or g.score_revision is distinct from p_expected_state_revision))
    or(g.game_id is null and (p_expected_state_absent is distinct from true
      or p_expected_state_updated_at is not null or p_expected_state_revision is not null)) then
    raise exception using errcode = 'PT409',message='Game changed — review the current score.';
  end if;
  if g.verified and g.status in('final','cancelled','postponed') then
    raise exception using errcode='P0001',message='Approval blocked: this game already has a verified terminal state.';
  end if;
  submission := public.submit_trusted_score_update(i.game_id,e.home_score,e.away_score,'final',null,null,
    left('Score Scout evidence: '||e.source_name||coalesce(' — '||e.source_url,''),500),
    p_expected_state_updated_at,p_expected_state_revision,p_expected_state_absent);
  select * into g from public.game_state where game_id=i.game_id;
  if g.away_school_slug is distinct from i.away_school_slug or g.home_school_slug is distinct from i.home_school_slug then
    raise exception using errcode = 'PT409',message='Game mapping changed — review the evidence again.';
  end if;
  if not exists(select 1 from public.internal_score_submissions s join public.game_state state
    on state.source_submission_id=s.id and state.game_id=s.game_id
    where s.id=submission and s.status='approved' and s.game_id=i.game_id
      and s.submitted_by=actor and s.reviewed_by=actor and s.game_status='final'
      and s.home_score=e.home_score and s.away_score=e.away_score and s.period is null and s.clock is null
      and state.verified and state.status='final' and state.result_type='played'
      and state.home_score=e.home_score and state.away_score=e.away_score
      and state.updated_by=actor and state.period is null and state.clock is null) then
    raise exception using errcode='55000',message='Score Scout publication could not be verified.';
  end if;
  update public.missing_score_evidence set review_status='superseded',reviewed_by=actor,
    reviewed_at=now(),review_note=coalesce(review_note,'Superseded by approved evidence for this game.')
    where intelligence_id=i.id and id<>e.id and review_status in('pending','deferred');
  update public.missing_score_evidence set review_status='approved',reviewed_by=actor,
    reviewed_at=now(),review_note=clean_note where id=e.id;
  perform private.log_score_scout_publication(e.id,submission);
  return jsonb_build_object('decision',decision,'game_id',i.game_id,'submission_id',submission,'submission_status','approved');
end;
$function$
;

CREATE OR REPLACE FUNCTION private.publish_trusted_score(p_game_id text, p_home_score integer, p_away_score integer, p_game_status text, p_period text, p_clock text, p_source_note text, p_expected_state_updated_at timestamp with time zone, p_expected_state_revision bigint, p_expected_state_absent boolean, p_assigned_scorekeeper boolean, p_confirm_score_decrease boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare actor uuid := auth.uid(); submission uuid; authority jsonb;
 g public.game_state%rowtype; s public.score_submissions%rowtype;
begin
 if actor is null or p_assigned_scorekeeper is null then
  raise exception using errcode='42501',message='Trusted score authority required.';
 end if;
 if not p_assigned_scorekeeper and not private.can_moderate_scores() then
  raise exception using errcode='42501',message='Trusted score authority required.';
 end if;
 if p_game_status is null or p_game_status not in ('live','final') or p_away_score is null or p_home_score is null
 or p_away_score not between 0 and 150 or p_home_score not between 0 and 150
 or char_length(coalesce(p_period,''))>30 or char_length(coalesce(p_clock,''))>30
 or char_length(coalesce(p_source_note,''))>1000 then
  raise exception using errcode='22023',message='Invalid score or status.';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(p_game_id,7319));
 select * into g from public.game_state where game_id=p_game_id for update;
 if p_assigned_scorekeeper then
  -- Authorization is not inferred from the caller-selected path flag.
  authority := private.assigned_scorekeeper_authority(p_game_id);
  if p_game_status<>'live' or p_expected_state_absent is distinct from false or p_source_note is not null then
   raise exception using errcode='22023',message='Assigned scorekeepers may publish LIVE fields only.';
  end if;
  if p_expected_state_updated_at is null or p_expected_state_revision is null
   or g.updated_at is distinct from p_expected_state_updated_at or g.score_revision is distinct from p_expected_state_revision then
   raise exception using errcode = 'PT409',message='Game changed — review the current score.';
  end if;
  if nullif(btrim(p_period),'') is not null and btrim(p_period) !~ '^(1st|2nd|3rd|4th|OT|OT[2-9][0-9]*)$' then
   raise exception using errcode='22023',message='Choose a valid quarter or overtime period.';
  end if;
  -- Optional football clock: 0:00 through 15:00, seconds 00–59.
  if nullif(btrim(p_clock),'') is not null and btrim(p_clock) !~ '^((0?[0-9]|1[0-4]):[0-5][0-9]|15:00)$' then
   raise exception using errcode='22023',message='Use a game clock from 0:00 through 15:00 (minutes:seconds).';
  end if;
  if (p_home_score<g.home_score or p_away_score<g.away_score) and p_confirm_score_decrease is distinct from true then
   raise exception using errcode='22023',message='Confirm the score decrease before publishing.';
  end if;
 end if;
 insert into public.score_submissions(game_id,submitted_by,home_score,away_score,game_status,period,clock,source_note,
 expected_state_updated_at,expected_state_revision,expected_state_absent)
 values(p_game_id,actor,p_home_score,p_away_score,p_game_status,
 case when p_game_status='live' then nullif(btrim(p_period),'') else null end,
 case when p_game_status='live' then nullif(btrim(p_clock),'') else null end,
 nullif(btrim(p_source_note),''),p_expected_state_updated_at,p_expected_state_revision,p_expected_state_absent)
 returning id into submission;
 if p_assigned_scorekeeper then
  insert into public.score_submission_events(submission_id,event_type,actor_id,note,payload)
  values(submission,'note_added',actor,'Assigned scorekeeper LIVE publication authorization.',
   jsonb_build_object('kind','assigned_scorekeeper_authority_v1','submission_id',submission,'authority',authority,
   'home_score',p_home_score,'away_score',p_away_score,'period',nullif(btrim(p_period),''),'clock',nullif(btrim(p_clock),'')));
 end if;
 -- The existing review trigger remains the sole canonical publication mechanism.
 update public.score_submissions set status='approved',reviewed_by=actor,
 review_note='Approved at submission by trusted score authority.' where id=submission and status='pending';
 select * into s from public.score_submissions where id=submission;
 select * into g from public.game_state where game_id=p_game_id;
 if s.status<>'approved' or s.submitted_by is distinct from actor or s.reviewed_by is distinct from actor
 or g.source_submission_id is distinct from submission or g.updated_by is distinct from actor or not g.verified
 or g.status is distinct from p_game_status or g.home_score is distinct from p_home_score or g.away_score is distinct from p_away_score
 or g.period is distinct from s.period or g.clock is distinct from s.clock then
  raise exception using errcode='55000',message='Trusted publication verification failed.';
 end if;
 if p_assigned_scorekeeper and not exists(select 1 from public.score_submission_events e
  where e.submission_id=submission and e.event_type='approved' and e.actor_id=actor and e.payload->>'publisher_bound_v1'='true') then
  raise exception using errcode='55000',message='Assigned publisher corroboration failed.';
 end if;
 return submission;
end $function$
;

commit;

