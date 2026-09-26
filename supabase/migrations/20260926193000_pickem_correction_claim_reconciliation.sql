-- Integration gate: preserve every finalization and claim generation when an
-- authorized canonical score correction changes the payable leader.
alter table private.pickem_contest_finalizations
  add column generation integer not null default 1,
  add column state text not null default 'current'
    check (state in ('current','superseded','post_payment_review')),
  add column winner_user_id uuid references public.profiles(id),
  add column correction_audit_id bigint references private.game_score_correction_audit(id);

create table private.pickem_contest_finalization_history (
  week_id uuid not null references public.pickem_weeks(id),
  generation integer not null,
  finalized_at timestamptz not null,
  winner_user_id uuid references public.profiles(id),
  actor_id uuid not null references public.profiles(id),
  superseded_at timestamptz,
  correction_audit_id bigint references private.game_score_correction_audit(id),
  previous_rank integer,
  corrected_winner_user_id uuid references public.profiles(id),
  reason text,
  primary key (week_id,generation)
);
alter table private.pickem_contest_finalization_history enable row level security;
revoke all on private.pickem_contest_finalization_history from public,anon,authenticated;

alter table private.pickem_winner_claims drop constraint pickem_winner_claims_pkey;
alter table private.pickem_winner_claims
  add column generation integer not null default 1,
  add column previous_rank integer,
  add column superseded_at timestamptz,
  add column correction_audit_id bigint references private.game_score_correction_audit(id),
  add column payment_recorded_at timestamptz;
alter table private.pickem_winner_claims
  add constraint pickem_winner_claims_pkey primary key (week_id,user_id,generation);
alter table private.pickem_winner_claims drop constraint pickem_winner_claims_decision_check;
alter table private.pickem_winner_claims add constraint pickem_winner_claims_decision_check
  check (decision in ('pending','confirmed','ineligible','cannot_contact','no_response','superseded','paid'));

create or replace function public.admin_finalize_pickem_contest_results(p_week_id uuid)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare finalized timestamptz; candidate uuid; old private.pickem_contest_finalizations%rowtype;
begin
  if auth.uid() is null or not private.is_active_member(auth.uid())
    or not private.has_role('admin'::public.user_role) then
    raise exception using errcode='42501', message='Administrator access required';
  end if;
  if not exists (select 1 from public.pickem_weeks where id=p_week_id
    and (season>2026 or (season=2026 and week>=6)) and status='open'
    and closes_at<=clock_timestamp())
    or not exists (select 1 from public.pickem_week_standings where week_id=p_week_id)
    or exists (select 1 from public.pickem_games game
      left join private.pickem_contest_game_resolution resolution on resolution.pickem_game_id=game.id
      left join public.game_state state on state.game_id=game.game_id
      where game.week_id=p_week_id and (clock_timestamp()<game.lock_at
        or resolution.disposition is null
        or (resolution.disposition<>'void' and
          (state.verified is distinct from true or state.status not in ('final','cancelled'))))) then
    raise exception 'Resolve and lock all games before finalizing results';
  end if;
  select user_id into candidate from public.pickem_week_standings
    where week_id=p_week_id order by weekly_rank limit 1;
  if candidate is null then raise exception 'No valid contest entrant'; end if;
  select * into old from private.pickem_contest_finalizations where week_id=p_week_id for update;
  if found then
    if old.state='post_payment_review' then raise exception 'Paid contest requires exceptional administrator review'; end if;
    if old.state='current' then return old.finalized_at; end if;
    if old.winner_user_id is not distinct from candidate then
      raise exception 'Corrected standings have not changed the payable leader'; end if;
    update private.pickem_contest_finalizations
      set generation=old.generation+1,state='current',winner_user_id=candidate,
          finalized_at=clock_timestamp(),actor_id=auth.uid(),correction_audit_id=old.correction_audit_id
      where week_id=p_week_id returning finalized_at into finalized;
    insert into private.pickem_contest_finalization_history
      (week_id,generation,finalized_at,winner_user_id,actor_id)
      values (p_week_id,old.generation+1,finalized,candidate,auth.uid());
  else
    insert into private.pickem_contest_finalizations(week_id,actor_id,winner_user_id)
      values (p_week_id,auth.uid(),candidate) returning finalized_at into finalized;
    insert into private.pickem_contest_finalization_history
      (week_id,generation,finalized_at,winner_user_id,actor_id)
      values (p_week_id,1,finalized,candidate,auth.uid());
  end if;
  return finalized;
