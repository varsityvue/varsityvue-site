-- Run only against an isolated database. Fixtures and aggregates all roll back.
begin;
create function pg_temp.coverage_assert(ok boolean,label text) returns void language plpgsql as $$begin
 if ok is distinct from true then raise exception 'Coverage assertion failed: %',label;end if;end $$;
create function pg_temp.coverage_denied(statement text) returns void language plpgsql as $$begin
 begin execute statement;exception when insufficient_privilege then return;end;
 raise exception 'Coverage access unexpectedly allowed: %',statement;end $$;
create temp table coverage_fixture(s jsonb);
insert into coverage_fixture values ($summary${"schema_version":2,"grid_version":"tx25-v1","coarse_bucket_id":"tx25-v1:c3r22","center_source":"browser_location","season":2026,"week":7,"initial_radius_miles":50,"final_radius_miles":50,"radius_expansion_steps":0,"radius_expanded":false,"filter_scope":"all","district_only":false,"additional_filters_present":false,"current_only":false,"verified_only":false,"held_results":false,"query_present":false,"week_real_game_count":17,"week_located_game_count":17,"week_unlocated_game_count":0,"in_radius_real_game_count":7,"in_radius_default_eligible_count":7,"returned_game_count":7,"live_game_count":0,"kickoff_window_game_count":0,"upcoming_game_count":7,"final_game_count":0,"other_game_count":0,"game_selected":false,"zero_result_reason":"none","location_catalog_version":"locations-edc8867688bf","schedule_catalog_version":"schedule-1692cf167930"}$summary$::jsonb);
select pg_temp.coverage_assert(not exists(select 1 from information_schema.columns where table_schema='private'
 and table_name like 'coverage_demand_%' and column_name ~ '(latitude|longitude|user_id|profile_id|session_id|anonymous_id|device_id|(^ip$)|email|phone)'), 'no location/identity columns');
select pg_temp.coverage_assert(not exists(select 1 from information_schema.tables where table_schema in('public','private') and table_name ~ 'coverage.*(event|raw|search)'), 'no raw event table');
select pg_temp.coverage_assert((select bool_and(relrowsecurity) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='private' and c.relkind='r' and relname like 'coverage_demand_%'), 'RLS enabled');
select pg_temp.coverage_assert(private.coverage_parent('tx25-v1:c-1r10')='tx25-v1:p-1r2', 'negative floor parent');
select pg_temp.coverage_assert(not private.coverage_bucket_valid('bad') and not private.coverage_bucket_valid('tx25-v1:c-0r10'), 'invalid bucket handling');
set local role anon;
select pg_temp.coverage_denied('select * from private.coverage_demand_daily');
select pg_temp.coverage_denied('insert into private.coverage_demand_daily default values');
select pg_temp.coverage_denied('select public.server_record_coverage_demand_summary(''{}''::jsonb)');
select pg_temp.coverage_denied('select public.admin_coverage_dashboard(''week'',date ''2026-09-28'',date ''2026-10-04'')');
reset role;
set local role authenticated;
select pg_temp.coverage_denied('select * from private.coverage_demand_daily');
select pg_temp.coverage_denied('select * from private.coverage_demand_monthly');
select pg_temp.coverage_denied('select * from private.coverage_demand_season');
select pg_temp.coverage_denied('select private.record_coverage_demand_summary(''{}''::jsonb)');
select pg_temp.coverage_denied('select private.coverage_dashboard(''week'',date ''2026-10-26'',date ''2026-11-01'',date ''2026-11-01'')');
select pg_temp.coverage_denied('select public.server_record_coverage_demand_summary(''{}''::jsonb)');
reset role;
create temp table coverage_actors(label text,id uuid);
insert into coverage_actors values('admin',gen_random_uuid()),('member',gen_random_uuid());
insert into auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
select id,'00000000-0000-0000-0000-000000000000','authenticated','authenticated','coverage-'||id||'@example.invalid','!',now(),'{}','{}',now(),now() from coverage_actors;
insert into public.user_roles(user_id,role) select id,'admin' from coverage_actors where label='admin';
grant select on coverage_actors,coverage_fixture to authenticated,service_role;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from coverage_actors where label='member'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from coverage_actors where label='member'),'role','authenticated')::text,true);
select pg_temp.coverage_denied('select public.admin_coverage_dashboard(''week'',date ''2026-09-28'',date ''2026-10-04'')');
reset role;
-- Unknown fields, aliases, identity, invalid type, impossible counts and dishonest states.
do $$ declare s jsonb:=(select coverage_fixture.s from coverage_fixture);patch jsonb;begin
 for patch in select value from jsonb_array_elements('[{"lat":32},{"user_id":"x"},{"query":"text"},{"selected_game_id":"x"},{"schema_version":1},{"grid_version":"v2"},{"coarse_bucket_id":"bad"},{"season":2027},{"week":10},{"final_radius_miles":20},{"radius_expansion_steps":5},{"returned_game_count":-1},{"in_radius_real_game_count":512},{"week_located_game_count":16},{"query_present":"true"},{"game_selected":null},{"filter_scope":"unknown"},{"zero_result_reason":"coverage_gap"},{"center_source":"home"},{"district_only":"true"},{"held_results":"true"},{"other_game_count":1},{"filter_scope":"completed"}]') loop
  begin perform private.record_coverage_demand_summary(s||patch);raise exception 'Invalid summary accepted: %',patch;
  exception when sqlstate '22023' then null;end;
 end loop;
 begin perform private.record_coverage_demand_summary(s-'game_selected');raise exception 'Missing summary field accepted';exception when sqlstate '22023' then null;end;
 begin perform private.record_coverage_demand_summary(s||jsonb_build_object('extra',repeat('x',2049)));raise exception 'Oversized summary accepted';exception when sqlstate '22023' then null;end;
