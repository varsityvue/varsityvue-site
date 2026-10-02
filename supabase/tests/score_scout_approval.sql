-- Disposable database only. Fixtures, tests, and simulated failures all roll back.
begin;
create temp table scout_actors(label text,id uuid);
insert into scout_actors values
 ('admin','00000000-0000-4000-8000-000000000701'),
 ('moderator','00000000-0000-4000-8000-000000000702'),
 ('member','00000000-0000-4000-8000-000000000703'),
 ('scorekeeper','00000000-0000-4000-8000-000000000704'),
 ('suspended','00000000-0000-4000-8000-000000000705'),
 ('inactive','00000000-0000-4000-8000-000000000706');
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',label||'-scout@example.invalid','!',now(),'{}','{}',now(),now() from scout_actors;
insert into public.user_roles(user_id,role) select id,case when label in('suspended','inactive') then 'moderator' else label end::public.user_role from scout_actors where label<>'member';
update public.member_account_status set status='suspended',suspended_at=now() where user_id=(select id from scout_actors where label='suspended');
delete from public.member_account_status where user_id=(select id from scout_actors where label='inactive');
create temp table scout_fixtures(name text primary key,evidence uuid,candidate uuid,snapshot jsonb,updated_at timestamptz,revision bigint,absent boolean);
create function pg_temp.scout_fixture(p_name text,p_state text default null) returns void language plpgsql as $$
declare i uuid;e uuid;g text := '__scout_'||p_name||'__';snap jsonb;
begin
 insert into private.canonical_game_identity values(g,'scout-away','scout-home');
 if p_state is not null then
 insert into public.game_state(game_id,status,home_score,away_score,verified,verified_at,result_type)
 values(g,p_state,7,0,true,now(),case when p_state='final' then 'played' else null end);
 end if;
 insert into public.missing_score_intelligence(game_id,kickoff,away_team,home_team,away_school_slug,home_school_slug)
 values(g,now()-interval '5 hours','Scout Away','Scout Home','scout-away','scout-home') returning id into i;
 insert into public.missing_score_evidence(intelligence_id,source_name,source_type,source_url,ingestion_method,home_score,away_score,evidence_note)
 values(i,'External fixture','score_service','https://example.invalid/result','automated',21,28,'Untrusted source excerpt') returning id into e;
 select jsonb_build_object('id',v.id,'intelligence_id',v.intelligence_id,'game_id',g,
 'away_score',v.away_score,'home_score',v.home_score,'source_name',v.source_name,'source_type',v.source_type,
 'source_url',v.source_url,'ingestion_method',v.ingestion_method,'evidence_note',v.evidence_note,
 'captured_at',v.captured_at,'review_status',v.review_status,'away_school_slug','scout-away','home_school_slug','scout-home') into snap from public.missing_score_evidence v where id=e;
 insert into scout_fixtures select p_name,e,i,snap,s.updated_at,s.score_revision,s.game_id is null
 from (select 1) seed left join public.game_state s on s.game_id=g;
end $$;
select pg_temp.scout_fixture(n,case when n in('stale_time','stale_revision','stale_absent','final_conflict','final_same','exceptional') then case when n in('final_conflict','final_same') then 'final' else 'live' end else null end)
from unnest(array['mod','admin','authority','reject','defer','stale_time','stale_revision','stale_absent','evidence','mapping','final_conflict','final_same','tie','exceptional','confirm','rollback','community','keeper']) n;
insert into public.missing_score_evidence(intelligence_id,source_name,home_score,away_score)
select candidate,'Sibling',21,28 from scout_fixtures where name='mod';
-- Equal-result terminal request still fails, not an idempotent new publication.
update public.missing_score_evidence set home_score=7,away_score=0 where id=(select evidence from scout_fixtures where name='final_same');
update scout_fixtures set snapshot=snapshot||'{"home_score":7,"away_score":0}' where name='final_same';
update public.missing_score_evidence set home_score=21,away_score=21 where id=(select evidence from scout_fixtures where name='tie');
update scout_fixtures set snapshot=snapshot||'{"home_score":21,"away_score":21}' where name='tie';
update public.missing_score_evidence set evidence_note='Changed after page load' where id=(select evidence from scout_fixtures where name='evidence');
update public.missing_score_intelligence set game_id='__scout_other_mapping__' where id=(select candidate from scout_fixtures where name='mapping');
grant select on scout_actors,scout_fixtures to authenticated;
create function pg_temp.scout_review(n text,d text default 'approve',patch jsonb default '{}') returns jsonb language plpgsql as $$
declare f scout_fixtures%rowtype;begin
 select * into f from scout_fixtures where name=n;
 return public.review_missing_score_evidence(f.evidence,d,'Disposable review','__scout_'||n||'__',
 case when patch ? 'updated_at' then (patch->>'updated_at')::timestamptz else f.updated_at end,
 case when patch ? 'revision' then (patch->>'revision')::bigint else f.revision end,
 case when patch ? 'absent' then (patch->>'absent')::boolean else f.absent end,
 coalesce(patch->'snapshot',f.snapshot),coalesce((patch->>'confirm')::boolean,true),coalesce(patch->>'result_type','played'));
