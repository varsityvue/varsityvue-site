-- Administrator-only origination of scoreless exceptional outcomes.
--
-- Repository games remain the canonical catalog. The trusted application
-- passes the catalog identity into this operation, which atomically creates or
-- updates its dynamic state, grades Pick 'Em, and records an immutable audit
-- row. Numeric score notifications already require both scores and therefore
-- cannot be created by this scoreless operation.

alter table private.game_outcome_audit
  add column source text,
  add constraint game_outcome_audit_source_valid
    check (source is null or (btrim(source) <> '' and char_length(source) <= 300));

comment on column private.game_outcome_audit.source is
  'Authoritative source citation required when an exceptional outcome is originated.';

create or replace function public.admin_originate_canonical_game_outcome(
  p_game_id text,
  p_expected_outcome_revision bigint,
  p_result_type text,
  p_official_winner_school_slug text,
  p_source text,
  p_reason text,
  p_away_school_slug text,
  p_home_school_slug text
)
returns table (
  game_id text,
  result_type text,
  official_winner_school_slug text,
  outcome_revision bigint,
  away_score integer,
  home_score integer,
  verified boolean,
  status text
)
language plpgsql
security definer
set search_path = ''
as $$
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

  -- Serialize both the no-row-yet and existing-row cases for this game. A row
  -- lock alone cannot protect two concurrent attempts to insert absent state.
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
      raise exception using errcode = '40001', message = 'Stale outcome revision. Refresh and try again.';
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
    raise exception using errcode = '40001', message = 'Stale outcome revision. Refresh and try again.';
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

  -- Pending numeric reports cannot validly supersede a canonical exceptional
  -- final. Preserve them as immutable history while removing them from review.
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
$$;

revoke all on function public.admin_originate_canonical_game_outcome(
  text, bigint, text, text, text, text, text, text
) from public, anon;
grant execute on function public.admin_originate_canonical_game_outcome(
  text, bigint, text, text, text, text, text, text
) to authenticated;

comment on function public.admin_originate_canonical_game_outcome(
  text, bigint, text, text, text, text, text, text
) is 'Atomically originates an administrator-authorized scoreless forfeit or no-contest with source, audit, grading, and optimistic concurrency.';
