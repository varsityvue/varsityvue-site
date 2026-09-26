-- Cash-contest entries begin with Week 6. Week 5 rows and rankings remain historical.
create table private.pickem_entrant_phones (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone_e164 text not null unique check (phone_e164 ~ '^\+1[2-9][0-9]{2}[2-9][0-9]{6}$'),
  created_at timestamptz not null default now()
);
alter table private.pickem_entrant_phones enable row level security;
revoke all on private.pickem_entrant_phones from public, anon, authenticated;

-- Unfinished work is deliberately separate from scored picks and contest
-- entries. No public view or grade trigger reads this table.
create table private.pickem_draft_picks (
  week_id uuid not null references public.pickem_weeks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  pickem_game_id uuid not null references public.pickem_games(id) on delete cascade,
  picked_school_slug text not null,
  updated_at timestamptz not null default now(),
  primary key (week_id, user_id, pickem_game_id)
);
alter table private.pickem_draft_picks enable row level security;
revoke all on private.pickem_draft_picks from public, anon, authenticated;

create function public.save_pickem_contest_draft(p_week_id uuid, p_selections jsonb)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  entrant uuid := auth.uid();
  selected_week public.pickem_weeks%rowtype;
  first_lock timestamptz;
  game record;
  selected_slug text;
begin
  if entrant is null or not private.is_active_member(entrant) then
    raise exception 'An active account is required';
  end if;
  select * into selected_week from public.pickem_weeks where id = p_week_id for share;
  select min(lock_at) into first_lock from public.pickem_games where week_id = p_week_id;
  if selected_week.id is null or not (selected_week.season > 2026 or (selected_week.season = 2026 and selected_week.week >= 6))
    or selected_week.status <> 'open' or selected_week.tiebreaker_game_id is null
    or selected_week.opens_at is null or now() < selected_week.opens_at
    or selected_week.closes_at is null or now() >= selected_week.closes_at
    or first_lock is null or now() >= first_lock then
    raise exception 'Draft saving is closed';
  end if;
  if p_selections is null or jsonb_typeof(p_selections) <> 'object'
    or (select count(*) from jsonb_object_keys(p_selections)) >
      (select count(*) from public.pickem_games where week_id = p_week_id) then
    raise exception 'Invalid draft';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(entrant::text, 611));
  if exists (select 1 from public.pickem_contest_entries
             where week_id = p_week_id and user_id = entrant) then
    raise exception 'This member already entered the contest';
  end if;
  for game in select * from public.pickem_games where week_id = p_week_id loop
    selected_slug := p_selections ->> game.id::text;
    if selected_slug is null then continue; end if;
    if selected_slug not in (game.away_school_slug, game.home_school_slug) then
      raise exception 'Invalid matchup selection';
    end if;
    insert into private.pickem_draft_picks
      (week_id, user_id, pickem_game_id, picked_school_slug)
    values (p_week_id, entrant, game.id, selected_slug)
    on conflict (week_id, user_id, pickem_game_id) do update
      set picked_school_slug = excluded.picked_school_slug, updated_at = now();
  end loop;
  return (select count(*)::integer from private.pickem_draft_picks
          where week_id = p_week_id and user_id = entrant);
end; $$;
revoke all on function public.save_pickem_contest_draft(uuid,jsonb) from public, anon;
grant execute on function public.save_pickem_contest_draft(uuid,jsonb) to authenticated;

