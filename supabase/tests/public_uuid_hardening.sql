-- Disposable fixtures only. This suite never targets production; all data rolls back.
begin;
create temp table uuid_actors(label text,id uuid);
insert into uuid_actors select label,('00000000-0000-4000-8000-0000000008'||lpad(n::text,2,'0'))::uuid
from unnest(array['member','other','admin','moderator','keeper']) with ordinality x(label,n);
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',label||'-uuid@example.invalid','!',now(),'{}','{}',now(),now() from uuid_actors;
insert into public.user_roles(user_id,role) select id,label::public.user_role from uuid_actors where label in('admin','moderator');
insert into public.user_roles(user_id,role) select id,'scorekeeper' from uuid_actors where label='keeper';
update public.profiles p set username='uuid_'||a.label,display_name=a.label from uuid_actors a where p.id=a.id;
insert into private.canonical_game_identity values('__uuid_game__','uuid-away','uuid-home');
insert into public.game_state(game_id,status,home_score,away_score,verified,updated_by)
select '__uuid_game__','live',7,0,true,id from uuid_actors where label='admin';
insert into public.score_submissions(game_id,submitted_by,home_score,away_score,game_status,review_note)
select '__uuid_game__',id,7,0,'live','PRIVATE REVIEW NOTE' from uuid_actors where label in('member','keeper');
insert into public.score_submission_events(submission_id,event_type,actor_id,payload)
select s.id,'note_added',s.submitted_by,jsonb_build_object('kind','assigned_scorekeeper_authority_v1','private','fixture')
from public.score_submissions s where s.game_id='__uuid_game__';
insert into public.pickem_member_totals(season,user_id,graded_picks,correct_picks,incorrect_picks)
select 2095,id,case when label='other' then 8 else 6 end,6,case when label='other' then 2 else 0 end
from uuid_actors where label in('member','other','keeper');
insert into public.school_follows(user_id,school_slug,source_surface)
select id,'uuid-away','account' from uuid_actors where label in('member','other');
insert into public.contributor_school_assignments(user_id,school_slug,assignment_role,active,assigned_by)
select id,'uuid-away','scorekeeper',true,(select id from uuid_actors where label='admin') from uuid_actors where label='keeper';
insert into public.team_feed_posts(id,primary_school_id,source_type,status,caption,published_at,created_by)
values('00000000-0000-4000-8000-000000000899','stephenville','varsityvue','published','UUID fixture',now()-interval '1 hour',(select id from uuid_actors where label='admin'));
insert into public.school_roster_players(school_slug,season,first_name,last_name,active,created_by)
values('uuid-away',2095,'Fixture','Player',true,(select id from uuid_actors where label='admin'));
grant select on uuid_actors to anon,authenticated;
create function pg_temp.assert_true(ok boolean,label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %',label; end if;end $$;
create function pg_temp.denied(statement text,label text) returns void language plpgsql as $$
begin
 begin execute statement; exception when insufficient_privilege then return; when raise_exception then if sqlerrm='Admin access required' then return; else raise; end if; end;
 raise exception 'FAIL expected 42501: %',label;
end $$;
-- Compare ranking and ordering with the legacy authoritative expression, including ties.
select pg_temp.assert_true(
 (select array_agg(display_name order by ordinal) from public.public_pickem_season_standings(2095))=
 (select array_agg(p.display_name order by t.correct_picks desc,round(100.0*t.correct_picks/t.graded_picks,1) desc,t.user_id)
 from public.pickem_member_totals t join public.profiles p on p.id=t.user_id where t.season=2095),'season ordering preserved');
select pg_temp.assert_true((select bool_and(rank=1) from public.public_pickem_season_standings(2095)),'shared point ranks');
-- No generic UUID-bearing public replacement or wildcard bypass.
set local role anon;
select pg_temp.denied('select id from public.profiles','anon profile ID');
select pg_temp.denied('select * from public.profiles','anon profile wildcard');
select pg_temp.denied('select updated_by from public.game_state','anon scoring actor');
select pg_temp.denied('select source_submission_id from public.game_state','anon source');
select pg_temp.denied('select * from public.game_state','anon score wildcard');
select pg_temp.denied('select user_id from public.pickem_member_totals','anon raw totals');
select pg_temp.denied('select * from public.pickem_standings','legacy season bypass');
select pg_temp.denied('select * from public.pickem_week_standings','legacy weekly bypass');
select pg_temp.denied('select created_by from public.team_feed_posts','feed creator');
select pg_temp.denied('select * from public.team_feed_posts','feed wildcard');
select pg_temp.denied('select created_by from public.school_roster_players','roster creator');
select pg_temp.denied('select created_by from public.pickem_weeks','week creator');
select pg_temp.denied('select * from public.internal_pickem_weeks','anon full configuration');
select pg_temp.denied('select * from private.pickem_entrant_phones','private phones');
select pg_temp.assert_true((select count(*) from public.public_game_state where game_id='__uuid_game__')=1,'public scores');
select pg_temp.assert_true((select count(*) from public.team_feed_posts where caption='UUID fixture')=1,'feed explicit safe fields');
select pg_temp.assert_true((select count(*) from public.school_roster_players where school_slug='uuid-away')=1,'roster explicit fields');
select pg_temp.denied('select * from public.score_submission_events','anon raw events');
select pg_temp.assert_true((select count(*) from public.public_pickem_season_standings(2095))=3,'public contextual identities');
select pg_temp.assert_true(not exists(select 1 from public.public_pickem_season_standings(2095) s where to_jsonb(s)?'user_id'),'public rank shape');
select pg_temp.denied('select * from public.own_score_report_status()','anon report RPC');
reset role;
select set_config('request.jwt.claim.sub',(select id::text from uuid_actors where label='member'),true);
set local role authenticated;
select pg_temp.assert_true((select count(*) from public.profiles)=1,'owner profile only');
select pg_temp.assert_true((select count(*) from public.pickem_member_totals where season=2095)=1,'owner totals only');
select pg_temp.assert_true((select season_rank from public.own_pickem_season_summary(2095))=1,'own rank aggregate');
select pg_temp.assert_true((select count(*) from public.score_submission_events)=0,'report owner raw events denied');
select pg_temp.assert_true((select count(*) from public.internal_score_submissions)=0,'member review view denied');
select pg_temp.assert_true((select count(*) from public.internal_pickem_weeks)=0,'member full configuration denied');
select pg_temp.assert_true((select count(*) from public.game_state)=0,'member actor base rows denied');
select pg_temp.denied('select reviewed_by from public.score_submissions','owner reviewer identity');
select pg_temp.denied('select review_note from public.score_submissions','owner private review note');
select pg_temp.denied('select * from public.score_submissions','owner wildcard');
select pg_temp.assert_true((select count(*) from public.own_score_report_status())=1,'sanitized owner status');
select pg_temp.assert_true(not exists(select 1 from public.own_score_report_status() s where to_jsonb(s)?|array['reviewed_by','review_note','payload','submitted_by']),'owner status shape');
select pg_temp.assert_true((select count(*) from public.school_follows)=1,'own follows');
select pg_temp.assert_true((select count(*) from public.contributor_school_assignments)=0,'other assignments denied');
select pg_temp.denied('select public.admin_conversion_dashboard(30)','member general report denied');
select pg_temp.denied('select public.admin_pickem_conversion_report(2026)','member cash report denied');
select pg_temp.denied('select * from public.internal_pickem_week_standings(null)','member internal leaderboard denied');
select pg_temp.denied('select public.internal_publication_provenance(''game'',''__uuid_game__'')','member provenance denied');
-- Unchanged community invoker still INSERTs/returns its own object ID/status.
select * from public.submit_score_submission('__uuid_game__',14,0,'live','1st','10:00',null);
select pg_temp.assert_true((select count(*) from public.own_score_report_status())=2,'community pending status preserved');
reset role;
select set_config('request.jwt.claim.sub',(select id::text from uuid_actors where label='keeper'),true);
set local role authenticated;
select pg_temp.assert_true((select count(*) from public.score_submission_events)=0,'keeper private authority events denied');
select pg_temp.assert_true((select count(*) from public.contributor_school_assignments)=1,'keeper own assignment');
select pg_temp.assert_true((select count(*) from public.public_game_state where game_id='__uuid_game__')=1,'keeper expected state accessible');
reset role;
select set_config('request.jwt.claim.sub',(select id::text from uuid_actors where label='moderator'),true);
set local role authenticated;
select pg_temp.assert_true((select count(*) from public.profiles)>=5,'moderator profile access');
select pg_temp.assert_true((select count(*) from public.internal_score_submissions where game_id='__uuid_game__')=3,'moderator review access');
select pg_temp.assert_true((select count(*) from public.score_submission_events)>0,'moderator raw events');
select pg_temp.assert_true(public.internal_publication_provenance('game','__uuid_game__')?'updated_by','internal provenance preserved');
reset role;
select set_config('request.jwt.claim.sub',(select id::text from uuid_actors where label='admin'),true);
set local role authenticated;
select pg_temp.assert_true((select count(*) from public.score_submission_events)>0,'admin raw events');
reset role;
-- Effective grants and function properties, not just rendered payloads.
select pg_temp.assert_true(not has_table_privilege('authenticated','public.score_submission_events','INSERT'),'event insert grant removed');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.score_submission_events','UPDATE'),'event update grant removed');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.score_submission_events','DELETE'),'event delete grant removed');
select pg_temp.assert_true(not has_table_privilege('authenticated','public.score_submission_events','TRUNCATE'),'event truncate grant removed');
select pg_temp.assert_true(has_table_privilege('service_role','public.profiles','SELECT') and has_table_privilege('service_role','public.game_state','SELECT'),'server reads preserved');
select pg_temp.assert_true(not has_column_privilege('anon','public.game_state','updated_by','SELECT'),'effective actor grant');
select pg_temp.assert_true(not has_column_privilege('authenticated','public.team_feed_posts','created_by','SELECT'),'effective feed actor grant');
select pg_temp.assert_true(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in('public_pickem_season_standings','public_pickem_week_standings','own_pickem_season_summary','own_score_report_status','internal_pickem_week_standings','internal_publication_provenance') and (not p.prosecdef or p.proconfig is distinct from array['search_path=""'])),'fixed definer contracts');
rollback;
