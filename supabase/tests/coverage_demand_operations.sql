-- Fresh disposable database only; all fixtures roll back. No caller-selected production date.
begin;
create function pg_temp.ops_assert(ok boolean,label text) returns void language plpgsql as $$begin
 if ok is distinct from true then raise exception 'Operations assertion failed: %',label;end if;end $$;
select pg_temp.ops_assert(not has_function_privilege('anon','public.server_maintain_coverage_demand()','execute'),'anon RPC denied');
select pg_temp.ops_assert(not has_function_privilege('authenticated','public.server_maintain_coverage_demand()','execute'),'member RPC denied');
select pg_temp.ops_assert(has_function_privilege('service_role','public.server_maintain_coverage_demand()','execute'),'service RPC allowed');
select pg_temp.ops_assert(not has_table_privilege('service_role','private.coverage_demand_maintenance','select'),'direct status denied');
select pg_temp.ops_assert(not has_function_privilege('service_role','private.maintain_coverage_demand(date)','execute'),'caller clock denied');
select pg_temp.ops_assert((select relrowsecurity from pg_class where oid='private.coverage_demand_maintenance'::regclass),'status RLS');
truncate private.coverage_demand_daily,private.coverage_demand_monthly,private.coverage_demand_season,private.coverage_demand_maintenance;
-- Full distinct grid/source/week keys across three expired Central dates: realistic outage backlog.
insert into private.coverage_demand_daily
select (now() at time zone 'America/Chicago')::date-30-i/7560,'tx25-v1',
 'tx25-v1:c'||(i%36-18)||'r'||(2+(i/36)%35),
 case when (i/1260)%2=0 then 'school_center' else 'browser_location' end,2026,7+(i/2520)%3,
 'locations-edc8867688bf','schedule-1692cf167930',1,jsonb_build_object('game_selected',1),now()
from generate_series(0,19999) i;
\timing on
create temp table ops_first as select public.server_maintain_coverage_demand() as r;
\timing off
select pg_temp.ops_assert((select (r->>'moved_rows')::int=20000 and r->>'postconditions'='passed' and r->>'skipped'='false' from ops_first),'20k backlog maintained');
select pg_temp.ops_assert((select count(*)=0 from private.coverage_demand_daily),'expiry deleted');
select pg_temp.ops_assert((select sum(summary_count)=20000 and sum((metrics->>'game_selected')::bigint)=20000 from private.coverage_demand_monthly),'monthly counts/metrics exactly once');
select pg_temp.ops_assert((select sum(summary_count)=20000 and sum((metrics->>'game_selected')::bigint)=20000 from private.coverage_demand_season),'season independent counts/metrics exactly once');
select pg_temp.ops_assert((select count(*)=1 and min(reporting_date)=(now() at time zone 'America/Chicago')::date from private.coverage_demand_maintenance),'one actual Central status');
select pg_temp.ops_assert(public.server_maintain_coverage_demand()->>'skipped'='true','uncertain-response retry skips committed work');
select pg_temp.ops_assert((select sum(summary_count)=20000 from private.coverage_demand_monthly),'repeat no archive duplication');
-- Fault injection modifies archive count within maintenance. Postcondition failure must roll everything back.
create function pg_temp.corrupt_archive() returns trigger language plpgsql as $$begin new.summary_count:=new.summary_count+1;return new;end $$;
create trigger ops_fault before insert or update on private.coverage_demand_monthly for each row execute function pg_temp.corrupt_archive();
insert into private.coverage_demand_daily values((now() at time zone 'America/Chicago')::date-40,'tx25-v1','tx25-v1:c3r22','school_center',2026,7,'locations-edc8867688bf','schedule-1692cf167930',2,'{"game_selected":2}',now());
do $$begin
 begin perform public.server_maintain_coverage_demand();raise exception 'Fault accepted';
 exception when check_violation then if sqlerrm<>'Coverage maintenance postconditions failed' then raise;end if;end;
end $$;
select pg_temp.ops_assert((select sum(summary_count)=2 from private.coverage_demand_daily),'failed deletion rolled back');
select pg_temp.ops_assert((select sum(summary_count)=20000 from private.coverage_demand_monthly),'failed archive rolled back');
select pg_temp.ops_assert((select moved_rows=20000 and completed_at=(select (r->>'completed_at')::timestamptz from ops_first) from private.coverage_demand_maintenance),'failed status untouched');
drop trigger ops_fault on private.coverage_demand_monthly;
select pg_temp.ops_assert((public.server_maintain_coverage_demand()->>'moved_rows')::int=1,'retry after failed postconditions succeeds');
select pg_temp.ops_assert((select sum(summary_count)=20002 from private.coverage_demand_monthly),'retry no loss/duplication');
select pg_temp.ops_assert(public.server_maintain_coverage_demand()->>'skipped'='true','second successful repeat safe');
rollback;