end $$;
create function pg_temp.scout_failure(n text,expected text,patch jsonb default '{}',d text default 'approve') returns void language plpgsql as $$
declare actual text;begin
 begin perform pg_temp.scout_review(n,d,patch); raise exception 'Unexpected success: %',n;
 exception when others then get stacked diagnostics actual=returned_sqlstate;
 if actual<>expected then raise exception 'Wrong error for %: expected %, got % (%)',n,expected,actual,sqlerrm;end if;end;
end $$;
-- Ordinary member / scorekeeper / suspended / inactive / anonymous cannot review.
set local role authenticated;
do $$ declare a record;begin
 for a in select * from scout_actors where label in('member','scorekeeper','suspended','inactive') loop
 perform set_config('request.jwt.claim.sub',a.id::text,true);perform pg_temp.scout_failure('authority','42501');end loop;
 perform set_config('request.jwt.claim.sub','',true);perform pg_temp.scout_failure('authority','42501');
end $$;
reset role;
-- Admin/moderator publish through the actual bound trusted path.
select set_config('request.jwt.claim.sub',(select id::text from scout_actors where label='moderator'),true);
set local role authenticated;
select pg_temp.scout_review('mod');
select pg_temp.scout_failure('mod','55000');
select pg_temp.scout_review('reject','reject');
select pg_temp.scout_review('defer','defer');
reset role;
select set_config('request.jwt.claim.sub',(select id::text from scout_actors where label='admin'),true);
set local role authenticated;
select pg_temp.scout_review('admin');
select pg_temp.scout_failure('stale_time','40001','{"updated_at":"2000-01-01T00:00:00Z"}');
select pg_temp.scout_failure('stale_revision','40001','{"revision":99}');
select pg_temp.scout_failure('stale_absent','40001','{"absent":true}');
select pg_temp.scout_failure('authority','40001','{"absent":false,"revision":0,"updated_at":"2000-01-01T00:00:00Z"}');
select pg_temp.scout_failure('evidence','40001');
select pg_temp.scout_failure('mapping','40001');
select pg_temp.scout_failure('final_conflict','P0001');
select pg_temp.scout_failure('final_same','P0001');
select pg_temp.scout_failure('tie','22023');
select pg_temp.scout_failure('exceptional','22023','{"result_type":"forfeit"}');
select pg_temp.scout_failure('exceptional','22023','{"result_type":"no_contest"}');
select pg_temp.scout_failure('exceptional','22023','{"result_type":"live"}');
select pg_temp.scout_failure('confirm','22023','{"confirm":false}');
-- Trusted/community boundary still rejects trusted operators.
do $$ begin
 begin perform public.submit_score_submission('__scout_community__',21,28,'final',null,null,null);
 raise exception 'Trusted community boundary weakened';exception when invalid_parameter_value then null;end;
 -- Arbitrary caller-supplied actor cannot produce a bound review.
 begin update public.score_submissions set reviewed_by=(select id from scout_actors where label='member')
 where game_id='__scout_mod__';raise exception 'Reviewer forgery allowed';exception when insufficient_privilege then null;end;
 -- Private logger cannot link an unrelated evidence/publication pair.
 begin perform private.log_score_scout_publication((select evidence from scout_fixtures where name='authority'),
 (select id from public.score_submissions where game_id='__scout_admin__'));
 raise exception 'Forged evidence link allowed';exception when object_not_in_prerequisite_state then null;end;
end $$;
reset role;
-- Successful provenance, neutral public projection, and sibling/queue state.
do $$ declare n text;s public.score_submissions%rowtype;g public.game_state%rowtype;actor uuid;payload jsonb;begin
 foreach n in array array['mod','admin'] loop
 select * into s from public.score_submissions where game_id='__scout_'||n||'__';
 select * into g from public.game_state where game_id=s.game_id;
 select id into actor from scout_actors where label=case when n='mod' then 'moderator' else 'admin' end;
 if s.status<>'approved' or s.submitted_by<>actor or s.reviewed_by<>actor or g.updated_by<>actor
 or g.source_submission_id<>s.id or g.status<>'final' or not g.verified or g.home_score<>21 or g.away_score<>28 then raise exception 'Publication invariant failed';end if;
 if (select count(*) from public.score_submissions where game_id=s.game_id)<>1 then raise exception 'Duplicate submission';end if;
 if not exists(select 1 from public.score_submission_events where submission_id=s.id and event_type='submitted' and actor_id=actor)
 or not exists(select 1 from public.score_submission_events where submission_id=s.id and event_type='approved' and actor_id=actor and payload->>'publisher_bound_v1'='true')
 or not exists(select 1 from public.score_submission_events where submission_id=s.id and event_type='note_added' and actor_id=actor and payload->>'kind'='score_scout_evidence_link_v1' and payload->>'evidence_id'=(select evidence::text from scout_fixtures where name=n)) then raise exception 'Event provenance missing';end if;
 if (select status from public.missing_score_intelligence where id=(select candidate from scout_fixtures where name=n))<>'resolved'
 or (select review_status from public.missing_score_evidence where id=(select evidence from scout_fixtures where name=n))<>'approved' then raise exception 'Evidence/queue not resolved';end if;
 select to_jsonb(p) into payload from public.public_score_states() p where game_id=s.game_id;
 if payload->>'attribution_type'<>'verified' or payload->>'attribution_username' is not null
 or payload ?| array['actor_id','updated_by','source_submission_id','reviewed_by','email','source_url','payload'] then raise exception 'Public privacy changed';end if;
 end loop;
 if exists(select 1 from public.missing_score_evidence where intelligence_id=(select candidate from scout_fixtures where name='mod') and id<>(select evidence from scout_fixtures where name='mod') and review_status<>'superseded') then raise exception 'Sibling not superseded';end if;
 if exists(select 1 from public.score_submissions where game_id in('__scout_reject__','__scout_defer__')) then raise exception 'Reject/defer published';end if;
