-- Accept an explicit halftime period without changing score authority or retry behavior.
-- Apply before deploying the UI that offers Halftime to assigned scorekeepers.
do $guard$
begin
  if md5(pg_get_functiondef('private.publish_trusted_score(text,integer,integer,text,text,text,text,timestamptz,bigint,boolean,boolean,boolean)'::regprocedure)) <> 'a5274d8b7d9ed5b8e047a7c22944d2f8' then
    raise exception 'Trusted score publication definition changed; review before applying halftime migration';
  end if;
end;
$guard$;

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
 -- Halftime remains LIVE, with no running clock.
 if p_game_status='live' and btrim(p_period)='Halftime' then p_clock := null; end if;
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
  if nullif(btrim(p_period),'') is not null and btrim(p_period) !~ '^(1st|2nd|Halftime|3rd|4th|OT|OT[2-9][0-9]*)$' then
   raise exception using errcode='22023',message='Choose a valid quarter, halftime, or overtime period.';
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
