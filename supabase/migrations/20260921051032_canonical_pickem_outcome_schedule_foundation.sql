-- Canonical outcome and schedule foundation for Pick 'Em.
--
-- kickoff_override already exists in production from an applied migration that
-- was not committed to this repository. Keep this repair forward-safe for both
-- production and clean database rebuilds.

alter table public.game_state
  add column if not exists kickoff_override timestamptz;

alter table public.game_state
  alter column kickoff_override type timestamptz
  using kickoff_override::timestamptz;

comment on column public.game_state.kickoff_override is
  'Verified canonical kickoff override stored as an absolute instant.';

alter table public.game_state
  add column result_type text,
  add column official_winner_school_slug text,
  add column away_school_slug text,
  add column home_school_slug text,
  add column schedule_revision bigint not null default 0,
  add column schedule_revised_at timestamptz;

alter table public.game_state
  add constraint game_state_result_type_check
  check (result_type is null or result_type in ('played', 'tie', 'forfeit', 'no_contest'))
  not valid,
  add constraint game_state_distinct_canonical_teams
  check (away_school_slug is null or home_school_slug is null or away_school_slug <> home_school_slug)
  not valid,
  add constraint game_state_schedule_revision_nonnegative
  check (schedule_revision >= 0)
  not valid;

-- The only safe historical classification is a verified final with two unequal
-- numeric scores. Equal scores remain unclassified because they do not prove an
-- official tie, and no forfeit/no-contest is inferred from legacy text.
-- Disable side-effect triggers only for this metadata backfill so historical
-- finals cannot enqueue email, resolve intelligence, or regrade real picks.
alter table public.game_state disable trigger create_product_event_after_verified_final;
alter table public.game_state disable trigger resolve_missing_score_intelligence_after_game_state;
alter table public.game_state disable trigger verified_final_grades_pickem;

update public.game_state
set result_type = 'played'
where result_type is null
  and verified is true
  and status = 'final'
  and home_score is not null
  and away_score is not null
  and home_score <> away_score;

alter table public.game_state enable trigger create_product_event_after_verified_final;
alter table public.game_state enable trigger resolve_missing_score_intelligence_after_game_state;
alter table public.game_state enable trigger verified_final_grades_pickem;

-- Reuse identity already curated for a Pick 'Em matchup when it is available.
-- A game can appear in multiple weeks only if every stored matchup agrees.
with unambiguous_matchups as (
  select game_id,
         min(away_school_slug) as away_school_slug,
         min(home_school_slug) as home_school_slug
  from public.pickem_games
  where away_school_slug is not null and home_school_slug is not null
  group by game_id
  having count(distinct (away_school_slug, home_school_slug)) = 1
)
update public.game_state state
set away_school_slug = matchup.away_school_slug,
    home_school_slug = matchup.home_school_slug
from unambiguous_matchups matchup
where state.game_id = matchup.game_id
  and state.away_school_slug is null
  and state.home_school_slug is null;

alter table public.game_state
  add constraint game_state_canonical_result_valid
  check (
    case
      when status in ('cancelled', 'postponed') then
        result_type is null and official_winner_school_slug is null
      when result_type is null then
        official_winner_school_slug is null
      when result_type = 'played' then
        status = 'final'
        and verified is true
        and home_score is not null
        and away_score is not null
        and home_score <> away_score
        and official_winner_school_slug is null
      when result_type = 'tie' then
        status = 'final'
        and verified is true
        and home_score is not null
        and away_score is not null
        and home_score = away_score
        and official_winner_school_slug is null
      when result_type = 'forfeit' then
        status = 'final'
        and verified is true
        and official_winner_school_slug is not null
        and away_school_slug is not null
        and home_school_slug is not null
        and away_school_slug <> home_school_slug
        and official_winner_school_slug in (away_school_slug, home_school_slug)
      when result_type = 'no_contest' then
        status = 'final'
        and verified is true
        and official_winner_school_slug is null
      else false
    end
  ) not valid;

alter table public.game_state validate constraint game_state_result_type_check;
alter table public.game_state validate constraint game_state_distinct_canonical_teams;
alter table public.game_state validate constraint game_state_schedule_revision_nonnegative;
alter table public.game_state validate constraint game_state_canonical_result_valid;

