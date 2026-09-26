-- Cash-contest entries begin with Week 6. Week 5 rows and rankings remain historical.
alter table public.pickem_weeks
  add column entry_deadline_at timestamptz,
  add column outcome_resolution_at timestamptz,
  add column official_rules_version text,
  add column official_rules_published_at timestamptz;

-- The deadline is snapshotted when a fully configured draft week opens.
-- The local Tuesday midnight boundary is exclusive: this represents the end
-- of Monday 11:59 p.m. in America/Chicago, including DST transitions.
create function private.freeze_pickem_contest_deadlines()
returns trigger language plpgsql security definer set search_path = '' as $$
declare first_kickoff timestamptz; games integer;
begin
  if not (new.season > 2026 or (new.season = 2026 and new.week >= 6)) then return new; end if;
  if tg_op = 'INSERT' then
    if new.status = 'open' then raise exception 'Configure the contest as a draft before opening'; end if;
    return new;
  end if;
  if old.entry_deadline_at is not null then
    if new.entry_deadline_at is distinct from old.entry_deadline_at
      or new.outcome_resolution_at is distinct from old.outcome_resolution_at
      or new.official_rules_version is distinct from old.official_rules_version
      or new.official_rules_published_at is distinct from old.official_rules_published_at
      or new.status = 'draft' then
      raise exception 'An opened contest has immutable deadlines';
    end if;
  elsif new.status = 'open' and old.status <> 'open' then
    select min(lock_at), count(*) into first_kickoff, games
    from public.pickem_games where week_id = new.id;
    if games not between 1 and 12 or first_kickoff <= clock_timestamp()
      or new.tiebreaker_game_id is null
      or nullif(btrim(new.official_rules_version),'') is null
      or new.official_rules_published_at is null
      or new.official_rules_published_at > clock_timestamp()
      or not exists (select 1 from public.pickem_games where id = new.tiebreaker_game_id and week_id = new.id)
      or new.opens_at is null or new.closes_at is null or new.closes_at <= first_kickoff then
      raise exception 'Configure games, featured game, approved published rules, and closing time before opening';
    end if;
    new.entry_deadline_at := first_kickoff;
    new.outcome_resolution_at :=
      (date_trunc('week', first_kickoff at time zone 'America/Chicago') + interval '8 days')
      at time zone 'America/Chicago';
  end if;
  return new;
end; $$;
revoke all on function private.freeze_pickem_contest_deadlines() from public, anon, authenticated;
create trigger freeze_pickem_contest_deadlines before insert or update on public.pickem_weeks
for each row execute function private.freeze_pickem_contest_deadlines();

create table private.pickem_contest_game_resolution (
  pickem_game_id uuid primary key references public.pickem_games(id) on delete cascade,
  disposition text not null check (disposition in ('resolved', 'void')),
  reason text not null,
  decided_at timestamptz not null default clock_timestamp()
);
alter table private.pickem_contest_game_resolution enable row level security;
revoke all on private.pickem_contest_game_resolution from public, anon, authenticated;

create view public.pickem_contest_void_games as
select resolution.pickem_game_id, game.week_id, resolution.reason
from private.pickem_contest_game_resolution resolution
join public.pickem_games game on game.id = resolution.pickem_game_id
where resolution.disposition = 'void';
grant select on public.pickem_contest_void_games to anon, authenticated;

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

create table private.pickem_draft_predictions (
  week_id uuid not null references public.pickem_weeks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  predicted_total integer not null check (predicted_total between 0 and 300),
  updated_at timestamptz not null default now(),
  primary key (week_id, user_id)
);
alter table private.pickem_draft_predictions enable row level security;
revoke all on private.pickem_draft_predictions from public, anon, authenticated;

create function public.save_pickem_contest_draft(p_week_id uuid, p_selections jsonb, p_predicted_total integer)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  entrant uuid := auth.uid();
  selected_week public.pickem_weeks%rowtype;
  game record;
  selected_slug text;