end $$;
-- Unified status contract: unresolved/completed rows remain bounded, LIVE excludes inferred windows.
do $$ declare s jsonb:=(select coverage_fixture.s from coverage_fixture);begin
 perform private.record_coverage_demand_summary(s||'{"filter_scope":"all","upcoming_game_count":0,"other_game_count":7}');
 perform private.record_coverage_demand_summary(s||'{"filter_scope":"completed","upcoming_game_count":0,"final_game_count":7}');
 perform private.record_coverage_demand_summary(s||'{"filter_scope":"live","held_results":true,"upcoming_game_count":0,"final_game_count":7}');
 begin perform private.record_coverage_demand_summary(s||'{"filter_scope":"live","upcoming_game_count":0,"kickoff_window_game_count":7}');raise exception 'Inferred LIVE accepted';exception when sqlstate '22023' then null;end;
end $$;
delete from private.coverage_demand_daily;
delete from private.coverage_demand_budget;
set local role service_role;
select public.server_record_coverage_demand_summary(s) from coverage_fixture;
reset role;
select pg_temp.coverage_assert((select count(*)=1 and sum(summary_count)=1 from private.coverage_demand_daily), 'one aggregate row for accepted summary');
select pg_temp.coverage_assert(not exists(select 1 from private.coverage_demand_daily d where row_to_json(d)::text ~ '(32.123456789|-98.543210987|coverage-.*@example|selected_game|user_id)'), 'rows contain no point or actor');
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from coverage_actors where label='admin'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from coverage_actors where label='admin'),'role','authenticated')::text,true);
select pg_temp.coverage_assert(public.admin_coverage_dashboard('week',date_trunc('week',now() at time zone 'America/Chicago')::date,(date_trunc('week',now() at time zone 'America/Chicago')+interval '6 days')::date)='[]'::jsonb, 'suppression at 1');
reset role;
-- Two sparse siblings (10+10) roll into one parent; a separate 19-summary parent stays hidden.
do $$ declare s jsonb:=(select coverage_fixture.s from coverage_fixture);begin
 for i in 1..9 loop perform private.record_coverage_demand_summary(s);end loop;
 for i in 1..10 loop perform private.record_coverage_demand_summary(s||'{"coarse_bucket_id":"tx25-v1:c2r22"}');end loop;
 for i in 1..19 loop perform private.record_coverage_demand_summary(s||'{"coarse_bucket_id":"tx25-v1:c8r22"}');end loop;
 for i in 1..10 loop perform private.record_coverage_demand_summary(s||'{"center_source":"school_center"}');end loop;
end $$;
select pg_temp.coverage_assert((select count(*)=4 and sum(summary_count)=49 from private.coverage_demand_daily), 'row growth aggregate not event per search');
set local role authenticated;
select pg_temp.coverage_assert(jsonb_array_length(public.admin_coverage_dashboard('week',date_trunc('week',now() at time zone 'America/Chicago')::date,(date_trunc('week',now() at time zone 'America/Chicago')+interval '6 days')::date))=1, 'parent suppression and source separation');
select pg_temp.coverage_assert((public.admin_coverage_dashboard('week',date_trunc('week',now() at time zone 'America/Chicago')::date,(date_trunc('week',now() at time zone 'America/Chicago')+interval '6 days')::date)->0->>'accepted_summary_count')::integer=20, 'parent sums siblings');
do $$ begin
 begin perform public.admin_coverage_dashboard('week',date '2026-09-29',date '2026-10-04');raise exception 'Fine reporting range accepted';exception when sqlstate '22023' then null;end;
