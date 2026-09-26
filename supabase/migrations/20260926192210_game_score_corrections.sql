-- Trusted score correction operation. Every correction is atomic with its audit entry.
create table private.game_score_correction_audit (
  id bigint generated always as identity primary key,
  game_id text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  occurred_at timestamptz not null default clock_timestamp(),
  reason text not null check (btrim(reason) <> '' and char_length(reason) <= 500),
  previous_state jsonb not null,
  corrected_state jsonb not null
);
create index game_score_correction_audit_game_idx on private.game_score_correction_audit(game_id, occurred_at desc, id desc);
alter table private.game_score_correction_audit enable row level security;
revoke all on private.game_score_correction_audit from public, anon, authenticated;
revoke all on sequence private.game_score_correction_audit_id_seq from public, anon, authenticated;

create or replace function public.correct_game_score(
  p_game_id text, p_expected_updated_at timestamptz, p_expected_outcome_revision bigint,
  p_status text, p_away_score integer, p_home_score integer,
  p_period text, p_clock text, p_reason text
) returns void language plpgsql security definer set search_path = '' as $$
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
    raise exception using errcode = '40001', message = 'Game changed after opening the editor. Refresh and review it again.';
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
$$;
revoke all on function public.correct_game_score(text,timestamptz,bigint,text,integer,integer,text,text,text) from public, anon;
grant execute on function public.correct_game_score(text,timestamptz,bigint,text,integer,integer,text,text,text) to authenticated;