begin
  if entrant is null or not private.is_active_member(entrant) then
    raise exception 'An active account is required';
  end if;
  select * into selected_week from public.pickem_weeks where id = p_week_id for share;
  if selected_week.id is null or not (selected_week.season > 2026 or (selected_week.season = 2026 and selected_week.week >= 6))
    or selected_week.status <> 'open' or selected_week.tiebreaker_game_id is null
    or selected_week.opens_at is null or now() < selected_week.opens_at
    or selected_week.closes_at is null or now() >= selected_week.closes_at
    or selected_week.entry_deadline_at is null
    or clock_timestamp() >= selected_week.entry_deadline_at then
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
  if p_predicted_total is not null then
    if p_predicted_total not between 0 and 300 then raise exception 'Invalid draft prediction'; end if;
    if exists (select 1 from private.pickem_contest_game_resolution
      where pickem_game_id=selected_week.tiebreaker_game_id and disposition='void')
      or clock_timestamp() >= (select lock_at from public.pickem_games
        where id=selected_week.tiebreaker_game_id) then
      raise exception 'The Game of the Week prediction is locked';
    end if;
    insert into private.pickem_draft_predictions (week_id,user_id,predicted_total)
    values (p_week_id,entrant,p_predicted_total)
    on conflict (week_id,user_id) do update
      set predicted_total=excluded.predicted_total,updated_at=now();
  else
    delete from private.pickem_draft_predictions where week_id=p_week_id and user_id=entrant;
  end if;
  for game in select g.* from public.pickem_games g where g.week_id = p_week_id
    and not exists (select 1 from private.pickem_contest_game_resolution r
      where r.pickem_game_id=g.id and r.disposition='void') loop
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
revoke all on function public.save_pickem_contest_draft(uuid,jsonb,integer) from public, anon;
grant execute on function public.save_pickem_contest_draft(uuid,jsonb,integer) to authenticated;

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

create function public.get_pickem_contest_draft_prediction(p_week_id uuid)
returns integer language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_active_member(auth.uid()) then
    raise exception 'An active account is required';
  end if;
  return (select draft.predicted_total from private.pickem_draft_predictions draft
    where draft.week_id=p_week_id and draft.user_id=auth.uid());
end; $$;
revoke all on function public.get_pickem_contest_draft_prediction(uuid) from public, anon;
grant execute on function public.get_pickem_contest_draft_prediction(uuid) to authenticated;

