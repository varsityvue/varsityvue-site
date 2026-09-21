-- Administrator-only canonical exceptional outcome workflow.
--
-- This migration adds a dedicated optimistic-concurrency token, immutable
-- private audit storage, and one atomic trusted operation. Existing grading
-- and member-total triggers remain the authoritative recalculation path.

alter table public.game_state
  add column outcome_revision bigint not null default 0,
  add constraint game_state_outcome_revision_nonnegative
    check (outcome_revision >= 0);

comment on column public.game_state.outcome_revision is
  'Monotonic revision for administrator canonical-outcome corrections.';

create table private.game_outcome_audit (
  id bigint generated always as identity primary key,
  game_id text not null,
  actor_id uuid references public.profiles(id) on delete set null,
  occurred_at timestamptz not null default clock_timestamp(),
  reason text not null check (btrim(reason) <> '' and char_length(reason) <= 500),
  previous_result_type text,
  new_result_type text not null
    check (new_result_type in ('played', 'tie', 'forfeit', 'no_contest')),
  previous_official_winner_school_slug text,
  new_official_winner_school_slug text,
  previous_away_score integer,
  previous_home_score integer,
  new_away_score integer,
  new_home_score integer,
  previous_status text not null,
  new_status text not null,
  previous_verified boolean not null,
  new_verified boolean not null,
  previous_verified_at timestamptz,
  new_verified_at timestamptz,
  previous_outcome_revision bigint not null check (previous_outcome_revision >= 0),
  new_outcome_revision bigint not null
    check (new_outcome_revision = previous_outcome_revision + 1)
);

create index game_outcome_audit_game_idx
  on private.game_outcome_audit(game_id, occurred_at desc, id desc);
create index game_outcome_audit_actor_idx
  on private.game_outcome_audit(actor_id, occurred_at desc, id desc)
  where actor_id is not null;

alter table private.game_outcome_audit enable row level security;
revoke all on table private.game_outcome_audit from public, anon, authenticated;
revoke all on sequence private.game_outcome_audit_id_seq from public, anon, authenticated;

create or replace function private.guard_canonical_outcome_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated')
    and (
      (
        tg_op = 'INSERT'
        and (
          new.result_type is not null
          or new.official_winner_school_slug is not null
          or new.outcome_revision <> 0
        )
      )
      or (
        tg_op = 'UPDATE'
        and (
          new.result_type is distinct from old.result_type
          or new.official_winner_school_slug is distinct from old.official_winner_school_slug
          or new.outcome_revision is distinct from old.outcome_revision
          or (
            old.verified is true
            and old.status = 'final'
            and (
              new.status is distinct from old.status
              or new.home_score is distinct from old.home_score
              or new.away_score is distinct from old.away_score
              or new.verified is distinct from old.verified
              or new.verified_at is distinct from old.verified_at
            )
          )
        )
      )
    ) then
    raise exception using
      errcode = '42501',
      message = 'Canonical outcome changes must use the administrator outcome operation.';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_canonical_outcome_write()
  from public, anon, authenticated;

create trigger guard_canonical_outcome_write
before insert or update
on public.game_state
for each row execute function private.guard_canonical_outcome_write();

create or replace function public.admin_set_canonical_game_outcome(
  p_game_id text,
  p_expected_outcome_revision bigint,
  p_result_type text,
  p_official_winner_school_slug text,
  p_reason text,
  p_away_score integer default null,
  p_home_score integer default null
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
    raise exception using errcode = '40001', message = 'Stale outcome revision. Refresh and try again.';
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
$$;

revoke all on function public.admin_set_canonical_game_outcome(
  text, bigint, text, text, text, integer, integer
) from public, anon;
grant execute on function public.admin_set_canonical_game_outcome(
  text, bigint, text, text, text, integer, integer
) to authenticated;

comment on function public.admin_set_canonical_game_outcome(
  text, bigint, text, text, text, integer, integer
) is 'Atomically records an administrator-authorized canonical game outcome and audit event.';