end $$;
reset role;
select pg_temp.coverage_assert(private.coverage_safe_metrics('{"returned_0":1,"returned_1":39,"zero_result":1}',40)='{"zero_result":null}'::jsonb, 'whole histogram and small counter suppression');
-- Retention moves expired leaves exactly once; current daily rows contribute alongside coarsened history.
update private.coverage_demand_daily set report_date=(now() at time zone 'America/Chicago')::date-30 where center_source='browser_location';
select pg_temp.coverage_assert(private.retain_coverage_demand()=3, '30-day leaf expiry');
select pg_temp.coverage_assert(private.retain_coverage_demand()=0, 'idempotent rollup');
select pg_temp.coverage_assert((select sum(summary_count)=39 and count(*)=2 from private.coverage_demand_monthly), 'monthly parent-only aggregates');
select pg_temp.coverage_assert((select sum(summary_count)=39 and count(*)=2 from private.coverage_demand_season), 'season parent-only aggregates');
select pg_temp.coverage_assert((select sum(summary_count)=10 from private.coverage_demand_daily), 'unexpired daily retained');
set local role authenticated;
select pg_temp.coverage_assert(jsonb_array_length(public.admin_coverage_dashboard('season',date '2026-01-01',date '2026-12-31'))=1, 'season current and archived no duplication');
reset role;
insert into private.coverage_demand_monthly values
 ((date_trunc('month',now() at time zone 'America/Chicago')-interval '13 months')::date,'tx25-v1','tx25-v1:p4r4','browser_location',2026,20,'{}'),
 ((date_trunc('month',now() at time zone 'America/Chicago')-interval '12 months')::date,'tx25-v1','tx25-v1:p4r4','browser_location',2026,20,'{}');
select private.retain_coverage_demand();
select pg_temp.coverage_assert((select count(*)=1 from private.coverage_demand_monthly where reporting_region='tx25-v1:p4r4'), '13 calendar cohort upper retention bound');
select private.retain_coverage_demand(date '2028-02-01');
select pg_temp.coverage_assert(not exists(select 1 from private.coverage_demand_monthly) and not exists(select 1 from private.coverage_demand_season), 'long-term expiry');
-- Deterministic reporting clock is private: no public date override.
-- November 1 cutoff is October 3; September 28–October 4 must fail entirely.
delete from private.coverage_demand_daily;
delete from private.coverage_demand_monthly;
delete from private.coverage_demand_season;
insert into private.coverage_demand_daily(report_date,grid_version,coarse_bucket_id,center_source,season,week,location_catalog_version,schedule_catalog_version,summary_count,metrics)
select day,'tx25-v1','tx25-v1:c3r22','browser_location',2026,7,'locations-edc8867688bf','schedule-1692cf167930',20,
'{"returned_2_5":20,"zero_result":0,"game_selected":0}'::jsonb
from unnest(array[date '2026-10-01',date '2026-10-03',date '2026-10-20',date '2026-10-28']) day;
insert into private.coverage_demand_daily(report_date,grid_version,coarse_bucket_id,center_source,season,week,location_catalog_version,schedule_catalog_version,summary_count,metrics)
values(date '2026-10-28','tx25-v1','tx25-v1:c8r22','school_center',2026,7,'locations-edc8867688bf','schedule-1692cf167930',19,'{"returned_2_5":19}');
do $$ declare start_date date;begin
 for start_date in select unnest(array[date '2026-09-28',date '2026-09-21']) loop
  begin perform private.coverage_dashboard('week',start_date,start_date+6,date '2026-11-01');raise exception 'Truncated/expired week accepted';
  exception when sqlstate '22023' then if sqlerrm<>'Weekly reporting start precedes retained daily coverage window' then raise;end if;end;
 end loop;
 begin perform private.coverage_dashboard('week',date '2026-09-28',date '2026-10-25',date '2026-11-01');raise exception 'Truncated multiweek accepted';
 exception when sqlstate '22023' then if sqlerrm<>'Weekly reporting start precedes retained daily coverage window' then raise;end if;end;
 for start_date in select unnest(array[date '2026-11-02',date '2026-12-01',date '2027-01-01']) loop
  begin perform private.coverage_dashboard(case when start_date=date '2026-11-02' then 'week' when start_date=date '2026-12-01' then 'month' else 'season' end,
   start_date,case when start_date=date '2026-11-02' then start_date+6 when start_date=date '2026-12-01' then date '2026-12-31' else date '2027-12-31' end,date '2026-11-01');
   raise exception 'Future-only period accepted';
  exception when sqlstate '22023' then if sqlerrm<>'Future-only coverage reporting periods are not supported' then raise;end if;end;
 end loop;