create table public.pickem_contest_entries (
  week_id uuid not null references public.pickem_weeks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  completed_at timestamptz not null default clock_timestamp(),
  attested_at timestamptz not null default clock_timestamp(),
  attestation_text text not null check (attestation_text =
    'I confirm that I am 18 or older, a Texas resident, and agree to the Official Rules.'),
  attestation_rules_version text not null check (btrim(attestation_rules_version) <> ''),
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
    or new.attested_at is distinct from old.attested_at
    or new.attestation_text is distinct from old.attestation_text
    or new.attestation_rules_version is distinct from old.attestation_rules_version
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
  if tg_op = 'UPDATE' and new.lock_at is distinct from old.lock_at
    and exists (select 1 from public.pickem_weeks w
      where w.id = old.week_id and w.entry_deadline_at is not null
        and new.lock_at < w.entry_deadline_at)
    and not exists (select 1 from private.pickem_contest_game_resolution r
      where r.pickem_game_id = old.id and r.disposition = 'void') then
    raise exception 'Void this contest matchup before moving its kickoff ahead of the frozen entry deadline';
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

-- An administrator must explicitly void an included matchup before a
-- schedule revision can bring its kickoff ahead of the frozen entry cutoff.
create function public.admin_void_pickem_contest_game(p_game_id uuid, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare chosen public.pickem_games%rowtype;
begin
  if auth.uid() is null or not private.has_role('admin'::public.user_role) then
    raise exception using errcode='42501', message='Administrator access required';
  end if;
  if nullif(btrim(p_reason),'') is null then raise exception 'A void reason is required'; end if;
  select * into chosen from public.pickem_games where id=p_game_id for update;
  if chosen.id is null or not exists (select 1 from public.pickem_weeks w
       where w.id=chosen.week_id and w.entry_deadline_at is not null) then
    raise exception 'An opened cash-contest game is required';
  end if;
  if exists (select 1 from private.pickem_contest_game_resolution where pickem_game_id=p_game_id) then
    raise exception 'This contest matchup is already resolved';
  end if;
  insert into private.pickem_contest_game_resolution (pickem_game_id,disposition,reason)
  values (p_game_id,'void',btrim(p_reason));
  update public.pickem_games set result_winner_school_slug=null,graded_at=null where id=p_game_id;
  update public.pickem_picks set is_correct=null where pickem_game_id=p_game_id and is_correct is not null;
end; $$;
revoke all on function public.admin_void_pickem_contest_game(uuid,text) from public, anon;
grant execute on function public.admin_void_pickem_contest_game(uuid,text) to authenticated;

-- Called after the Monday window closes. The first qualifying verified
-- terminal result was already stamped by the canonical grading trigger.
create function public.admin_resolve_pickem_contest_week(p_week_id uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare chosen public.pickem_weeks%rowtype; changed integer;
begin
  if auth.uid() is null or not private.has_role('admin'::public.user_role) then
    raise exception using errcode='42501', message='Administrator access required';
  end if;
  select * into chosen from public.pickem_weeks where id=p_week_id for update;
  if chosen.outcome_resolution_at is null or clock_timestamp() < chosen.outcome_resolution_at then
    raise exception 'The Monday outcome window remains open';
  end if;
  with inserted as (
    insert into private.pickem_contest_game_resolution (pickem_game_id,disposition,reason)
    select g.id,'void','No verified outcome by Monday 11:59 p.m. America/Chicago'
    from public.pickem_games g
    where g.week_id=p_week_id and not exists
      (select 1 from private.pickem_contest_game_resolution r where r.pickem_game_id=g.id)
    on conflict do nothing returning pickem_game_id
  ) select count(*) into changed from inserted;
  update public.pickem_games g set result_winner_school_slug=null,graded_at=null
  where g.week_id=p_week_id and exists (select 1 from private.pickem_contest_game_resolution r
    where r.pickem_game_id=g.id and r.disposition='void')
    and (g.result_winner_school_slug is not null or g.graded_at is not null);
  update public.pickem_picks p set is_correct=null
  from public.pickem_games g join private.pickem_contest_game_resolution r
    on r.pickem_game_id=g.id and r.disposition='void'
  where p.pickem_game_id=g.id and g.week_id=p_week_id and p.is_correct is not null;
  return changed;
end; $$;
revoke all on function public.admin_resolve_pickem_contest_week(uuid) from public, anon;
grant execute on function public.admin_resolve_pickem_contest_week(uuid) to authenticated;

-- Canonical results stay authoritative. The contest resolution decides only
-- whether that week's picks may receive a grade; later play cannot revive a
-- matchup voided at the Monday cutoff. A timely final remains correctable.
create or replace function private.grade_pickem_from_verified_final()
returns trigger language plpgsql security definer set search_path = '' as $$
declare selected_game record; winner_slug text; resolution text;
begin
  for selected_game in
    select g.id,g.away_school_slug,g.home_school_slug,w.outcome_resolution_at
    from public.pickem_games g join public.pickem_weeks w on w.id=g.week_id
    where g.game_id=new.game_id order by g.id
  loop
    resolution := null;
    if selected_game.outcome_resolution_at is not null then
      select disposition into resolution from private.pickem_contest_game_resolution
      where pickem_game_id=selected_game.id;
      if resolution is null then
        if new.verified is true and new.status = 'final'
          and new.result_type in ('played','forfeit')
          and clock_timestamp() < selected_game.outcome_resolution_at then
          insert into private.pickem_contest_game_resolution (pickem_game_id,disposition,reason)
          values (selected_game.id,'resolved','Verified winner before Monday cutoff')
          on conflict do nothing;
        elsif new.verified is true and
          (new.status = 'cancelled' or (new.status = 'final' and new.result_type in ('tie','no_contest')))
          and clock_timestamp() < selected_game.outcome_resolution_at then
          insert into private.pickem_contest_game_resolution (pickem_game_id,disposition,reason)
          values (selected_game.id,'void','Verified non-scoring outcome before Monday cutoff')
          on conflict do nothing;
        elsif clock_timestamp() >= selected_game.outcome_resolution_at then
          insert into private.pickem_contest_game_resolution (pickem_game_id,disposition,reason)
          values (selected_game.id,'void','No verified outcome by Monday 11:59 p.m. America/Chicago')
          on conflict do nothing;
        end if;
        select disposition into resolution from private.pickem_contest_game_resolution
        where pickem_game_id=selected_game.id;
      end if;
    end if;
    winner_slug := null;
    if resolution is distinct from 'void' and new.verified is true and new.status='final' then
      if new.result_type='played' then
        winner_slug := case when new.away_score>new.home_score
          then selected_game.away_school_slug else selected_game.home_school_slug end;
      elsif new.result_type='forfeit' then
        winner_slug := new.official_winner_school_slug;
      end if;
    end if;
    if winner_slug is null or winner_slug not in (selected_game.away_school_slug,selected_game.home_school_slug) then
      update public.pickem_games set result_winner_school_slug=null,graded_at=null
      where id=selected_game.id and (result_winner_school_slug is not null or graded_at is not null);
      update public.pickem_picks set is_correct=null,updated_at=now()
      where pickem_game_id=selected_game.id and is_correct is not null;
    else
      update public.pickem_games set result_winner_school_slug=winner_slug,graded_at=now()
      where id=selected_game.id and result_winner_school_slug is distinct from winner_slug;
      update public.pickem_picks set is_correct=(picked_school_slug=winner_slug),updated_at=now()
      where pickem_game_id=selected_game.id
        and is_correct is distinct from (picked_school_slug=winner_slug);
    end if;
  end loop;
  return new;
end; $$;
revoke all on function private.grade_pickem_from_verified_final() from public, anon, authenticated;

-- Do not allow direct Data API writes to bypass the atomic contest checks.
-- The closed Week 5 slate is read-only; grading uses privileged DB functions.
revoke insert, update on public.pickem_picks from authenticated;
revoke insert, update on public.pickem_week_tiebreakers from authenticated;

create or replace function public.submit_pickem_contest_entry(
  p_week_id uuid, p_phone text, p_predicted_total integer, p_selections jsonb,
  p_eligibility_attested boolean
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
  game_count integer;
  required_count integer;
  gotw_void boolean;
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
  select count(*) into game_count
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
  if existing_entry.week_id is null and p_eligibility_attested is distinct from true then
    raise exception 'Eligibility and Official Rules attestation is required';
  end if;
  if selected_week.entry_deadline_at is null then
    raise exception 'The entry deadline is not configured';
  end if;
  if existing_entry.week_id is null and clock_timestamp() >= selected_week.entry_deadline_at then
    raise exception 'New entries closed at the frozen first-kickoff deadline';
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

  if not exists (select 1 from public.pickem_games
                 where id = selected_week.tiebreaker_game_id and week_id = p_week_id) then
    raise exception 'The Game of the Week is not configured';
  end if;
  select exists (select 1 from private.pickem_contest_game_resolution
    where pickem_game_id=selected_week.tiebreaker_game_id and disposition='void') into gotw_void;
  if not gotw_void and (p_predicted_total is null or p_predicted_total not between 0 and 300) then
    raise exception 'Enter a Game of the Week combined-points prediction';
  end if;
  if not gotw_void and clock_timestamp() >=
    (select lock_at from public.pickem_games where id = selected_week.tiebreaker_game_id)
    and (existing_entry.week_id is null or p_predicted_total is distinct from
      (select predicted_total from public.pickem_week_tiebreakers
       where week_id = p_week_id and user_id = entrant)) then
    raise exception 'The Game of the Week prediction is locked';
  end if;

  -- Unique constraints also protect the phone and one-entry-per-week invariant.
  for game in select g.* from public.pickem_games g where g.week_id = p_week_id
    and not exists (select 1 from private.pickem_contest_game_resolution r
      where r.pickem_game_id=g.id and r.disposition='void') order by g.id loop
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
    if clock_timestamp() >= game.lock_at then
      if selected_slug is distinct from current_slug then raise exception 'A game is locked'; end if;
    elsif selected_slug is distinct from current_slug then
      insert into public.pickem_picks (pickem_game_id, user_id, picked_school_slug)
      values (game.id, entrant, selected_slug)
      on conflict (pickem_game_id, user_id) do update
        set picked_school_slug = excluded.picked_school_slug;
    end if;
  end loop;
  select count(*) into required_count from public.pickem_games g
    where g.week_id=p_week_id and not exists
      (select 1 from private.pickem_contest_game_resolution r
       where r.pickem_game_id=g.id and r.disposition='void');
  if required_count < 1 then raise exception 'No pickable matchups remain'; end if;
  if (select count(*) from public.pickem_picks p
      join public.pickem_games g on g.id = p.pickem_game_id
      where g.week_id = p_week_id and p.user_id = entrant
        and not exists (select 1 from private.pickem_contest_game_resolution r
          where r.pickem_game_id=g.id and r.disposition='void')) <> required_count then
    raise exception 'Select every game before entering';
  end if;

  insert into private.pickem_entrant_phones (user_id, phone_e164)
  values (entrant, normalized) on conflict (user_id) do nothing;
  if existing_entry.week_id is null then
    if not gotw_void then
      insert into public.pickem_week_tiebreakers (week_id, user_id, predicted_total)
      values (p_week_id, entrant, p_predicted_total);
    end if;
    insert into public.pickem_contest_entries (week_id, user_id, attestation_text, attestation_rules_version)
    values (p_week_id, entrant,
      'I confirm that I am 18 or older, a Texas resident, and agree to the Official Rules.',
      selected_week.official_rules_version);
    delete from private.pickem_draft_picks
    where week_id = p_week_id and user_id = entrant;
    delete from private.pickem_draft_predictions
    where week_id = p_week_id and user_id = entrant;
  elsif not gotw_void and p_predicted_total is distinct from
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
revoke all on function public.submit_pickem_contest_entry(uuid,text,integer,jsonb,boolean) from public, anon;
grant execute on function public.submit_pickem_contest_entry(uuid,text,integer,jsonb,boolean) to authenticated;

create or replace view public.pickem_week_standings as
with totals as (
  select week.id as week_id, week.season, week.week, pick.user_id,
    count(*) filter (where pick.is_correct is not null)::integer as graded_picks,
    count(*) filter (where pick.is_correct = true)::integer as correct_picks,
    prediction.predicted_total,
    case when (week.outcome_resolution_at is null or featured_resolution.disposition='resolved')
      and state.verified and state.status = 'final'
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
  left join private.pickem_contest_game_resolution featured_resolution
    on featured_resolution.pickem_game_id = featured.id
  left join public.game_state state on state.game_id = featured.game_id
  where week.closes_at is not null and now() >= week.closes_at
    and ((week.season = 2026 and week.week < 6) or entry.status = 'valid')
  group by week.id, pick.user_id, prediction.predicted_total, week.outcome_resolution_at,
    featured_resolution.disposition, state.verified,
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
        and not exists (select 1 from private.pickem_contest_game_resolution resolution
          where resolution.pickem_game_id=game.id and resolution.disposition='void')
        and (state.verified is distinct from true
          or state.status not in ('final', 'cancelled'))
    ) or exists (
      select 1 from public.pickem_games game
      where game.week_id=p_week_id
        and not exists (select 1 from private.pickem_contest_game_resolution resolution
          where resolution.pickem_game_id=game.id)
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

-- The administrator records an actual notification after sending it. No SMS
-- or email is sent by these functions. A second call cannot restart 72 hours.
create table private.pickem_winner_claims (
  week_id uuid not null references public.pickem_weeks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  notified_at timestamptz,
  respond_by timestamptz,
  responded_at timestamptz,
  decision text not null default 'pending' check
    (decision in ('pending','confirmed','ineligible','cannot_contact','no_response')),
  decision_at timestamptz,
  reason text,
  actor_id uuid not null references public.profiles(id),
  primary key (week_id,user_id),
  check ((notified_at is null and respond_by is null) or
    (notified_at is not null and respond_by=notified_at+interval '72 hours'))
);
alter table private.pickem_winner_claims enable row level security;
revoke all on private.pickem_winner_claims from public, anon, authenticated;

create function public.admin_record_pickem_winner_notice(p_week_id uuid)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare candidate uuid; deadline timestamptz; sent_at timestamptz;
begin
  if auth.uid() is null or not private.is_active_member(auth.uid())
    or not private.has_role('admin'::public.user_role) then
    raise exception using errcode='42501', message='Administrator access required';
  end if;
  select contact.user_id into candidate from public.admin_pickem_provisional_winner_contact(p_week_id) contact;
  if candidate is null then raise exception 'No resolved provisional winner is available'; end if;
  if exists (select 1 from private.pickem_winner_claims
             where week_id=p_week_id and user_id=candidate) then
    raise exception 'This candidate already has a recorded claim action';
  end if;
  sent_at := clock_timestamp();
  insert into private.pickem_winner_claims (week_id,user_id,notified_at,respond_by,actor_id)
  values (p_week_id,candidate,sent_at,sent_at+interval '72 hours',auth.uid())
  returning respond_by into deadline;
  return deadline;
end; $$;
revoke all on function public.admin_record_pickem_winner_notice(uuid) from public, anon;
grant execute on function public.admin_record_pickem_winner_notice(uuid) to authenticated;

create function public.admin_record_pickem_winner_response(p_week_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare candidate uuid;
begin
  if auth.uid() is null or not private.is_active_member(auth.uid())
    or not private.has_role('admin'::public.user_role) then
    raise exception using errcode='42501', message='Administrator access required';
  end if;
  select contact.user_id into candidate from public.admin_pickem_provisional_winner_contact(p_week_id) contact;
  update private.pickem_winner_claims set responded_at=clock_timestamp(),actor_id=auth.uid()
  where week_id=p_week_id and user_id=candidate and decision='pending'
    and responded_at is null and clock_timestamp()<respond_by;
  if not found then raise exception 'No pending candidate can respond within 72 hours'; end if;
end; $$;
revoke all on function public.admin_record_pickem_winner_response(uuid) from public, anon;
grant execute on function public.admin_record_pickem_winner_response(uuid) to authenticated;

create function public.admin_decide_pickem_winner_claim(p_week_id uuid, p_decision text, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare candidate uuid; claim private.pickem_winner_claims%rowtype;
begin
  if auth.uid() is null or not private.is_active_member(auth.uid())
    or not private.has_role('admin'::public.user_role) then
    raise exception using errcode='42501', message='Administrator access required';
  end if;
  if p_decision not in ('confirmed','ineligible','cannot_contact','no_response')
    or nullif(btrim(p_reason),'') is null then raise exception 'A decision and reason are required'; end if;
  select contact.user_id into candidate from public.admin_pickem_provisional_winner_contact(p_week_id) contact;
  if candidate is null then raise exception 'No resolved provisional winner is available'; end if;
  select * into claim from private.pickem_winner_claims
    where week_id=p_week_id and user_id=candidate for update;
  if claim.week_id is null then
    if p_decision not in ('ineligible','cannot_contact') then
      raise exception 'Record notification before deciding this claim'; end if;
    insert into private.pickem_winner_claims (week_id,user_id,actor_id)
    values (p_week_id,candidate,auth.uid());
  elsif claim.decision <> 'pending' then
    raise exception 'This candidate already has a final claim decision';
  end if;
  if p_decision='no_response' and (claim.respond_by is null
    or clock_timestamp()<claim.respond_by or claim.responded_at is not null) then
    raise exception 'The 72-hour response period has not expired without a response'; end if;
  if p_decision='confirmed' and (claim.responded_at is null
    or claim.responded_at>=claim.respond_by) then
    raise exception 'A timely response and eligibility review are required'; end if;
  update private.pickem_winner_claims set decision=p_decision,decision_at=clock_timestamp(),
    reason=btrim(p_reason),actor_id=auth.uid()
  where week_id=p_week_id and user_id=candidate;
  if p_decision<>'confirmed' then
    update public.pickem_contest_entries set status='disqualified',
      disqualification_reason=p_decision||': '||btrim(p_reason)
    where week_id=p_week_id and user_id=candidate and status='valid';
  end if;
end; $$;
revoke all on function public.admin_decide_pickem_winner_claim(uuid,text,text) from public, anon;
grant execute on function public.admin_decide_pickem_winner_claim(uuid,text,text) to authenticated;

create function public.admin_pickem_winner_claim_status(p_week_id uuid)
returns table (user_id uuid, notified_at timestamptz, respond_by timestamptz,
  responded_at timestamptz, decision text, decision_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_active_member(auth.uid())
    or not private.has_role('admin'::public.user_role) then
    raise exception using errcode='42501', message='Administrator access required';
  end if;
  return query select claim.user_id,claim.notified_at,claim.respond_by,
    claim.responded_at,claim.decision,claim.decision_at
    from private.pickem_winner_claims claim where claim.week_id=p_week_id
    order by claim.decision_at nulls first,claim.notified_at nulls first;
end; $$;
revoke all on function public.admin_pickem_winner_claim_status(uuid) from public, anon;
grant execute on function public.admin_pickem_winner_claim_status(uuid) to authenticated;