end; $$;

-- Keep the existing RPC's return shape for the deployed administrator page.
create or replace function public.admin_pickem_provisional_winner_contact(p_week_id uuid)
returns table (user_id uuid, phone_e164 text)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_active_member(auth.uid())
    or not private.has_role('admin'::public.user_role) then
    raise exception using errcode='42501', message='Administrator access required';
  end if;
  if not exists (select 1 from private.pickem_contest_finalizations f
    where f.week_id=p_week_id and f.state='current'
      and clock_timestamp()<f.finalized_at+interval '30 days') then return; end if;
  return query select s.user_id,p.phone_e164 from public.pickem_week_standings s
    join private.pickem_contest_finalizations f on f.week_id=s.week_id and f.winner_user_id=s.user_id
    join private.pickem_entrant_phones p on p.user_id=s.user_id
    where s.week_id=p_week_id and s.weekly_rank=1 limit 1;
end; $$;

-- Preserve the PR #4 implementation intact in a private base function. This
-- wrapper serializes payment and correction against the same finalization row.
alter function public.correct_game_score(text,timestamptz,bigint,text,integer,integer,text,text,text)
  set schema private;
alter function private.correct_game_score(text,timestamptz,bigint,text,integer,integer,text,text,text)
  rename to correct_game_score_base;
revoke all on function private.correct_game_score_base(text,timestamptz,bigint,text,integer,integer,text,text,text)
  from public,anon,authenticated;

