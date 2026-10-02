-- No new tables, history repair, or changes to the shared scoring/attribution functions.
-- Private logger receives identifiers only; every audit value is resolved internally.
create function private.log_score_scout_publication(p_evidence_id uuid, p_submission_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid(); e public.missing_score_evidence%rowtype;
  i public.missing_score_intelligence%rowtype; s public.score_submissions%rowtype;
  g public.game_state%rowtype;
begin
  if actor is null or not private.can_moderate_scores() then
    raise exception using errcode='42501', message='Moderator access required.';
  end if;
  select * into s from public.score_submissions where id=p_submission_id;
  if not found then raise exception using errcode='55000',message='Score Scout publication could not be verified.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(s.game_id,7319));
  select * into g from public.game_state where game_id=s.game_id for update;
  select * into e from public.missing_score_evidence where id=p_evidence_id;
  select * into i from public.missing_score_intelligence where id=e.intelligence_id;
  if e.id is null or i.id is null or e.review_status<>'approved' or e.reviewed_by is distinct from actor
     or e.reviewed_at is distinct from now() or s.submitted_by is distinct from actor
     or s.reviewed_by is distinct from actor or s.reviewed_at is distinct from now()
     or s.status<>'approved' or s.game_status<>'final' or s.game_id is distinct from i.game_id
     or s.home_score is distinct from e.home_score or s.away_score is distinct from e.away_score
     or g.source_submission_id is distinct from s.id or g.updated_by is distinct from actor
     or g.verified is not true or g.status is distinct from 'final' or g.result_type is distinct from 'played'
     or g.home_score is distinct from e.home_score or g.away_score is distinct from e.away_score
     or s.period is not null or s.clock is not null or g.period is not null or g.clock is not null
     or not exists(select 1 from public.score_submission_events v where v.submission_id=s.id
       and v.event_type='approved' and v.actor_id=actor and v.created_at=g.verified_at
       and v.payload->>'publisher_bound_v1'='true') then
    raise exception using errcode='55000',message='Score Scout publication could not be verified.';
  end if;
  if exists(select 1 from public.score_submission_events where submission_id=s.id
    and event_type='note_added' and payload->>'kind'='score_scout_evidence_link_v1') then
    raise exception using errcode='55000',message='Score Scout publication is already linked.';
  end if;
  insert into public.score_submission_events(submission_id,event_type,actor_id,note,payload)
  values(s.id,'note_added',actor,'Published from reviewed Score Scout evidence.',
    jsonb_build_object('kind','score_scout_evidence_link_v1','evidence_id',e.id,
      'intelligence_id',i.id,'game_id',i.game_id,'home_score',e.home_score,'away_score',e.away_score,
      'game_status','final','source_name',e.source_name,'source_type',e.source_type,
      'source_url',e.source_url,'ingestion_method',e.ingestion_method,'evidence_note',e.evidence_note,
      'captured_at',e.captured_at,'reviewed_at',e.reviewed_at,'review_note',e.review_note));
end;
$$;
revoke all on function private.log_score_scout_publication(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function private.log_score_scout_publication(uuid,uuid) to authenticated;

-- One canonical explicit RPC signature. No legacy unguarded approval overload remains.
drop function public.review_missing_score_evidence(uuid,text,text);
create function public.review_missing_score_evidence(
  target_evidence_id uuid, decision text, note text,
  p_expected_game_id text, p_expected_state_updated_at timestamptz,
  p_expected_state_revision bigint, p_expected_state_absent boolean,
  p_evidence_snapshot jsonb, p_confirm_final boolean, p_result_type text
) returns jsonb language plpgsql security invoker set search_path = '' as $$
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
    raise exception using errcode='40001',message='Game mapping changed — review the evidence again.';
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
    raise exception using errcode='40001',message='Evidence changed — review the evidence again.';
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
    raise exception using errcode='40001',message='Game changed — review the current score.';
  end if;
  if g.verified and g.status in('final','cancelled','postponed') then
    raise exception using errcode='P0001',message='Approval blocked: this game already has a verified terminal state.';
  end if;
  submission := public.submit_trusted_score_update(i.game_id,e.home_score,e.away_score,'final',null,null,
    left('Score Scout evidence: '||e.source_name||coalesce(' — '||e.source_url,''),500),
    p_expected_state_updated_at,p_expected_state_revision,p_expected_state_absent);
  select * into g from public.game_state where game_id=i.game_id;
  if g.away_school_slug is distinct from i.away_school_slug or g.home_school_slug is distinct from i.home_school_slug then
    raise exception using errcode='40001',message='Game mapping changed — review the evidence again.';
  end if;
  if not exists(select 1 from public.score_submissions s join public.game_state state
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
$$;
revoke all on function public.review_missing_score_evidence(uuid,text,text,text,timestamptz,bigint,boolean,jsonb,boolean,text)
from public,anon,authenticated,service_role;
grant execute on function public.review_missing_score_evidence(uuid,text,text,text,timestamptz,bigint,boolean,jsonb,boolean,text) to authenticated;