end $$;
do $$ begin
 begin perform private.coverage_dashboard('week',date '2026-10-19',date '2026-11-08',date '2026-11-01');raise exception 'Mixed future week accepted';
 exception when sqlstate '22023' then if sqlerrm<>'Coverage reporting range includes future-only periods' then raise;end if;end;
 begin perform private.coverage_dashboard('month',date '2026-10-01',date '2026-12-31',date '2026-11-01');raise exception 'Mixed future month accepted';
 exception when sqlstate '22023' then if sqlerrm<>'Coverage reporting range includes future-only periods' then raise;end if;end;
end $$;
select pg_temp.coverage_assert((private.coverage_dashboard('week',date '2026-10-19',date '2026-10-25',date '2026-11-01')->0) @> '{"period_state":"completed","effective_through":"2026-10-25","reporting_as_of":"2026-11-01","accepted_summary_count":20}', 'fully retained completed week');
select pg_temp.coverage_assert((private.coverage_dashboard('week',date '2026-10-26',date '2026-11-01',date '2026-10-30')->0) @> '{"period_state":"open","period_end":"2026-11-01","effective_through":"2026-10-30","accepted_summary_count":20}', 'current open week and source suppression');
select pg_temp.coverage_assert(jsonb_array_length(private.coverage_dashboard('week',date '2026-10-26',date '2026-11-01',date '2026-10-30'))=1, '19-summary separate parent/source remains hidden');
select pg_temp.coverage_assert((private.coverage_dashboard('month',date '2026-10-01',date '2026-10-31',date '2026-10-30')->0) @> '{"period_state":"open","effective_through":"2026-10-30","accepted_summary_count":80}', 'open month before retention');
select pg_temp.coverage_assert((private.coverage_dashboard('month',date '2026-10-01',date '2026-10-31',date '2026-11-01')->0) @> '{"period_state":"completed","effective_through":"2026-10-31","accepted_summary_count":80}', 'completed month before retention');
select pg_temp.coverage_assert((private.coverage_dashboard('season',date '2026-01-01',date '2026-12-31',date '2026-11-01')->0) @> '{"period_state":"open","effective_through":"2026-11-01","accepted_summary_count":80}', 'open season before retention');
select pg_temp.coverage_assert((private.coverage_dashboard('season',date '2026-01-01',date '2026-12-31',date '2027-01-01')->0) @> '{"period_state":"completed","effective_through":"2026-12-31","accepted_summary_count":80}', 'completed season before retention');
select pg_temp.coverage_assert(private.retain_coverage_demand(date '2026-11-01')=1, 'November boundary rolls October 1 once');
select pg_temp.coverage_assert(private.retain_coverage_demand(date '2026-11-01')=0, 'November retention idempotent');
select pg_temp.coverage_assert((private.coverage_dashboard('month',date '2026-10-01',date '2026-10-31',date '2026-11-01')->0->>'accepted_summary_count')::integer=80, 'month archive plus daily exactly once');
select pg_temp.coverage_assert((private.coverage_dashboard('season',date '2026-01-01',date '2026-12-31',date '2027-01-01')->0->>'accepted_summary_count')::integer=80, 'season archive plus daily exactly once');
select pg_temp.coverage_assert((private.coverage_dashboard('week',date '2026-10-19',date '2026-10-25',date '2026-11-01')->0->>'accepted_summary_count')::integer=20, 'completed supported week stable after retention');
do $$ begin
 begin perform private.coverage_dashboard('week',date '2026-09-28',date '2026-10-04',date '2026-11-01');raise exception 'Retained fragment reported after rollup';
 exception when sqlstate '22023' then if sqlerrm<>'Weekly reporting start precedes retained daily coverage window' then raise;end if;end;
end $$;
rollback;
