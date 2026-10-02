-- Disposable fixtures only; every change rolls back.
begin;
create temp table keeper_actors(label text,id uuid);
insert into keeper_actors select label,('00000000-0000-4000-8000-0000000006'||lpad(n::text,2,'0'))::uuid
from unnest(array['admin','moderator','keeper','opposite','unassigned','coach','inactive_assignment','unrelated','member','assignment_only','suspended','inactive']) with ordinality x(label,n);
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',label||'-keeper@example.invalid','!',now(),'{}','{}',now(),now() from keeper_actors;
insert into public.user_roles(user_id,role) select id,case when label in('admin','moderator') then label else 'scorekeeper' end::public.user_role from keeper_actors where label not in('member','assignment_only');
insert into public.contributor_school_assignments(user_id,school_slug,assignment_role,active)
select id,case when label='opposite' then 'keeper-home' when label='unrelated' then 'elsewhere' else 'keeper-away' end,
 case when label='coach' then 'coach' else 'scorekeeper' end,label<>'inactive_assignment'
from keeper_actors where label not in('admin','moderator','member','unassigned');
update public.member_account_status set status='suspended',suspended_at=now() where user_id=(select id from keeper_actors where label='suspended');
delete from public.member_account_status where user_id=(select id from keeper_actors where label='inactive');
update public.profiles set username='live_keeper' where id=(select id from keeper_actors where label='keeper');
create temp table keeper_tokens(name text,updated_at timestamptz,revision bigint);
insert into private.canonical_game_identity select '__keeper_'||n||'__','keeper-away','keeper-home' from unnest(array['live','absent','scheduled','final','postponed','cancelled','unverified','forfeit','numeric','rollback']) n;
insert into public.game_state(game_id,status,home_score,away_score,verified,verified_at,result_type,official_winner_school_slug)
select '__keeper_'||n||'__',case when n in('final','forfeit') then 'final' when n in('scheduled','postponed','cancelled') then n else 'live' end,
 case when n in('forfeit','numeric') then null else 14 end,case when n in('forfeit','numeric') then null else 21 end,n<>'unverified',now(),
 case when n='forfeit' then 'forfeit' when n='final' then 'played' else null end,case when n='forfeit' then 'keeper-away' else null end
from unnest(array['live','scheduled','final','postponed','cancelled','unverified','forfeit','numeric','rollback']) n;
insert into keeper_tokens select replace(replace(game_id,'__keeper_',''),'__',''),updated_at,score_revision from public.game_state where game_id like '__keeper_%';
-- LIVE publication must not grade even an already-closed cash-contest matchup.
create temp table keeper_week(id uuid);
do $$ declare w uuid;begin
 insert into public.pickem_weeks(season,week,title,status,opens_at,closes_at,official_rules_version,official_rules_published_at)
 values(2097,6,'Keeper integration fixture','draft',now()-interval '2 hours',now()-interval '1 hour','isolated-test',now()) returning id into w;
 insert into public.pickem_games(week_id,game_id,sort_order,lock_at,away_school_slug,home_school_slug)
 values(w,'__keeper_live__',1,now()-interval '1 hour','keeper-away','keeper-home');
 insert into keeper_week values(w);
end $$;
grant select on keeper_actors,keeper_tokens to authenticated;
create function pg_temp.keeper_update(n text default 'live',h integer default 14,a integer default 28,confirmation boolean default false,patch jsonb default '{}') returns uuid language plpgsql as $$
declare t keeper_tokens%rowtype;begin
 select * into t from keeper_tokens where name=n;
 return public.submit_assigned_scorekeeper_update('__keeper_'||n||'__',h,a,coalesce(patch->>'period','3rd'),coalesce(patch->>'clock','02:15'),
 case when patch ? 'time' then (patch->>'time')::timestamptz else t.updated_at end,
 case when patch ? 'revision' then (patch->>'revision')::bigint else t.revision end,confirmation);