create function public.get_pickem_contest_draft(p_week_id uuid)
returns table (pickem_game_id uuid, picked_school_slug text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_active_member(auth.uid()) then
    raise exception 'An active account is required';
  end if;
  return query select draft.pickem_game_id, draft.picked_school_slug
    from private.pickem_draft_picks draft
    where draft.week_id = p_week_id and draft.user_id = auth.uid();
end; $$;
revoke all on function public.get_pickem_contest_draft(uuid) from public, anon;
grant execute on function public.get_pickem_contest_draft(uuid) to authenticated;

create table public.pickem_contest_entries (
  week_id uuid not null references public.pickem_weeks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz not null default clock_timestamp(),
  entry_order bigint generated always as identity unique,
  status text not null default 'valid' check (status in ('valid', 'disqualified')),
  disqualification_reason text,
  primary key (week_id, user_id)
);
alter table public.pickem_contest_entries enable row level security;
revoke all on public.pickem_contest_entries from public, anon, authenticated;
grant select on public.pickem_contest_entries to authenticated;
create policy "Entrants read own contest status"
on public.pickem_contest_entries for select to authenticated
using (user_id = (select auth.uid()));

create function private.protect_contest_entry_receipt()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.week_id is distinct from old.week_id or new.user_id is distinct from old.user_id
    or new.completed_at is distinct from old.completed_at
    or new.entry_order is distinct from old.entry_order then
    raise exception 'The initial contest receipt cannot change';
  end if;
  return new;
end; $$;
revoke all on function private.protect_contest_entry_receipt() from public, anon, authenticated;
create trigger protect_contest_entry_receipt before update on public.pickem_contest_entries
for each row execute function private.protect_contest_entry_receipt();

create or replace function private.protect_contest_slate()
returns trigger language plpgsql security definer set search_path = '' as $$
declare target_week uuid;
begin
  target_week := case when tg_op = 'DELETE' then old.week_id else new.week_id end;
  if exists (select 1 from public.pickem_contest_entries where week_id = target_week) then
    if tg_op <> 'UPDATE' then
      raise exception 'A contest slate with entries cannot change its matchups';
    end if;
    if new.week_id is distinct from old.week_id
      or new.game_id is distinct from old.game_id
      or new.away_school_slug is distinct from old.away_school_slug
      or new.home_school_slug is distinct from old.home_school_slug then
      raise exception 'A contest slate with entries cannot change its matchups';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end; $$;
revoke all on function private.protect_contest_slate() from public, anon, authenticated;
create trigger protect_contest_slate before insert or update or delete on public.pickem_games
for each row execute function private.protect_contest_slate();

create or replace function private.protect_contest_week()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.pickem_contest_entries where week_id = old.id)
    and (new.tiebreaker_game_id is distinct from old.tiebreaker_game_id
      or new.opens_at is distinct from old.opens_at
      or new.closes_at is distinct from old.closes_at) then
    raise exception 'An entered contest cannot change its rules or deadline';
  end if;
  return new;
end; $$;
revoke all on function private.protect_contest_week() from public, anon, authenticated;
create trigger protect_contest_week before update on public.pickem_weeks
for each row execute function private.protect_contest_week();

-- Do not allow direct Data API writes to bypass the atomic contest checks.
-- The closed Week 5 slate is read-only; grading uses privileged DB functions.
revoke insert, update on public.pickem_picks from authenticated;
revoke insert, update on public.pickem_week_tiebreakers from authenticated;

create or replace function public.submit_pickem_contest_entry(
  p_week_id uuid, p_phone text, p_predicted_total integer, p_selections jsonb
) returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare
  entrant uuid := auth.uid();
  selected_week public.pickem_weeks%rowtype;
  existing_entry public.pickem_contest_entries%rowtype;
  game record;
  normalized text;
  digits text;
  selected_slug text;
  current_slug text;
  first_lock timestamptz;
  game_count integer;