end $$;
-- Simulated event-write failure AFTER canonical publication must undo all effects.
create function pg_temp.scout_break_link() returns trigger language plpgsql as $$ begin
 if new.event_type='note_added' and new.payload->>'game_id'='__scout_rollback__' then raise exception using errcode='P0001',message='Disposable logger failure';end if;return new;end $$;
create trigger zz_disposable_scout_link_failure before insert on public.score_submission_events for each row execute function pg_temp.scout_break_link();
set local role authenticated;
select pg_temp.scout_failure('rollback','P0001');
reset role;
do $$ begin
 if exists(select 1 from public.game_state where game_id='__scout_rollback__') or exists(select 1 from public.score_submissions where game_id='__scout_rollback__')
 or (select status from public.missing_score_intelligence where id=(select candidate from scout_fixtures where name='rollback'))<>'open'
 or (select review_status from public.missing_score_evidence where id=(select evidence from scout_fixtures where name='rollback'))<>'pending' then raise exception 'Atomic rollback failed';end if;
 if to_regprocedure('public.review_missing_score_evidence(uuid,text,text)') is not null then raise exception 'Unsafe legacy signature remains';end if;
 if has_function_privilege('anon','private.log_score_scout_publication(uuid,uuid)','execute') then raise exception 'Public logger grant';end if;
end $$;
-- Ordinary member and assigned scorekeeper remain pending reporters.
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from scout_actors where label='member'),true);
select * from public.submit_score_submission('__scout_community__',21,28,'final',null,null,null);
select set_config('request.jwt.claim.sub',(select id::text from scout_actors where label='scorekeeper'),true);
select * from public.submit_score_submission('__scout_keeper__',21,28,'final',null,null,null);
reset role;
do $$ begin if exists(select 1 from public.score_submissions where game_id in('__scout_community__','__scout_keeper__') and status<>'pending') then raise exception 'Community/keeper authority changed';end if;end $$;
-- Actual Score Scout publication through existing Pick Em grading/cutoff triggers.
select pg_temp.scout_fixture(n) from unnest(array['grade','void','late']) n;
insert into public.pickem_weeks(season,week,title,status,opens_at,closes_at,entry_deadline_at,outcome_resolution_at)
values(2097,6,'Scout integration','locked',now()-interval '2 days',now()-interval '1 hour',now()-interval '1 hour',now()+interval '1 day'),
(2097,7,'Scout cutoff','locked',now()-interval '3 days',now()-interval '2 days',now()-interval '2 days',now()-interval '1 hour');
insert into public.pickem_games(week_id,game_id,sort_order,lock_at,away_school_slug,home_school_slug)
select w.id,'__scout_'||n||'__',case when n='void' then 2 else 1 end,now()-interval '1 hour','scout-away','scout-home'
from unnest(array['grade','void','late']) n join public.pickem_weeks w on w.season=2097 and w.week=case when n='late' then 7 else 6 end;
insert into private.pickem_contest_game_resolution(pickem_game_id,disposition,reason)
select id,'void','Disposable preexisting VOID' from public.pickem_games where game_id='__scout_void__';
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from scout_actors where label='admin'),true);
select pg_temp.scout_review('grade');
select pg_temp.scout_review('void');
select pg_temp.scout_review('late');
reset role;
do $$ begin
 if (select result_winner_school_slug from public.pickem_games where game_id='__scout_grade__') is distinct from 'scout-away' then raise exception 'Scout FINAL did not grade';end if;
 if exists(select 1 from public.pickem_games where game_id in('__scout_void__','__scout_late__') and result_winner_school_slug is not null) then raise exception 'Scout revived a VOID game';end if;
 if (select r.disposition from private.pickem_contest_game_resolution r join public.pickem_games g on g.id=r.pickem_game_id where g.game_id='__scout_late__') is distinct from 'void' then raise exception 'Monday cutoff not preserved';end if;
end $$;
rollback;
