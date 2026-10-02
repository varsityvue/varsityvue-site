-- Stage A only: additive contracts. Deploy the migrated application before Stage C.
-- Contextual projections deliberately use owner privileges to resolve private identities.
-- Their explicit fields/predicates are the boundary; no generic public profile directory.
create function public.public_pickem_season_standings(p_season integer)
returns table(ordinal bigint, rank bigint, display_name text, username text, graded_picks integer, correct_picks integer, accuracy_pct numeric)
language sql stable security definer set search_path = '' as $$
 with scores as (
  select t.user_id,p.display_name,p.username,t.graded_picks,t.correct_picks,
   case when t.graded_picks=0 then 0::numeric else round(100.0*t.correct_picks/t.graded_picks,1) end accuracy_pct
  from public.pickem_member_totals t join public.profiles p on p.id=t.user_id where t.season=p_season
 ) select row_number() over(order by correct_picks desc,accuracy_pct desc,user_id),
 rank() over(order by correct_picks desc),display_name,username,graded_picks,correct_picks,accuracy_pct
 from scores order by correct_picks desc,accuracy_pct desc,user_id;
$$;
create function public.public_pickem_week_standings(p_week_id uuid)
returns table(ordinal bigint,weekly_rank bigint,display_name text,username text,correct_picks integer,graded_picks integer,predicted_total integer,actual_total integer,distance integer)
language sql stable security definer set search_path = '' as $$
 select row_number() over(order by s.weekly_rank,s.user_id),s.weekly_rank,s.display_name,s.username,
 s.correct_picks,s.graded_picks,s.predicted_total,s.actual_total,s.distance
 from public.pickem_week_standings s where s.week_id=p_week_id order by s.weekly_rank,s.user_id;
$$;
create function public.own_pickem_season_summary(p_season integer)
returns table(graded_picks integer,correct_picks integer,incorrect_picks integer,season_rank bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
 if auth.uid() is null or not private.is_active_member(auth.uid()) then
  raise exception using errcode='42501',message='Active member required.';
 end if;
 return query select t.graded_picks,t.correct_picks,t.incorrect_picks,
 case when t.graded_picks>0 then 1+(select count(*) from public.pickem_member_totals other
 where other.season=t.season and other.correct_picks>t.correct_picks) end
 from public.pickem_member_totals t where t.season=p_season and t.user_id=auth.uid();
end;
$$;
create function public.internal_pickem_week_standings(p_week_id uuid)
returns setof public.pickem_week_standings
language plpgsql stable security definer set search_path = '' as $$
begin
 if auth.uid() is null or not private.can_moderate_scores() then
  raise exception using errcode='42501',message='Active score reviewer required.';
 end if;
 return query select s.* from public.pickem_week_standings s where s.week_id=p_week_id order by s.weekly_rank,s.user_id;
end;
$$;
-- This view intentionally bypasses base-table RLS only for verified public score fields.
create view public.public_game_state with(security_barrier=true) as
 select game_id,status,home_score,away_score,period,clock,verified,verified_at,created_at,updated_at,
 kickoff_override,result_type,official_winner_school_slug,away_school_slug,home_school_slug,
 schedule_revision,schedule_revised_at,outcome_revision,score_revision from public.game_state where verified;
-- Raw review columns are a separate internally guarded contract, never an owner directory.
create view public.internal_score_submissions with(security_barrier=true) as
 select id,game_id,submitted_by,home_score,away_score,game_status,period,clock,source_note,source_url,
 status,reviewed_by,reviewed_at,review_note,created_at,updated_at,expected_state_updated_at,expected_state_revision,expected_state_absent
 from public.score_submissions where private.can_moderate_scores();
create function public.own_score_report_status()
returns table(id uuid,game_id text,home_score integer,away_score integer,game_status text,period text,clock text,status text,created_at timestamptz,reviewed_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
 if auth.uid() is null or not private.is_active_member(auth.uid()) then
  raise exception using errcode='42501',message='Active member required.';
 end if;
 return query select s.id,s.game_id,s.home_score,s.away_score,s.game_status,s.period,s.clock,s.status::text,s.created_at,s.reviewed_at
 from public.score_submissions s where s.submitted_by=auth.uid() order by s.created_at desc,s.id;
end;
$$;
-- Privileged provenance availability is preserved without making creator columns public.
create function public.internal_publication_provenance(p_kind text,p_id text)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
 if auth.uid() is null or not private.can_moderate_scores() then
  raise exception using errcode='42501',message='Active score reviewer required.';
 end if;
 case p_kind
 when 'game' then select jsonb_build_object('updated_by',g.updated_by,'source_submission_id',g.source_submission_id) into result from public.game_state g where g.game_id=p_id;
 when 'week' then select jsonb_build_object('created_by',w.created_by) into result from public.pickem_weeks w where w.id=p_id::uuid;
 when 'roster' then select jsonb_build_object('created_by',p.created_by) into result from public.school_roster_players p where p.id=p_id::uuid;
 when 'feed' then
  if not private.has_role('admin'::public.user_role) then raise exception using errcode='42501',message='Active administrator required.'; end if;
  select jsonb_build_object('created_by',p.created_by) into result from public.team_feed_posts p where p.id=p_id::uuid;
 else raise exception using errcode='22023',message='Unknown provenance kind.';
 end case;
 return result;
end;
$$;
revoke all on public.public_game_state,public.internal_score_submissions from public,anon,authenticated;
grant select on public.public_game_state to anon,authenticated;
grant select on public.internal_score_submissions to authenticated;
revoke all on function public.public_pickem_season_standings(integer),public.public_pickem_week_standings(uuid),public.own_pickem_season_summary(integer),public.internal_pickem_week_standings(uuid),public.own_score_report_status(),public.internal_publication_provenance(text,text) from public,anon,authenticated,service_role;
grant execute on function public.public_pickem_season_standings(integer),public.public_pickem_week_standings(uuid) to anon,authenticated;
grant execute on function public.own_pickem_season_summary(integer),public.internal_pickem_week_standings(uuid),public.own_score_report_status(),public.internal_publication_provenance(text,text) to authenticated;

-- Same invoker, signature, locks, authority and publication; use guarded reviewer read.
create or replace function public.review_missing_score_evidence(
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
  if not exists(select 1 from public.internal_score_submissions s join public.game_state state
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