end $$;
create function pg_temp.keeper_failure(n text,expected text,patch jsonb default '{}',h integer default 14,a integer default 28,confirmation boolean default false) returns void language plpgsql as $$
declare actual text;begin
 begin perform pg_temp.keeper_update(n,h,a,confirmation,patch);raise exception 'Unexpected keeper success';
 exception when others then get stacked diagnostics actual=returned_sqlstate;
 if actual<>expected then raise exception 'Wrong keeper error: expected %, got % (%)',expected,actual,sqlerrm; end if;end;
end $$;
set local role authenticated;
do $$ declare a record;begin
 for a in select * from keeper_actors where label not in('admin','moderator','keeper','opposite') loop
 perform set_config('request.jwt.claim.sub',a.id::text,true);perform pg_temp.keeper_failure('live','42501');end loop;
 perform set_config('request.jwt.claim.sub','',true);perform pg_temp.keeper_failure('live','42501');end $$;
reset role;
select set_config('request.jwt.claim.sub',(select id::text from keeper_actors where label='keeper'),true);
set local role authenticated;
select pg_temp.keeper_failure(n,'55000') from unnest(array['absent','scheduled','final','postponed','cancelled','unverified','forfeit','numeric']) n;
select pg_temp.keeper_failure('live','40001','{"time":"2000-01-01T00:00:00Z"}');
select pg_temp.keeper_failure('live','40001','{"revision":99}');
select pg_temp.keeper_failure('live','40001','{"time":null}');
select pg_temp.keeper_failure('live','22023','{"period":"half"}');
select pg_temp.keeper_failure('live','22023','{"clock":"15:01"}');
select pg_temp.keeper_failure('live','22023','{}',151);
select pg_temp.keeper_failure('live','22023','{}',13);
-- Shared private helper is not a bypass for operator, FINAL, absent, or source fields.
do $$ begin
 begin perform public.submit_trusted_score_update('__keeper_live__',14,28,'live','3rd',null,null,null,null,true);raise exception 'Keeper became operator';exception when insufficient_privilege then null;end;
 begin perform private.publish_trusted_score('__keeper_live__',14,28,'live',null,null,null,null,null,true,false,false);raise exception 'Private operator bypass';exception when insufficient_privilege then null;end;
 begin perform private.publish_trusted_score('__keeper_live__',14,28,'final',null,null,null,null,null,false,true,false);raise exception 'FINAL bypass';exception when invalid_parameter_value then null;end;
 begin perform private.publish_trusted_score('__keeper_live__',14,28,'live',null,null,null,null,null,true,true,false);raise exception 'Absent bypass';exception when invalid_parameter_value then null;end;
 begin perform private.publish_trusted_score('__keeper_live__',14,28,'live',null,null,'forged source',null,null,false,true,false);raise exception 'Source bypass';exception when invalid_parameter_value then null;end;
end $$;
select pg_temp.keeper_update();
reset role;
do $$ declare s public.score_submissions%rowtype; g public.game_state%rowtype; actor uuid; assignment_payload jsonb;begin
 select id into actor from keeper_actors where label='keeper';select * into g from public.game_state where game_id='__keeper_live__';select * into s from public.score_submissions where id=g.source_submission_id;
 if g.status<>'live' or not g.verified or g.home_score<>14 or g.away_score<>28 or g.updated_by<>actor or s.submitted_by<>actor or s.reviewed_by<>actor or s.status<>'approved' then raise exception 'Winning state/actor invalid';end if;
 if (select count(*) from public.score_submission_events where submission_id=s.id and event_type='submitted' and actor_id=actor)<>1 then raise exception 'Submitted actor invalid';end if;
 if (select count(*) from public.score_submission_events where submission_id=s.id and event_type='approved' and actor_id=actor and payload->>'publisher_bound_v1'='true')<>1 then raise exception 'Approved evidence invalid';end if;
 select e.payload into assignment_payload from public.score_submission_events e where submission_id=s.id and e.event_type='note_added';
 if assignment_payload->>'kind'<>'assigned_scorekeeper_authority_v1' or assignment_payload#>>'{authority,actor_id}'<>actor::text or assignment_payload#>>'{authority,assignment_role}'<>'scorekeeper' or assignment_payload#>>'{authority,school_slug}'<>'keeper-away' or assignment_payload#>>'{authority,active}'<>'true' then raise exception 'Assignment snapshot invalid';end if;
 if not exists(select 1 from public.public_score_states() where game_id=g.game_id and attribution_type='publisher' and attribution_username='live_keeper') then raise exception 'Keeper attribution missing';end if;
 if (select array_agg(k order by k) from jsonb_object_keys((select to_jsonb(p) from public.public_score_states() p where p.game_id=g.game_id)) k) is distinct from array['attribution_type','attribution_username','away_score','clock','game_id','home_score','kickoff_override','official_winner_school_slug','period','result_type','status','verified'] then raise exception 'Public fields changed';end if;