begin
  if entrant is null or not private.is_active_member(entrant) then
    raise exception 'An active account is required';
  end if;
  if exists (select 1 from public.user_roles r where r.user_id = entrant and r.role in ('admin', 'moderator')) then
    raise exception 'Contest operator accounts are ineligible';
  end if;
  select * into selected_week from public.pickem_weeks where id = p_week_id for share;
  if selected_week.id is null or not (selected_week.season > 2026 or (selected_week.season = 2026 and selected_week.week >= 6))
    or selected_week.tiebreaker_game_id is null or selected_week.status <> 'open'
    or selected_week.opens_at is null or now() < selected_week.opens_at
    or selected_week.closes_at is null or now() >= selected_week.closes_at then
    raise exception 'The contest is not open';
  end if;
  select min(lock_at), count(*) into first_lock, game_count
  from public.pickem_games where week_id = p_week_id;
  if game_count < 1 or game_count > 12 or p_selections is null
    or jsonb_typeof(p_selections) <> 'object'
    or (select count(*) from jsonb_object_keys(p_selections)) > game_count then
    raise exception 'Invalid contest slate';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(entrant::text, 611));
  select * into existing_entry from public.pickem_contest_entries
  where week_id = p_week_id and user_id = entrant for update;
  if existing_entry.status = 'disqualified' then
    raise exception 'This entry is ineligible';
  end if;
  if existing_entry.week_id is null and now() >= first_lock then
    raise exception 'New entries closed at the first kickoff';
  end if;

  -- U.S. NANP normalization. This checks format, not mobile ownership or SMS verification.
  if existing_entry.week_id is not null and p_phone is null then
    select phone_e164 into normalized from private.pickem_entrant_phones
    where user_id = entrant;
    if normalized is null then raise exception 'Contest phone number is missing'; end if;
    digits := substr(normalized, 3);
  else
    digits := regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g');
  end if;
  if length(digits) = 11 and left(digits, 1) = '1' then digits := substr(digits, 2); end if;
  if digits !~ '^[2-9][0-9]{2}[2-9][0-9]{6}$' then
    raise exception 'Enter a valid U.S. mobile number';
  end if;
  normalized := '+1' || digits;
  if exists (select 1 from private.pickem_entrant_phones
             where user_id = entrant and phone_e164 <> normalized) then
    raise exception 'This account already has a different contest number; contact support';
  end if;
  if exists (select 1 from private.pickem_entrant_phones
             where phone_e164 = normalized and user_id <> entrant) then
    raise exception 'This number is already used for another entrant';
  end if;

  if p_predicted_total is null or p_predicted_total not between 0 and 300 then
    raise exception 'Enter a Game of the Week combined-points prediction';
  end if;
  if not exists (select 1 from public.pickem_games
                 where id = selected_week.tiebreaker_game_id and week_id = p_week_id) then
    raise exception 'The Game of the Week is not configured';
  end if;
  if now() >= (select lock_at from public.pickem_games where id = selected_week.tiebreaker_game_id)
    and (existing_entry.week_id is null or p_predicted_total is distinct from
      (select predicted_total from public.pickem_week_tiebreakers
       where week_id = p_week_id and user_id = entrant)) then
    raise exception 'The Game of the Week prediction is locked';
  end if;

  -- Unique constraints also protect the phone and one-entry-per-week invariant.
  for game in select * from public.pickem_games where week_id = p_week_id order by id loop
    selected_slug := p_selections ->> game.id::text;
    select picked_school_slug into current_slug from public.pickem_picks
      where pickem_game_id = game.id and user_id = entrant;
    if selected_slug is null then
      if existing_entry.week_id is null or current_slug is null then
        raise exception 'Select every game before entering';
      end if;
      continue;
    end if;
    if selected_slug not in (game.away_school_slug, game.home_school_slug) then
      raise exception 'Invalid matchup selection';
    end if;
    if now() >= game.lock_at then
      if selected_slug is distinct from current_slug then raise exception 'A game is locked'; end if;
    elsif selected_slug is distinct from current_slug then
      insert into public.pickem_picks (pickem_game_id, user_id, picked_school_slug)
      values (game.id, entrant, selected_slug)
      on conflict (pickem_game_id, user_id) do update
        set picked_school_slug = excluded.picked_school_slug;
    end if;
  end loop;
  if (select count(*) from public.pickem_picks p
      join public.pickem_games g on g.id = p.pickem_game_id
      where g.week_id = p_week_id and p.user_id = entrant) <> game_count then
    raise exception 'Select every game before entering';
  end if;

  insert into private.pickem_entrant_phones (user_id, phone_e164)
  values (entrant, normalized) on conflict (user_id) do nothing;
  if existing_entry.week_id is null then
    insert into public.pickem_week_tiebreakers (week_id, user_id, predicted_total)
    values (p_week_id, entrant, p_predicted_total);
    insert into public.pickem_contest_entries (week_id, user_id)
    values (p_week_id, entrant);
    delete from private.pickem_draft_picks
    where week_id = p_week_id and user_id = entrant;
  elsif p_predicted_total is distinct from
    (select predicted_total from public.pickem_week_tiebreakers
     where week_id = p_week_id and user_id = entrant) then
    update public.pickem_week_tiebreakers set predicted_total = p_predicted_total
    where week_id = p_week_id and user_id = entrant;
  end if;
  return (select completed_at from public.pickem_contest_entries
          where week_id = p_week_id and user_id = entrant);
exception when unique_violation then
  raise exception 'This number is already used for another entrant';