comment on column public.game_state.result_type is
  'Explicit canonical disposition: played, tie, forfeit, no_contest, or NULL while unclassified.';
comment on column public.game_state.official_winner_school_slug is
  'Authoritative winner for forfeits only; never inferred from scores.';
comment on column public.game_state.schedule_revision is
  'Internal monotonic revision used for optimistic schedule concurrency.';

alter table public.pickem_games
  add column lock_revision bigint not null default 0,
  add constraint pickem_games_lock_revision_nonnegative check (lock_revision >= 0);

create table private.game_schedule_audit (
  id bigint generated always as identity primary key,
  game_id text not null,
  pickem_game_id uuid references public.pickem_games(id) on delete set null,
  action_type text not null check (action_type in ('schedule_update', 'slate_sync', 'manual_reopen')),
  actor_id uuid references public.profiles(id) on delete set null,
  occurred_at timestamptz not null default clock_timestamp(),
  previous_canonical_kickoff timestamptz,
  new_canonical_kickoff timestamptz,
  previous_pickem_lock timestamptz,
  new_pickem_lock timestamptz,
  reason text not null check (btrim(reason) <> ''),
  previous_schedule_revision bigint not null check (previous_schedule_revision >= 0),
  new_schedule_revision bigint not null check (new_schedule_revision >= previous_schedule_revision),
  previous_lock_revision bigint,
  new_lock_revision bigint,
  automatic boolean not null,
  constraint game_schedule_audit_lock_revision_pair check (
    (previous_lock_revision is null and new_lock_revision is null)
    or (
      previous_lock_revision is not null
      and new_lock_revision is not null
      and previous_lock_revision >= 0
      and new_lock_revision >= previous_lock_revision
    )
  )
);

create index game_schedule_audit_game_idx
  on private.game_schedule_audit(game_id, occurred_at desc, id desc);
create index game_schedule_audit_pickem_game_idx
  on private.game_schedule_audit(pickem_game_id, occurred_at desc, id desc)
  where pickem_game_id is not null;

alter table private.game_schedule_audit enable row level security;
revoke all on table private.game_schedule_audit from public, anon, authenticated;
revoke all on sequence private.game_schedule_audit_id_seq from public, anon, authenticated;

create or replace function private.resolve_chicago_local_kickoff(
  p_local timestamp without time zone
)
returns timestamptz
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  resolved timestamptz;
  candidate_count integer;
begin
  if p_local is null then
    raise exception using errcode = '22007', message = 'Invalid local kickoff.';
  end if;

  with base as (
    select p_local at time zone 'America/Chicago' as guessed
  ), candidates as (
    select distinct base.guessed + offsets.delta as candidate
    from base
    cross join (values
      (-1 * interval '1 hour'),
      (interval '0 hours'),
      (interval '1 hour')
    ) offsets(delta)
    where timezone('America/Chicago', base.guessed + offsets.delta) = p_local
  )
  select count(*), min(candidate)
  into candidate_count, resolved
  from candidates;

  if candidate_count = 0 then
    raise exception using
      errcode = '22007',
      message = 'Invalid Central Time kickoff: the local time does not exist because of daylight saving time.';
  end if;

  if candidate_count > 1 then
    raise exception using
      errcode = '22007',
      message = 'Ambiguous Central Time kickoff: choose a time outside the repeated daylight-saving hour.';
  end if;

  return resolved;
end;
$$;

revoke all on function private.resolve_chicago_local_kickoff(timestamp without time zone)
  from public, anon, authenticated;

create or replace function private.guard_canonical_schedule_write()
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
          new.kickoff_override is not null
          or new.schedule_revision <> 0
          or new.schedule_revised_at is not null
        )
      )
      or (
        tg_op = 'UPDATE'
        and (
          new.kickoff_override is distinct from old.kickoff_override
          or new.schedule_revision is distinct from old.schedule_revision
          or new.schedule_revised_at is distinct from old.schedule_revised_at
        )
      )
    ) then
    raise exception using
      errcode = '42501',
      message = 'Canonical kickoff changes must use the authorized schedule operation.';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_canonical_schedule_write() from public, anon, authenticated;

