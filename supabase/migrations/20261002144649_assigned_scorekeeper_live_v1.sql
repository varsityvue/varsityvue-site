-- LIVE-only pilot. No data backfill, base tables, or public payload changes.
-- All publication paths lock game (7319), canonical state, then authorization:
-- account status -> role -> one qualifying assignment. Revocation that wins
-- these row locks denies publication; revocation waits for an authorized writer.
create function private.assigned_scorekeeper_authority(p_game_id text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid(); g public.game_state%rowtype;
 identity private.canonical_game_identity%rowtype;
 assignment public.contributor_school_assignments%rowtype;
begin
 if actor is null then raise exception using errcode='42501',message='Assigned scorekeeper authority required.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_game_id,7319));
 select * into g from public.game_state where game_id=p_game_id for update;
 select * into identity from private.canonical_game_identity where game_id=p_game_id for share;
 if g.game_id is null or identity.game_id is null or g.status<>'live' or not g.verified
    or g.home_score is null or g.away_score is null or g.result_type is not null
    or g.official_winner_school_slug is not null
    or g.home_school_slug is distinct from identity.home_school_slug
    or g.away_school_slug is distinct from identity.away_school_slug then
   raise exception using errcode='55000',message='A verified numeric LIVE game must already exist. Ask a moderator to start or finalize this game.';
 end if;
 perform 1 from public.member_account_status where user_id=actor and status='active' for share;
 if not found then raise exception using errcode='42501',message='Active assigned scorekeeper authority required.'; end if;
 perform 1 from public.user_roles where user_id=actor and role='scorekeeper' for share;
 if not found then raise exception using errcode='42501',message='Assigned scorekeeper authority required.'; end if;
 select * into assignment from public.contributor_school_assignments
 where user_id=actor and active and assignment_role='scorekeeper'
 and school_slug in (identity.home_school_slug,identity.away_school_slug)
 order by school_slug limit 1 for share;
 if not found then raise exception using errcode='42501',message='Your active scorekeeper assignment no longer covers this game.'; end if;
 return jsonb_build_object('policy','assigned_scorekeeper_authority_v1','actor_id',actor,
  'game_id',p_game_id,'school_slug',assignment.school_slug,'assignment_role',assignment.assignment_role,
  'active',assignment.active,'assignment_created_at',assignment.created_at,'assignment_updated_at',assignment.updated_at,
  'canonical_home_school_slug',identity.home_school_slug,'canonical_away_school_slug',identity.away_school_slug,
  'authorized_at',now(),'state_updated_at',g.updated_at,'state_revision',g.score_revision,
  'state_status',g.status,'state_verified',g.verified);
end $$;
revoke all on function private.assigned_scorekeeper_authority(text) from public,anon,authenticated,service_role;
-- Private schema is not exposed by PostgREST. Invoker wrappers need this grant;
-- the helper authenticates and checks the complete scope independently.
grant execute on function private.assigned_scorekeeper_authority(text) to authenticated;

create function private.publish_trusted_score(
 p_game_id text,p_home_score integer,p_away_score integer,p_game_status text,
 p_period text,p_clock text,p_source_note text,p_expected_state_updated_at timestamptz,
 p_expected_state_revision bigint,p_expected_state_absent boolean,
 p_assigned_scorekeeper boolean,p_confirm_score_decrease boolean
) returns uuid language plpgsql security definer set search_path = '' as $$
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
   raise exception using errcode='40001',message='Game changed — review the current score.';
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
end $$;
revoke all on function private.publish_trusted_score(text,integer,integer,text,text,text,text,timestamptz,bigint,boolean,boolean,boolean) from public,anon,authenticated,service_role;
grant execute on function private.publish_trusted_score(text,integer,integer,text,text,text,text,timestamptz,bigint,boolean,boolean,boolean) to authenticated;

-- Preserve operator signature, authority, accepted fields, and stale-state contract.
create or replace function public.submit_trusted_score_update(
 p_game_id text,p_home_score integer,p_away_score integer,p_game_status text,
 p_period text,p_clock text,p_source_note text,p_expected_state_updated_at timestamptz,
 p_expected_state_revision bigint,p_expected_state_absent boolean
) returns uuid language plpgsql security invoker set search_path = '' as $$
begin
 if auth.uid() is null or not private.can_moderate_scores() then
  raise exception using errcode='42501',message='Trusted score authority required.';
 end if;
 return private.publish_trusted_score(p_game_id,p_home_score,p_away_score,p_game_status,p_period,p_clock,p_source_note,
 p_expected_state_updated_at,p_expected_state_revision,p_expected_state_absent,false,false);
end $$;

create function public.submit_assigned_scorekeeper_update(
 p_game_id text,p_home_score integer,p_away_score integer,p_period text,p_clock text,
 p_expected_state_updated_at timestamptz,p_expected_state_revision bigint,p_confirm_score_decrease boolean
) returns uuid language plpgsql security invoker set search_path = '' as $$
begin
 return private.publish_trusted_score(p_game_id,p_home_score,p_away_score,'live',p_period,p_clock,null,
 p_expected_state_updated_at,p_expected_state_revision,false,true,p_confirm_score_decrease);
end $$;
revoke all on function public.submit_assigned_scorekeeper_update(text,integer,integer,text,text,timestamptz,bigint,boolean) from public,anon,authenticated,service_role;
grant execute on function public.submit_assigned_scorekeeper_update(text,integer,integer,text,text,timestamptz,bigint,boolean) to authenticated;

-- Existing moderator corroboration is preserved. An assigned publisher needs
-- matching server-generated authority evidence and the still-current LIVE state.
-- This BEFORE INSERT runs inside apply_score_submission_review BEFORE UPDATE:
-- the submission row is still pending here; do not pretend it is approved yet.
create or replace function private.corroborate_score_publication() returns trigger
language plpgsql security definer set search_path = '' as $$
declare s public.score_submissions%rowtype; g public.game_state%rowtype; authority jsonb;
begin
 new.payload := coalesce(new.payload,'{}'::jsonb)-'publisher_bound_v1';
 if new.event_type='approved' and auth.uid() is not null and new.actor_id=auth.uid() then
  if private.can_moderate_scores() then
   new.payload := new.payload || jsonb_build_object('publisher_bound_v1',true);
  else
   select * into s from public.score_submissions where id=new.submission_id;
   select * into g from public.game_state where game_id=s.game_id;
   if s.submitted_by=auth.uid() and s.status='pending' and s.game_status='live'
    and s.expected_state_absent=false and s.expected_state_updated_at=g.updated_at and s.expected_state_revision=g.score_revision
    and new.payload @> jsonb_build_object('game_id',s.game_id,'game_status','live','home_score',s.home_score,
     'away_score',s.away_score,'period',s.period,'clock',s.clock)
    and exists(select 1 from public.score_submission_events e where e.submission_id=s.id
     and e.event_type='note_added' and e.actor_id=auth.uid() and e.created_at=now()
     and e.payload->>'kind'='assigned_scorekeeper_authority_v1') then
    authority := private.assigned_scorekeeper_authority(s.game_id);
    if exists(select 1 from public.score_submission_events e where e.submission_id=s.id
     and e.event_type='note_added' and e.actor_id=auth.uid() and e.created_at=now()
     and e.payload @> jsonb_build_object('kind','assigned_scorekeeper_authority_v1','submission_id',s.id,
      'authority',authority,'home_score',s.home_score,'away_score',s.away_score,'period',s.period,'clock',s.clock)) then
     new.payload := new.payload || jsonb_build_object('publisher_bound_v1',true);
    end if;
   end if;
  end if;
 end if;
 return new;
end $$;