end $$;
do $$ begin if exists(select 1 from public.pickem_games where week_id=(select id from keeper_week) and (graded_at is not null or result_winner_school_slug is not null)) then raise exception 'LIVE keeper publication graded Pick Em';end if;end $$;
-- Stale update cannot change attribution. Direct actor/event writes remain denied.
set local role authenticated;
select pg_temp.keeper_failure('live','40001');
do $$ begin
 begin update public.game_state set updated_by=(select id from keeper_actors where label='moderator') where game_id='__keeper_live__'; if found then raise exception 'Forged state write';end if; exception when insufficient_privilege then null;end;
 begin update public.score_submissions set status='approved',reviewed_by=(select id from keeper_actors where label='moderator') where game_id='__keeper_live__';if found then raise exception 'Forged review';end if;exception when insufficient_privilege then null;end;
 begin insert into public.score_submission_events(submission_id,event_type,actor_id,payload) select id,'note_added',auth.uid(),'{"kind":"assigned_scorekeeper_authority_v1"}' from public.score_submissions where game_id='__keeper_live__';raise exception 'Forged snapshot';exception when insufficient_privilege then null;end;
end $$;
do $$ begin
 begin perform public.correct_game_score('__keeper_live__',null,0,'live',28,14,null,null,'Keeper cannot correct');raise exception 'Correction authority broadened';exception when insufficient_privilege then null;end;
 begin perform public.review_missing_score_evidence(null,'approve',null,'__keeper_live__',null,null,false,'{}',true,'played');raise exception 'Score Scout authority broadened';exception when insufficient_privilege then null;end;
end $$;
-- Generic keeper event text cannot manufacture publication corroboration.
reset role;
insert into public.score_submission_events(submission_id,event_type,actor_id,payload)
select id,'approved',auth.uid(),'{"publisher_bound_v1":true}' from public.score_submissions where game_id='__keeper_live__' and status='approved';
do $$ begin if exists(select 1 from public.score_submission_events e where event_type='approved' and payload='{"publisher_bound_v1":true}'::jsonb and submission_id in(select id from public.score_submissions where game_id='__keeper_live__')) then raise exception 'Generic keeper event corroborated';end if;end $$;
set local role authenticated;
-- Pending FINAL uses unchanged community RPC.
select * from public.submit_score_submission('__keeper_live__',14,28,'final',null,null,null);
reset role;
do $$ begin if not exists(select 1 from public.score_submissions where game_id='__keeper_live__' and game_status='final' and status='pending') then raise exception 'Pending FINAL changed';end if;end $$;
update public.profiles set username=null where id=(select id from keeper_actors where label='keeper');
do $$ begin if not exists(select 1 from public.public_score_states() where game_id='__keeper_live__' and attribution_type='publisher' and attribution_username is null) then raise exception 'Fallback broken';end if;end $$;
update public.profiles set username='renamed_keeper' where id=(select id from keeper_actors where label='keeper');
delete from public.contributor_school_assignments where user_id=(select id from keeper_actors where label='keeper');
set local role authenticated;select pg_temp.keeper_failure('live','42501');reset role;
do $$ begin if not exists(select 1 from public.public_score_states() where game_id='__keeper_live__' and attribution_username='renamed_keeper') then raise exception 'Historical assignment loss rewrote identity';end if;end $$;
-- Opposite participant authorizes the complete tuple, including confirmed decrease.
update keeper_tokens t set updated_at=g.updated_at,revision=g.score_revision from public.game_state g where t.name='live' and g.game_id='__keeper_live__';
select set_config('request.jwt.claim.sub',(select id::text from keeper_actors where label='opposite'),true);
set local role authenticated;select pg_temp.keeper_update('live',13,28,true);reset role;
-- Moderator override, then keeper stale denial, then current LIVE update allowed.
select set_config('request.jwt.claim.sub',(select id::text from keeper_actors where label='moderator'),true);
set local role authenticated;
select public.submit_trusted_score_update('__keeper_live__',21,35,'live','4th','any operator clock',null,
 (select updated_at from public.game_state where game_id='__keeper_live__'),(select score_revision from public.game_state where game_id='__keeper_live__'),false);