create function public.correct_game_score(
  p_game_id text,p_expected_updated_at timestamptz,p_expected_outcome_revision bigint,
  p_status text,p_away_score integer,p_home_score integer,p_period text,p_clock text,p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare audit_id bigint; affected_weeks uuid[];
begin
  select array_agg(distinct f.week_id) into affected_weeks
    from private.pickem_contest_finalizations f join public.pickem_games g on g.week_id=f.week_id
    where g.game_id=p_game_id and f.state='current';
  perform 1 from private.pickem_contest_finalizations f
    where f.week_id=any(affected_weeks) order by f.week_id for update;
  perform private.correct_game_score_base(p_game_id,p_expected_updated_at,p_expected_outcome_revision,
    p_status,p_away_score,p_home_score,p_period,p_clock,p_reason);
  select id into audit_id from private.game_score_correction_audit
    where game_id=p_game_id order by id desc limit 1;
  update private.pickem_contest_finalizations set correction_audit_id=audit_id
    where week_id=any(affected_weeks) and state<>'current' and correction_audit_id is null;
  update private.pickem_contest_finalization_history h set correction_audit_id=audit_id
    from private.pickem_contest_finalizations f where h.week_id=f.week_id
      and h.generation=f.generation and h.week_id=any(affected_weeks)
      and f.state<>'current' and h.correction_audit_id is null;
  update private.pickem_winner_claims c set correction_audit_id=audit_id
    from private.pickem_contest_finalizations f where c.week_id=f.week_id
      and c.generation=f.generation and c.week_id=any(affected_weeks)
      and f.state='superseded' and c.decision='superseded'
      and c.correction_audit_id is null;
end; $$;
revoke all on function public.correct_game_score(text,timestamptz,bigint,text,integer,integer,text,text,text) from public,anon;
grant execute on function public.correct_game_score(text,timestamptz,bigint,text,integer,integer,text,text,text) to authenticated;

-- The administrator records payment only after it actually occurs. This is
-- a private audit state, not an automatic money movement or clawback.
create function public.admin_record_pickem_prize_paid(p_week_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare f private.pickem_contest_finalizations%rowtype;
begin
  if auth.uid() is null or not private.is_active_member(auth.uid())
    or not private.has_role('admin'::public.user_role) then
    raise exception using errcode='42501',message='Administrator access required';
  end if;
  select * into f from private.pickem_contest_finalizations where week_id=p_week_id for update;
  if f.week_id is null or f.state<>'current' or f.winner_user_id is distinct from
    (select user_id from public.pickem_week_standings where week_id=p_week_id order by weekly_rank limit 1)
    or not exists (select 1 from private.pickem_winner_claims c where c.week_id=p_week_id
      and c.user_id=f.winner_user_id and c.generation=f.generation and c.decision='confirmed') then
    raise exception 'Current ranked winner must be confirmed before recording payment';
  end if;
  update private.pickem_winner_claims set decision='paid',payment_recorded_at=clock_timestamp(),
    decision_at=clock_timestamp(),actor_id=auth.uid()
    where week_id=p_week_id and user_id=f.winner_user_id and generation=f.generation and decision='confirmed';
end; $$;
revoke all on function public.admin_record_pickem_prize_paid(uuid) from public,anon;
grant execute on function public.admin_record_pickem_prize_paid(uuid) to authenticated;

-- Current-generation claims remain distinct from prior superseded candidates.
create or replace function public.admin_record_pickem_winner_notice(p_week_id uuid)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare candidate uuid; deadline timestamptz; sent_at timestamptz; current_generation integer;
begin
  if auth.uid() is null or not private.is_active_member(auth.uid())
    or not private.has_role('admin'::public.user_role) then
    raise exception using errcode='42501', message='Administrator access required';
  end if;
  select contact.user_id into candidate from public.admin_pickem_provisional_winner_contact(p_week_id) contact;
  if candidate is null then raise exception 'No resolved provisional winner is available'; end if;
  select generation into current_generation from private.pickem_contest_finalizations where week_id=p_week_id and state='current';
  if not exists (select 1 from private.pickem_contest_finalizations f
    where f.week_id=p_week_id and clock_timestamp()<f.finalized_at+interval '30 days') then
    raise exception 'The 30-day reallocation period has ended'; end if;
  if exists (select 1 from private.pickem_winner_claims
             where week_id=p_week_id and user_id=candidate and generation=current_generation) then
    raise exception 'This candidate already has a recorded claim action';
  end if;
  sent_at := clock_timestamp();
  insert into private.pickem_winner_claims (week_id,user_id,generation,previous_rank,notified_at,respond_by,actor_id)
  values (p_week_id,candidate,current_generation,1,sent_at,sent_at+interval '72 hours',auth.uid())
  returning respond_by into deadline;
  return deadline;
end; $$;
revoke all on function public.admin_record_pickem_winner_notice(uuid) from public, anon;
grant execute on function public.admin_record_pickem_winner_notice(uuid) to authenticated;

create or replace function public.admin_record_pickem_winner_response(p_week_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare candidate uuid; current_generation integer;
begin
  if auth.uid() is null or not private.is_active_member(auth.uid())
    or not private.has_role('admin'::public.user_role) then
    raise exception using errcode='42501', message='Administrator access required';
  end if;
  select contact.user_id into candidate from public.admin_pickem_provisional_winner_contact(p_week_id) contact;
  select generation into current_generation from private.pickem_contest_finalizations where week_id=p_week_id and state='current';
  update private.pickem_winner_claims set responded_at=clock_timestamp(),actor_id=auth.uid()
  where week_id=p_week_id and user_id=candidate and generation=current_generation and decision='pending'
    and responded_at is null and clock_timestamp()<respond_by;
  if not found then raise exception 'No pending candidate can respond within 72 hours'; end if;
end; $$;
revoke all on function public.admin_record_pickem_winner_response(uuid) from public, anon;
grant execute on function public.admin_record_pickem_winner_response(uuid) to authenticated;

create or replace function public.admin_decide_pickem_winner_claim(p_week_id uuid, p_decision text, p_reason text)
returns void language plpgsql security definer set search_path = '' as $$
declare candidate uuid; claim private.pickem_winner_claims%rowtype; current_generation integer;
begin
  if auth.uid() is null or not private.is_active_member(auth.uid())
    or not private.has_role('admin'::public.user_role) then
    raise exception using errcode='42501', message='Administrator access required';
  end if;
  if p_decision not in ('confirmed','ineligible','cannot_contact','no_response')
    or nullif(btrim(p_reason),'') is null then raise exception 'A decision and reason are required'; end if;
  select contact.user_id into candidate from public.admin_pickem_provisional_winner_contact(p_week_id) contact;
  if candidate is null then raise exception 'No resolved provisional winner is available'; end if;
  select generation into current_generation from private.pickem_contest_finalizations where week_id=p_week_id and state='current';
  select * into claim from private.pickem_winner_claims
    where week_id=p_week_id and user_id=candidate and generation=current_generation for update;
  if claim.week_id is null then
    if p_decision not in ('ineligible','cannot_contact') then
      raise exception 'Record notification before deciding this claim'; end if;
    insert into private.pickem_winner_claims (week_id,user_id,generation,previous_rank,actor_id)
    values (p_week_id,candidate,current_generation,1,auth.uid());
  elsif claim.decision <> 'pending' then
    raise exception 'This candidate already has a final claim decision';
  end if;
  if p_decision='no_response' and (claim.respond_by is null
    or clock_timestamp()<claim.respond_by or claim.responded_at is not null) then
    raise exception 'The 72-hour response period has not expired without a response'; end if;
  if p_decision='confirmed' and (claim.responded_at is null
    or claim.responded_at>=claim.respond_by) then
    raise exception 'A timely response and eligibility review are required'; end if;
  if p_decision='confirmed' and not exists (
    select 1 from private.pickem_contest_finalizations f where f.week_id=p_week_id
      and clock_timestamp()<f.finalized_at+interval '30 days') then
    raise exception 'The 30-day prize claim period has ended'; end if;
  update private.pickem_winner_claims set decision=p_decision,decision_at=clock_timestamp(),
    reason=btrim(p_reason),actor_id=auth.uid()
  where week_id=p_week_id and user_id=candidate and generation=current_generation;
  if p_decision<>'confirmed' then
    update public.pickem_contest_entries set status='disqualified',
      disqualification_reason=p_decision||': '||btrim(p_reason)
    where week_id=p_week_id and user_id=candidate and status='valid';
    update private.pickem_contest_finalizations set winner_user_id=(
      select user_id from public.pickem_week_standings where week_id=p_week_id
      order by weekly_rank limit 1) where week_id=p_week_id and generation=current_generation;
  end if;
end; $$;
revoke all on function public.admin_decide_pickem_winner_claim(uuid,text,text) from public, anon;
grant execute on function public.admin_decide_pickem_winner_claim(uuid,text,text) to authenticated;

create function public.admin_pickem_correction_review_status(p_week_id uuid)
returns table (generation integer,state text,winner_user_id uuid,correction_audit_id bigint,
  previous_finalized_at timestamptz,paid_user_id uuid)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_active_member(auth.uid())
    or not private.has_role('admin'::public.user_role) then
    raise exception using errcode='42501',message='Administrator access required';
  end if;
  return query select f.generation,f.state,f.winner_user_id,f.correction_audit_id,f.finalized_at,
    (select c.user_id from private.pickem_winner_claims c
      where c.week_id=f.week_id and c.decision='paid' order by c.payment_recorded_at desc limit 1)
    from private.pickem_contest_finalizations f where f.week_id=p_week_id;
end; $$;
revoke all on function public.admin_pickem_correction_review_status(uuid) from public,anon;
grant execute on function public.admin_pickem_correction_review_status(uuid) to authenticated;

create function public.admin_pickem_winner_claim_status_v2(p_week_id uuid)
returns table (user_id uuid,generation integer,previous_rank integer,notified_at timestamptz,
  respond_by timestamptz,responded_at timestamptz,decision text,decision_at timestamptz,
  superseded_at timestamptz,payment_recorded_at timestamptz,correction_audit_id bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if auth.uid() is null or not private.is_active_member(auth.uid())
    or not private.has_role('admin'::public.user_role) then
    raise exception using errcode='42501',message='Administrator access required';
  end if;
  return query select c.user_id,c.generation,c.previous_rank,c.notified_at,c.respond_by,
    c.responded_at,c.decision,c.decision_at,c.superseded_at,c.payment_recorded_at,c.correction_audit_id
    from private.pickem_winner_claims c where c.week_id=p_week_id
    order by c.generation,c.notified_at nulls first;
end; $$;
revoke all on function public.admin_pickem_winner_claim_status_v2(uuid) from public,anon;
grant execute on function public.admin_pickem_winner_claim_status_v2(uuid) to authenticated;

-- Run after the existing verified_final_grades_pickem trigger. This also
-- catches trusted canonical outcome changes outside the score-correction RPC.
create function private.reconcile_pickem_leader_after_state_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare f record; candidate uuid; paid boolean;
begin
  for f in select distinct current_finalization.* from private.pickem_contest_finalizations current_finalization
    join public.pickem_games g on g.week_id=current_finalization.week_id
    where g.game_id=new.game_id and current_finalization.state='current'
  loop
    select user_id into candidate from public.pickem_week_standings
      where week_id=f.week_id order by weekly_rank limit 1;
    if candidate is not distinct from f.winner_user_id then continue; end if;
    select exists(select 1 from private.pickem_winner_claims c where c.week_id=f.week_id
      and c.generation=f.generation and c.decision='paid') into paid;
    if not paid then
      update private.pickem_winner_claims set decision='superseded',superseded_at=clock_timestamp(),
        decision_at=clock_timestamp(),reason='Corrected official result changed the provisional winner',
        actor_id=coalesce(new.updated_by,f.actor_id)
        where week_id=f.week_id and generation=f.generation and decision in ('pending','confirmed');
    end if;
    update private.pickem_contest_finalization_history
      set superseded_at=clock_timestamp(),previous_rank=1,corrected_winner_user_id=candidate,
          reason=case when paid then 'Paid prize: administrator and legal review required'
            else 'Corrected official result changed the provisional winner' end
      where week_id=f.week_id and generation=f.generation;
    update private.pickem_contest_finalizations
      set state=case when paid then 'post_payment_review' else 'superseded' end
      where week_id=f.week_id;
  end loop;
  return new;
end; $$;
revoke all on function private.reconcile_pickem_leader_after_state_change() from public,anon,authenticated;
create trigger zz_reconcile_pickem_leader_after_state_change
  after insert or update on public.game_state for each row
  execute function private.reconcile_pickem_leader_after_state_change();

-- A corrected official tie clears the Week 6+ GOTW played-total comparison.
-- Preserve the historical Week 5 ranking definition.
create or replace view public.pickem_week_standings as
with totals as (
  select week.id as week_id, week.season, week.week, pick.user_id,
    count(*) filter (where pick.is_correct is not null)::integer as graded_picks,
    count(*) filter (where pick.is_correct = true)::integer as correct_picks,
    prediction.predicted_total,
    case when (week.outcome_resolution_at is null or featured_resolution.disposition='resolved')
      and state.verified and state.status = 'final'
      and (state.result_type = 'played' or (week.season = 2026 and week.week < 6 and state.result_type = 'tie'))
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
    and ((week.season = 2026 and week.week < 6) or not exists (
      select 1 from public.pickem_games remaining
      where remaining.week_id = week.id and now() < remaining.lock_at
        and not exists (select 1 from private.pickem_contest_game_resolution resolution
          where resolution.pickem_game_id = remaining.id and resolution.disposition = 'void')))
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