end;
$$;
revoke all on function public.submit_pickem_contest_entry(uuid,text,integer,jsonb) from public, anon;
grant execute on function public.submit_pickem_contest_entry(uuid,text,integer,jsonb) to authenticated;

create or replace view public.pickem_week_standings as
with totals as (
  select week.id as week_id, week.season, week.week, pick.user_id,
    count(*) filter (where pick.is_correct is not null)::integer as graded_picks,
    count(*) filter (where pick.is_correct = true)::integer as correct_picks,
    prediction.predicted_total,
    case when state.verified and state.status = 'final'
      and state.result_type in ('played', 'tie')
      and state.home_score is not null and state.away_score is not null
      then state.home_score + state.away_score end as actual_total,
    entry.completed_at, entry.entry_order, entry.status as entry_status
  from public.pickem_weeks week
  join public.pickem_games game on game.week_id = week.id
  join public.pickem_picks pick on pick.pickem_game_id = game.id
  left join public.pickem_contest_entries entry
    on entry.week_id = week.id and entry.user_id = pick.user_id
  left join public.pickem_week_tiebreakers prediction
    on prediction.week_id = week.id and prediction.user_id = pick.user_id
  left join public.pickem_games featured on featured.id = week.tiebreaker_game_id
  left join public.game_state state on state.game_id = featured.game_id
  where week.closes_at is not null and now() >= week.closes_at
    and ((week.season = 2026 and week.week < 6) or entry.status = 'valid')
  group by week.id, pick.user_id, prediction.predicted_total, state.verified,
    state.status, state.result_type, state.home_score, state.away_score,
    entry.completed_at, entry.entry_order, entry.status
), ranked as (
  select totals.*, case when actual_total is not null and predicted_total is not null
    then abs(actual_total - predicted_total) end as distance
  from totals
)
select ranked.week_id, ranked.season, ranked.week, ranked.user_id,
  ranked.graded_picks, ranked.correct_picks, ranked.predicted_total,
  ranked.actual_total, ranked.distance, profiles.display_name, profiles.username,
  rank() over (partition by ranked.week_id order by ranked.correct_picks desc,
    ranked.distance asc nulls last,
    case when ranked.season > 2026 or (ranked.season = 2026 and ranked.week >= 6) then ranked.completed_at end asc nulls last,
    case when ranked.season > 2026 or (ranked.season = 2026 and ranked.week >= 6) then ranked.entry_order end asc nulls last,
    case when ranked.season > 2026 or (ranked.season = 2026 and ranked.week >= 6) then ranked.user_id end asc nulls last) as weekly_rank
from ranked join public.profiles profiles on profiles.id = ranked.user_id;

create view public.pickem_contest_prize as
select week.id as week_id, count(entry.user_id)::integer as valid_entries,
  least(count(entry.user_id), 100)::integer as prize_dollars
from public.pickem_weeks week
left join public.pickem_contest_entries entry
  on entry.week_id = week.id and entry.status = 'valid'
where week.season > 2026 or (week.season = 2026 and week.week >= 6)
group by week.id;
grant select on public.pickem_contest_prize to anon, authenticated;

-- A single operational contact, visible only to an active administrator after
-- every included game has a verified terminal outcome and the week has closed.
create function public.admin_pickem_provisional_winner_contact(p_week_id uuid)
returns table (user_id uuid, phone_e164 text)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_active_member(auth.uid())
    or not private.has_role('admin'::public.user_role) then
    raise exception using errcode = '42501', message = 'Administrator access required';
  end if;
  if not exists (select 1 from public.pickem_weeks
                 where id = p_week_id and closes_at <= now())
    or exists (
      select 1 from public.pickem_games game
      left join public.game_state state on state.game_id = game.game_id
      where game.week_id = p_week_id
        and (state.verified is distinct from true
          or state.status not in ('final', 'cancelled'))
    ) then
    return;
  end if;
  return query
    select standings.user_id, phones.phone_e164
    from public.pickem_week_standings standings
    join private.pickem_entrant_phones phones on phones.user_id = standings.user_id
    where standings.week_id = p_week_id and standings.weekly_rank = 1
    limit 1;
end; $$;
revoke all on function public.admin_pickem_provisional_winner_contact(uuid) from public, anon;
grant execute on function public.admin_pickem_provisional_winner_contact(uuid) to authenticated;