create trigger guard_canonical_schedule_write
before insert or update
on public.game_state
for each row execute function private.guard_canonical_schedule_write();

create or replace function private.guard_pickem_lock_write()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated') then
    raise exception using
      errcode = '42501',
      message = 'Pick Em lock changes must use an authorized lock operation.';
  end if;
  return new;
end;
$$;

revoke all on function private.guard_pickem_lock_write() from public, anon, authenticated;

create trigger guard_pickem_lock_write
before update of lock_at, lock_revision
on public.pickem_games
for each row execute function private.guard_pickem_lock_write();

create or replace function private.guard_pickem_game_delete()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if current_user in ('anon', 'authenticated')
    and (
      now() >= old.lock_at
      or exists (
        select 1 from public.pickem_picks pick where pick.pickem_game_id = old.id
      )
    ) then
    raise exception using
      errcode = '42501',
      message = 'A locked Pick Em game or a game with member picks cannot be removed.';
  end if;
  return old;
end;
$$;

revoke all on function private.guard_pickem_game_delete() from public, anon, authenticated;

create trigger guard_pickem_game_delete
before delete on public.pickem_games
for each row execute function private.guard_pickem_game_delete();

create or replace function public.update_canonical_game_kickoff(
  p_game_id text,
  p_expected_revision bigint,
  p_expected_current_kickoff timestamptz,
  p_kickoff_local timestamp without time zone,
  p_reason text,
  p_away_school_slug text,
  p_home_school_slug text
)
returns table (
  schedule_revision bigint,
  canonical_kickoff timestamptz,
  changed boolean
)
language plpgsql
security definer
set search_path = ''
as $$
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
      raise exception using errcode = '40001', message = 'Stale schedule revision. Refresh and try again.';
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
    raise exception using errcode = '40001', message = 'Stale schedule revision. Refresh and try again.';
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
$$;

revoke all on function public.update_canonical_game_kickoff(
  text, bigint, timestamptz, timestamp without time zone, text, text, text
) from public, anon;
grant execute on function public.update_canonical_game_kickoff(
  text, bigint, timestamptz, timestamp without time zone, text, text, text
) to authenticated;

create or replace function public.sync_pickem_game_lock(
  p_week_id uuid,
  p_game_id text,
  p_sort_order integer,
  p_canonical_kickoff timestamptz,
  p_expected_schedule_revision bigint,
  p_away_school_slug text,
  p_home_school_slug text
)
returns table (pickem_game_id uuid, lock_at timestamptz, lock_revision bigint)
language plpgsql
security definer
set search_path = ''
as $$
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
      raise exception using errcode = '40001', message = 'Stale schedule revision. Refresh and try again.';
    end if;
  elsif p_expected_schedule_revision <> 0 then
    raise exception using errcode = '40001', message = 'Stale schedule revision. Refresh and try again.';
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
$$;

revoke all on function public.sync_pickem_game_lock(uuid, text, integer, timestamptz, bigint, text, text)
  from public, anon;
grant execute on function public.sync_pickem_game_lock(uuid, text, integer, timestamptz, bigint, text, text)
  to authenticated;

create or replace function public.admin_reopen_pickem_game(
  p_pickem_game_id uuid,
  p_new_lock timestamptz,
  p_expected_lock_revision bigint,
  p_reason text
)
returns table (lock_at timestamptz, lock_revision bigint)
language plpgsql
security definer
set search_path = ''
as $$
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
    raise exception using errcode = '40001', message = 'Stale lock revision. Refresh and try again.';
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
$$;

revoke all on function public.admin_reopen_pickem_game(uuid, timestamptz, bigint, text)
  from public, anon;
grant execute on function public.admin_reopen_pickem_game(uuid, timestamptz, bigint, text)
  to authenticated;

