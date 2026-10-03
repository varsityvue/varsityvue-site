-- Draft operational preparation only. No scheduler, extensions or role configuration changes.
create table private.coverage_demand_maintenance (
 singleton boolean primary key default true check(singleton),
 reporting_date date not null, completed_at timestamptz not null,
 moved_rows integer not null check(moved_rows>=0),
 postconditions text not null check(postconditions='passed')
);
alter table private.coverage_demand_maintenance enable row level security;
revoke all on private.coverage_demand_maintenance from public,anon,authenticated,service_role;

-- Testable clock remains private and revoked. Public bridge has no arguments.
create function private.maintain_coverage_demand(p_today date)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 moved integer; stamp timestamptz; previous private.coverage_demand_maintenance%rowtype;
 expected_month bigint; expected_season bigint; expected_rows bigint;
 month_cutoff date := (date_trunc('month',p_today)-interval '12 months')::date;
begin
 if p_today is null or p_today<>(now() at time zone 'America/Chicago')::date then raise exception using errcode='22023',message='Invalid maintenance date'; end if;
 perform pg_advisory_xact_lock(730026001);
 select * into previous from private.coverage_demand_maintenance where singleton;
 -- Check expiry even on repeats: a corrupted/late inserted expired row cannot hide behind status.
 if previous.reporting_date=p_today
 and not exists(select 1 from private.coverage_demand_daily where report_date<p_today-29)
 and not exists(select 1 from private.coverage_demand_monthly where report_month<month_cutoff)
 and not exists(select 1 from private.coverage_demand_season where make_date(season+2,2,1)<=p_today) then
  return jsonb_build_object('reporting_date',previous.reporting_date,'completed_at',previous.completed_at,
   'moved_rows',previous.moved_rows,'postconditions',previous.postconditions,'skipped',true);
 end if;
 select count(*) into expected_rows from private.coverage_demand_daily where report_date<p_today-29;
 select coalesce(sum(summary_count),0) into expected_month from (
  select summary_count from private.coverage_demand_monthly where report_month>=month_cutoff
  union all select summary_count from private.coverage_demand_daily where report_date<p_today-29 and date_trunc('month',report_date)::date>=month_cutoff
 ) x;
 select coalesce(sum(summary_count),0) into expected_season from (
  select summary_count from private.coverage_demand_season where make_date(season+2,2,1)>p_today
  union all select summary_count from private.coverage_demand_daily where report_date<p_today-29 and make_date(season+2,2,1)>p_today
 ) x;
 -- Existing released RPC owns rollup/deletion. Both it and ingestion share this transaction lock.
 moved := public.server_retain_coverage_demand();
 -- Public RPC uses the actual Central date. Private deterministic tests call this helper only
 -- with that date; expiry-date scenarios use the released deterministic retention helper.
 if p_today<>(now() at time zone 'America/Chicago')::date then
  raise exception using errcode='22023',message='Maintenance clock must match database Central date';
 end if;
 if moved<>expected_rows
 or exists(select 1 from private.coverage_demand_daily where report_date<p_today-29)
 or exists(select 1 from private.coverage_demand_monthly where report_month<month_cutoff)
 or exists(select 1 from private.coverage_demand_season where make_date(season+2,2,1)<=p_today)
 or (select coalesce(sum(summary_count),0) from private.coverage_demand_monthly)<>expected_month
 or (select coalesce(sum(summary_count),0) from private.coverage_demand_season)<>expected_season then
  raise exception using errcode='23514',message='Coverage maintenance postconditions failed';
 end if;
 stamp:=clock_timestamp();
 insert into private.coverage_demand_maintenance values(true,p_today,stamp,moved,'passed')
 on conflict(singleton) do update set reporting_date=excluded.reporting_date,completed_at=excluded.completed_at,
 moved_rows=excluded.moved_rows,postconditions=excluded.postconditions;
 return jsonb_build_object('reporting_date',p_today,'completed_at',stamp,'moved_rows',moved,'postconditions','passed','skipped',false);
end $$;
revoke all on function private.maintain_coverage_demand(date) from public,anon,authenticated,service_role;

create function public.server_maintain_coverage_demand() returns jsonb
language sql security definer set search_path='' set statement_timeout='40s' set lock_timeout='1s' as $$
 select private.maintain_coverage_demand((now() at time zone 'America/Chicago')::date)
$$;
revoke all on function public.server_maintain_coverage_demand() from public,anon,authenticated;
grant execute on function public.server_maintain_coverage_demand() to service_role;