reset role;
do $$ begin if not exists(select 1 from public.public_score_states() where game_id='__keeper_live__' and attribution_type='publisher' and attribution_username is null) then raise exception 'Moderator did not own current attribution';end if;end $$;
select set_config('request.jwt.claim.sub',(select id::text from keeper_actors where label='opposite'),true);
set local role authenticated;select pg_temp.keeper_failure('live','40001');reset role;
update keeper_tokens t set updated_at=g.updated_at,revision=g.score_revision from public.game_state g where t.name='live' and g.game_id='__keeper_live__';
set local role authenticated;select pg_temp.keeper_update('live',21,42);reset role;
-- Inject post-publication failure to prove whole transaction rollback.
create function pg_temp.fail_keeper() returns trigger language plpgsql as $$ begin if new.game_id='__keeper_rollback__' then raise exception 'Injected rollback';end if;return new;end $$;
create trigger z_keeper_rollback after update on public.game_state for each row execute function pg_temp.fail_keeper();
set local role authenticated;
do $$ begin begin perform pg_temp.keeper_update('rollback');raise exception 'Rollback injection did not run';exception when raise_exception then if sqlerrm<>'Injected rollback' then raise;end if;end;end $$;
reset role;
do $$ begin if exists(select 1 from public.score_submissions where game_id='__keeper_rollback__') or (select away_score from public.game_state where game_id='__keeper_rollback__')<>21 then raise exception 'Partial transaction committed';end if;end $$;
select set_config('request.jwt.claim.sub',(select id::text from keeper_actors where label='admin'),true);
set local role authenticated;
select public.submit_trusted_score_update('__keeper_live__',21,42,'final',null,null,null,
 (select updated_at from public.game_state where game_id='__keeper_live__'),(select score_revision from public.game_state where game_id='__keeper_live__'),false);
reset role;
do $$ begin if not exists(select 1 from public.pickem_games where week_id=(select id from keeper_week) and graded_at is not null and result_winner_school_slug='keeper-away') then raise exception 'Operator FINAL stopped grading';end if;
 if not exists(select 1 from public.public_score_states() where game_id='__keeper_live__' and attribution_type='verified' and attribution_username is null) then raise exception 'Personal FINAL byline introduced';end if;end $$;
-- No accidental expanded RPC shape, helper grants, or table write policy.
do $$ declare args text;begin
 select pg_get_function_arguments(p.oid) into args from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='submit_assigned_scorekeeper_update';
 if args ~ '(status|school|actor|result_type|winner|kickoff|verified|submission)' then raise exception 'Unsafe public args';end if;
 if has_function_privilege('anon','public.submit_assigned_scorekeeper_update(text,integer,integer,text,text,timestamptz,bigint,boolean)','execute') or has_function_privilege('service_role','private.publish_trusted_score(text,integer,integer,text,text,text,text,timestamptz,bigint,boolean,boolean,boolean)','execute') then raise exception 'Unexpected grant';end if;
end $$;
rollback;