-- Score approvals remain the canonical normal-result writer. Unequal verified
-- finals are explicitly classified as played; equal finals stay unclassified
-- until an authority records an official tie.
create or replace function public.apply_score_submission_review()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_rows integer;
begin
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'approved' then
      new.reviewed_at := coalesce(new.reviewed_at, now());

      insert into public.score_submission_events (
        submission_id, event_type, actor_id, note, payload
      ) values (
        new.id, 'approved', new.reviewed_by, new.review_note,
        jsonb_build_object(
          'game_id', new.game_id,
          'home_score', new.home_score,
          'away_score', new.away_score,
          'game_status', new.game_status,
          'period', new.period,
          'clock', new.clock
        )
      );

      insert into public.game_state (
        game_id, status, home_score, away_score, period, clock,
        source_submission_id, verified, verified_at, updated_by, result_type
      ) values (
        new.game_id, new.game_status, new.home_score, new.away_score,
        new.period, new.clock, new.id, true, now(), new.reviewed_by,
        case
          when new.game_status = 'final' and new.home_score <> new.away_score then 'played'
          else null
        end
      )
      on conflict (game_id) do update set
        status = excluded.status,
        home_score = excluded.home_score,
        away_score = excluded.away_score,
        period = excluded.period,
        clock = excluded.clock,
        source_submission_id = excluded.source_submission_id,
        verified = true,
        verified_at = excluded.verified_at,
        updated_by = excluded.updated_by,
        result_type = excluded.result_type,
        official_winner_school_slug = null,
        updated_at = now()
      where not (
        public.game_state.verified
        and public.game_state.status in ('final', 'cancelled', 'postponed')
      );

      get diagnostics affected_rows = row_count;
      if affected_rows = 0 then
        raise exception using
          errcode = 'P0001',
          message = 'Approval blocked: this game already has a verified terminal state.';
      end if;

      update public.score_submissions
      set status = 'superseded',
          reviewed_by = new.reviewed_by,
          reviewed_at = now(),
          review_note = coalesce(review_note, 'Superseded by approved score update ' || new.id::text)
      where game_id = new.game_id and id <> new.id and status = 'pending';
    elsif new.status = 'rejected' then
      new.reviewed_at := coalesce(new.reviewed_at, now());
      insert into public.score_submission_events (submission_id, event_type, actor_id, note)
      values (new.id, 'rejected', new.reviewed_by, new.review_note);
    elsif new.status = 'superseded' then
      insert into public.score_submission_events (submission_id, event_type, actor_id, note)
      values (new.id, 'superseded', new.reviewed_by, new.review_note);
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.apply_score_submission_review() from public, anon, authenticated;

-- Grading consumes only explicit, constraint-valid canonical outcomes.
create or replace function private.grade_pickem_from_verified_final()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_game record;
  winner_slug text;
begin
  for selected_game in
    select id, away_school_slug, home_school_slug
    from public.pickem_games
    where game_id = new.game_id
    order by id
  loop
    winner_slug := null;

    if new.verified is true and new.status = 'final' and new.result_type = 'played' then
      winner_slug := case
        when new.away_score > new.home_score then selected_game.away_school_slug
        else selected_game.home_school_slug
      end;
    elsif new.verified is true and new.status = 'final' and new.result_type = 'forfeit' then
      winner_slug := new.official_winner_school_slug;
    end if;

    if winner_slug is null
      or winner_slug not in (selected_game.away_school_slug, selected_game.home_school_slug) then
      update public.pickem_games
      set result_winner_school_slug = null,
          graded_at = null
      where id = selected_game.id
        and (result_winner_school_slug is not null or graded_at is not null);

      update public.pickem_picks
      set is_correct = null,
          updated_at = now()
      where pickem_game_id = selected_game.id and is_correct is not null;
    else
      update public.pickem_games
      set result_winner_school_slug = winner_slug,
          graded_at = now()
      where id = selected_game.id
        and result_winner_school_slug is distinct from winner_slug;

      update public.pickem_picks
      set is_correct = (picked_school_slug = winner_slug),
          updated_at = now()
      where pickem_game_id = selected_game.id
        and is_correct is distinct from (picked_school_slug = winner_slug);
    end if;
  end loop;
  return new;
end;
$$;

revoke all on function private.grade_pickem_from_verified_final() from public, anon, authenticated;

drop trigger if exists verified_final_grades_pickem on public.game_state;
create trigger verified_final_grades_pickem
after insert or update of status, home_score, away_score, verified, result_type, official_winner_school_slug
on public.game_state
for each row execute function private.grade_pickem_from_verified_final();
