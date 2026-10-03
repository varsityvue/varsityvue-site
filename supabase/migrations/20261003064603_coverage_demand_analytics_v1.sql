-- Aggregate-only analytics. This migration is not approved for production application.
-- No raw-summary/event table; JSON metrics contain only bounded histogram counters.
create table private.coverage_demand_daily (
 report_date date not null, grid_version text not null check(grid_version='tx25-v1'),
 coarse_bucket_id text not null, center_source text not null check(center_source in('browser_location','school_center')),
 season integer not null check(season=2026), week integer not null check(week in(7,8,9)),
 location_catalog_version text not null, schedule_catalog_version text not null,
 summary_count bigint not null check(summary_count>0), metrics jsonb not null,
 created_at timestamptz not null default now(),
 primary key(report_date,grid_version,coarse_bucket_id,center_source,season,week,location_catalog_version,schedule_catalog_version)
);
create table private.coverage_demand_monthly (
 report_month date not null, grid_version text not null, reporting_region text not null,
 center_source text not null check(center_source in('browser_location','school_center')), season integer not null,
 summary_count bigint not null check(summary_count>0), metrics jsonb not null,
 primary key(report_month,grid_version,reporting_region,center_source,season)
);
create table private.coverage_demand_season (
 season integer not null, grid_version text not null, reporting_region text not null,
 center_source text not null check(center_source in('browser_location','school_center')),
 summary_count bigint not null check(summary_count>0), metrics jsonb not null,
 primary key(season,grid_version,reporting_region,center_source)
);
-- A single global capacity counter. It contains no IP, device or person key.
create table private.coverage_demand_budget (
 singleton boolean primary key default true check(singleton), minute timestamptz not null, accepted integer not null check(accepted between 0 and 1200)
);
alter table private.coverage_demand_daily enable row level security;
alter table private.coverage_demand_monthly enable row level security;
alter table private.coverage_demand_season enable row level security;
alter table private.coverage_demand_budget enable row level security;
revoke all on private.coverage_demand_daily, private.coverage_demand_monthly, private.coverage_demand_season, private.coverage_demand_budget from public,anon,authenticated,service_role;

create function private.coverage_bucket_valid(p_id text) returns boolean
language plpgsql immutable set search_path='' as $$
begin
 if p_id is null or p_id !~ '^tx25-v1:c(-?(0|[1-9][0-9]?))r(0|[1-9][0-9]?)$' or p_id ~ ':c-0r' then return false;end if;
 return split_part(split_part(p_id,':c',2),'r',1)::integer between -18 and 17
 and split_part(p_id,'r',2)::integer between 2 and 36;
end $$;
alter table private.coverage_demand_daily add constraint coverage_daily_bucket_valid check(private.coverage_bucket_valid(coarse_bucket_id));
create function private.coverage_parent(p_id text) returns text
language plpgsql immutable set search_path='' as $$
begin
 if not private.coverage_bucket_valid(p_id) then raise exception using errcode='22023',message='Invalid coverage bucket';end if;
 return 'tx25-v1:p'||floor(split_part(split_part(p_id,':c',2),'r',1)::numeric/4)::integer||'r'||floor(split_part(p_id,'r',2)::numeric/4)::integer;
end $$;
create function private.coverage_merge_metrics(a jsonb,b jsonb) returns jsonb
language sql immutable set search_path='' as $$
 select coalesce(jsonb_object_agg(k,v),'{}'::jsonb) from (
 select k,sum(v::bigint) v from (select key k,value v from jsonb_each_text(a) union all select key,value from jsonb_each_text(b)) x group by k
 ) y
$$;
create function private.coverage_count_bin(n integer) returns text
language sql immutable set search_path='' as $$
 select case when n=0 then '0' when n=1 then '1' when n<=5 then '2_5' when n<=10 then '6_10' else '11_plus' end
$$;

create function private.record_coverage_demand_summary(p_summary jsonb) returns void
language plpgsql security definer set search_path='' as $$
declare
 s jsonb:=p_summary; k text; m jsonb; d date:=(now() at time zone 'America/Chicago')::date; b integer;
begin
 if s is null or jsonb_typeof(s)<>'object' or octet_length(s::text)>2048 then raise exception using errcode='22023',message='Invalid coverage summary';end if;
 if (select count(*) from jsonb_object_keys(s))<>26 or exists(select 1 from jsonb_object_keys(s) f(field) where f.field<>all(array['schema_version','grid_version','coarse_bucket_id','center_source','season','week','initial_radius_miles','final_radius_miles','radius_expansion_steps','radius_expanded','filter_scope','query_present','week_real_game_count','week_located_game_count','week_unlocated_game_count','in_radius_real_game_count','in_radius_default_eligible_count','returned_game_count','live_game_count','kickoff_window_game_count','upcoming_game_count','final_game_count','game_selected','zero_result_reason','location_catalog_version','schedule_catalog_version'])) then
 raise exception using errcode='22023',message='Invalid coverage summary fields';end if;
 for k in select unnest(array['week_real_game_count','week_located_game_count','week_unlocated_game_count','in_radius_real_game_count','in_radius_default_eligible_count','returned_game_count','live_game_count','kickoff_window_game_count','upcoming_game_count','final_game_count','schema_version','week','initial_radius_miles','final_radius_miles','radius_expansion_steps']) loop
   if jsonb_typeof(s->k)<>'number' or s->>k !~ '^[0-9]+$' or (s->>k)::numeric>512 then raise exception using errcode='22023',message='Invalid coverage number';end if;
 end loop;
 for k in select unnest(array['radius_expanded','query_present','game_selected']) loop
   if jsonb_typeof(s->k)<>'boolean' then raise exception using errcode='22023',message='Invalid coverage boolean';end if;
 end loop;
 for k in select unnest(array['grid_version','coarse_bucket_id','center_source','filter_scope','zero_result_reason','location_catalog_version','schedule_catalog_version']) loop
   if jsonb_typeof(s->k)<>'string' then raise exception using errcode='22023',message='Invalid coverage string';end if;
 end loop;
 if jsonb_typeof(s->'season')<>'number' or s->>'schema_version'<>'1' or s->>'grid_version'<>'tx25-v1' or not private.coverage_bucket_valid(s->>'coarse_bucket_id')
 or s->>'center_source' not in('browser_location','school_center') or s->>'season'<>'2026' or (s->>'week')::integer not in(7,8,9)
 or (s->>'initial_radius_miles')::integer not in(10,25,50,100,150) or (s->>'final_radius_miles')::integer not in(10,25,50,100,150)
 or (s->>'radius_expansion_steps')::integer>4 or (s->>'radius_expanded')::boolean<>((s->>'radius_expansion_steps')::integer>0)
 or ((s->>'final_radius_miles')::integer>(s->>'initial_radius_miles')::integer and not (s->>'radius_expanded')::boolean)
 or s->>'filter_scope' not in('all','live','upcoming','final','district')
 or s->>'zero_result_reason' not in('none','no_games_in_radius','status_filter_excluded','query_filter_excluded','week_unapproved','week_location_incomplete','no_real_games','other_bounded_case')
 or s->>'location_catalog_version'<>'locations-edc8867688bf' or s->>'schedule_catalog_version'<>'schedule-1692cf167930'
 or (s->>'week_real_game_count')::integer<>17 or (s->>'week_located_game_count')::integer<>17 or (s->>'week_unlocated_game_count')::integer<>0
 or (s->>'in_radius_real_game_count')::integer>(s->>'week_located_game_count')::integer
 or (s->>'in_radius_default_eligible_count')::integer>(s->>'in_radius_real_game_count')::integer
 or (s->>'returned_game_count')::integer>(s->>'in_radius_real_game_count')::integer
 or (s->>'live_game_count')::integer+(s->>'kickoff_window_game_count')::integer+(s->>'upcoming_game_count')::integer+(s->>'final_game_count')::integer<>(s->>'returned_game_count')::integer
 or ((s->>'game_selected')::boolean and (s->>'returned_game_count')::integer=0)
 or ((s->>'returned_game_count')::integer>0)<>(s->>'zero_result_reason'='none')
 or (s->>'zero_result_reason'='no_games_in_radius' and (s->>'in_radius_real_game_count')::integer<>0)
 or (s->>'zero_result_reason'='query_filter_excluded' and (not (s->>'query_present')::boolean or (s->>'in_radius_real_game_count')::integer=0))
 or (s->>'zero_result_reason'='status_filter_excluded' and (s->>'in_radius_real_game_count')::integer=0)
 or (s->>'filter_scope'='final' and (s->>'final_game_count')::integer<>(s->>'returned_game_count')::integer)
 or (s->>'filter_scope'<>'final' and ((s->>'final_game_count')::integer<>0 or (s->>'returned_game_count')::integer>(s->>'in_radius_default_eligible_count')::integer))
 or (s->>'filter_scope'='live' and (s->>'live_game_count')::integer+(s->>'kickoff_window_game_count')::integer<>(s->>'returned_game_count')::integer)
 or (s->>'filter_scope'='upcoming' and (s->>'upcoming_game_count')::integer<>(s->>'returned_game_count')::integer)
 or s->>'zero_result_reason' in('week_unapproved','week_location_incomplete','no_real_games') then
 raise exception using errcode='22023',message='Invalid coverage summary';end if;
 -- Global transaction lock also coordinates retention; no browser identity involved.
 perform pg_advisory_xact_lock(730026001);
 insert into private.coverage_demand_budget(singleton,minute,accepted) values(true,date_trunc('minute',now()),1)
 on conflict(singleton) do update set minute=excluded.minute,
 accepted=case when coverage_demand_budget.minute=excluded.minute then coverage_demand_budget.accepted+1 else 1 end
 where coverage_demand_budget.minute<>excluded.minute or coverage_demand_budget.accepted<1200 returning accepted into b;
 if b is null then raise exception using errcode='54000',message='Coverage capacity exceeded';end if;
 m:=jsonb_build_object('radius_expanded',(s->>'radius_expanded')::boolean::integer,
 'game_selected',(s->>'game_selected')::boolean::integer,'zero_result',((s->>'returned_game_count')::integer=0)::integer,
 'query_present',(s->>'query_present')::boolean::integer,
 'initial_radius_'||(s->>'initial_radius_miles'),1,'final_radius_'||(s->>'final_radius_miles'),1,
 'expansion_steps_'||(s->>'radius_expansion_steps'),1,'filter_'||(s->>'filter_scope'),1,'reason_'||(s->>'zero_result_reason'),1,
 'week_real_'||private.coverage_count_bin((s->>'week_real_game_count')::integer),1,
 'week_located_'||private.coverage_count_bin((s->>'week_located_game_count')::integer),1,
 'week_unlocated_'||private.coverage_count_bin((s->>'week_unlocated_game_count')::integer),1,
 'in_radius_'||private.coverage_count_bin((s->>'in_radius_real_game_count')::integer),1,
 'default_eligible_'||private.coverage_count_bin((s->>'in_radius_default_eligible_count')::integer),1,
 'returned_'||private.coverage_count_bin((s->>'returned_game_count')::integer),1,
 'live_'||private.coverage_count_bin((s->>'live_game_count')::integer),1,
 'kickoff_window_'||private.coverage_count_bin((s->>'kickoff_window_game_count')::integer),1,
 'upcoming_'||private.coverage_count_bin((s->>'upcoming_game_count')::integer),1,
 'final_'||private.coverage_count_bin((s->>'final_game_count')::integer),1);
 insert into private.coverage_demand_daily(report_date,grid_version,coarse_bucket_id,center_source,season,week,location_catalog_version,schedule_catalog_version,summary_count,metrics)
 values(d,s->>'grid_version',s->>'coarse_bucket_id',s->>'center_source',(s->>'season')::integer,(s->>'week')::integer,s->>'location_catalog_version',s->>'schedule_catalog_version',1,m)
 on conflict(report_date,grid_version,coarse_bucket_id,center_source,season,week,location_catalog_version,schedule_catalog_version)
 do update set summary_count=coverage_demand_daily.summary_count+1,metrics=private.coverage_merge_metrics(coverage_demand_daily.metrics,excluded.metrics);
end $$;
-- PostgREST bridge: only the trusted server credential can execute it.
create function public.server_record_coverage_demand_summary(p_summary jsonb) returns void
language sql security definer set search_path='' as $$ select private.record_coverage_demand_summary(p_summary) $$;
revoke all on function public.server_record_coverage_demand_summary(jsonb) from public,anon,authenticated;
grant execute on function public.server_record_coverage_demand_summary(jsonb) to service_role;

create function private.retain_coverage_demand(p_today date default (now() at time zone 'America/Chicago')::date)
returns integer language plpgsql security definer set search_path='' as $$
declare row private.coverage_demand_daily%rowtype; region text; moved integer:=0;
begin
 if p_today is null then raise exception using errcode='22023',message='Invalid retention date';end if;
 perform pg_advisory_xact_lock(730026001);
 for row in delete from private.coverage_demand_daily where report_date<p_today-29 returning * loop
   region:=private.coverage_parent(row.coarse_bucket_id);
   insert into private.coverage_demand_monthly values(date_trunc('month',row.report_date)::date,row.grid_version,region,row.center_source,row.season,row.summary_count,row.metrics)
   on conflict(report_month,grid_version,reporting_region,center_source,season) do update
   set summary_count=coverage_demand_monthly.summary_count+excluded.summary_count,metrics=private.coverage_merge_metrics(coverage_demand_monthly.metrics,excluded.metrics);
   insert into private.coverage_demand_season values(row.season,row.grid_version,region,row.center_source,row.summary_count,row.metrics)
   on conflict(season,grid_version,reporting_region,center_source) do update
   set summary_count=coverage_demand_season.summary_count+excluded.summary_count,metrics=private.coverage_merge_metrics(coverage_demand_season.metrics,excluded.metrics);
   moved:=moved+1;
 end loop;
 delete from private.coverage_demand_monthly where report_month<(date_trunc('month',p_today)-interval '12 months')::date;
 delete from private.coverage_demand_season where make_date(season+2,2,1)<=p_today;
 return moved;
end $$;
create function public.server_retain_coverage_demand() returns integer
language sql security definer set search_path='' as $$ select private.retain_coverage_demand() $$;
revoke all on function public.server_retain_coverage_demand() from public,anon,authenticated;
grant execute on function public.server_retain_coverage_demand() to service_role;

-- Suppress whole histogram families, not just a small bin whose value is recoverable by subtraction.
create function private.coverage_safe_metrics(m jsonb,total bigint) returns jsonb
language plpgsql immutable set search_path='' as $$
declare result jsonb:='{}'; k text; v bigint; prefix text; unsafe boolean;
begin
 for k,v in select key,value::bigint from jsonb_each_text(m) loop
   if k in('radius_expanded','game_selected','zero_result','query_present') then
     result:=result||jsonb_build_object(k,case when (v=0 or v>=20) and (total-v=0 or total-v>=20) then v else null end);
   else
     prefix:=regexp_replace(k,'_(0|1|2_5|6_10|11_plus|10|25|50|100|150|2|3|4)$','');
     if k like 'reason_%' then prefix:='reason';elsif k like 'filter_%' then prefix:='filter';end if;
     select exists(select 1 from jsonb_each_text(m) e where e.key like prefix||'\_%' escape '\'
       and ((e.value::bigint between 1 and 19) or (total-e.value::bigint between 1 and 19))) into unsafe;
     if not unsafe then result:=result||jsonb_build_object(k,v);end if;
   end if;
 end loop;
 return result;
end $$;

create function private.coverage_dashboard(p_kind text,p_from date,p_to date,p_today date)
returns jsonb language plpgsql stable set search_path='' as $$
declare output jsonb;
begin
 if p_today is null then raise exception using errcode='22023',message='Invalid coverage reporting date';end if;
 if p_kind is null or p_kind not in('week','month','season') or p_from is null or p_to is null or p_from>p_to
 or p_to-p_from>400 or p_from<'2026-01-01' then raise exception using errcode='22023',message='Invalid coverage reporting range';end if;
 -- Entire fixed periods only. No fine time slicing, caller-selected source/filter or leaf override.
 if p_kind='week' and (extract(isodow from p_from)<>1 or extract(isodow from p_to)<>7 or p_to-p_from>27)
 or p_kind='month' and (p_from<>date_trunc('month',p_from)::date or p_to<>(date_trunc('month',p_to)+interval '1 month - 1 day')::date)
 or p_kind='season' and (p_from<>make_date(extract(year from p_from)::integer,1,1) or p_to<>make_date(extract(year from p_from)::integer,12,31)) then
 raise exception using errcode='22023',message='Reporting requires complete fixed periods';end if;
 if p_from>p_today then raise exception using errcode='22023',message='Future-only coverage reporting periods are not supported';end if;
 if p_kind='week' and p_from<p_today-29 then
 raise exception using errcode='22023',message='Weekly reporting start precedes retained daily coverage window';end if;
 with source as (
 select case p_kind when 'week' then date_trunc('week',d.report_date)::date when 'month' then date_trunc('month',d.report_date)::date else make_date(d.season,1,1) end period,
 d.grid_version,private.coverage_parent(d.coarse_bucket_id) region,d.center_source,d.season,d.summary_count,d.metrics
 from private.coverage_demand_daily d where d.report_date between p_from and least(p_to,p_today)
 and (p_kind='week' and d.report_date>=p_today-29
 or p_kind='month' and d.report_date>=(date_trunc('month',p_today)-interval '12 months')::date
 or p_kind='season' and make_date(d.season+2,2,1)>p_today)
 union all
 select m.report_month,m.grid_version,m.reporting_region,m.center_source,m.season,m.summary_count,m.metrics from private.coverage_demand_monthly m
 where p_kind='month' and m.report_month between p_from and least(p_to,p_today)
 and m.report_month>=(date_trunc('month',p_today)-interval '12 months')::date
 union all
 select make_date(s.season,1,1),s.grid_version,s.reporting_region,s.center_source,s.season,s.summary_count,s.metrics from private.coverage_demand_season s
 where p_kind='season' and make_date(s.season,1,1)=p_from and make_date(s.season+2,2,1)>p_today
 ), period_rows as (
 select distinct period,
 case p_kind when 'week' then period+6 when 'month' then (period+interval '1 month - 1 day')::date else make_date(extract(year from period)::integer,12,31) end period_end
 from source
 ), totals as (
 select period,grid_version,region,center_source,season,sum(summary_count)::bigint total
 from source group by period,grid_version,region,center_source,season having sum(summary_count)>=20
 ), expanded as (
 select period,grid_version,region,center_source,season,e.key,sum(e.value::bigint)::bigint value
 from source cross join lateral jsonb_each_text(metrics) e group by period,grid_version,region,center_source,season,e.key
 ), merged as (
 select period,grid_version,region,center_source,season,jsonb_object_agg(key,value) metrics from expanded
 group by period,grid_version,region,center_source,season
 )
 select coalesce(jsonb_agg(jsonb_build_object('period',t.period,'period_kind',p_kind,'grid_version',t.grid_version,'reporting_region',t.region,
 'period_end',p.period_end,'period_state',case when p.period_end<p_today then 'completed' else 'open' end,
 'reporting_as_of',p_today,'effective_through',least(p.period_end,p_today),
 'center_source',t.center_source,'season',t.season,'accepted_summary_count',t.total,'metrics',private.coverage_safe_metrics(m.metrics,t.total))
 order by t.period,t.region,t.center_source),'[]'::jsonb) into output from totals t join merged m using(period,grid_version,region,center_source,season) join period_rows p using(period);
 return output;
end $$;
-- Deterministic date argument is private/test-only, never a browser reporting override.
revoke all on function private.coverage_dashboard(text,date,date,date) from public,anon,authenticated,service_role;
create function public.admin_coverage_dashboard(p_kind text,p_from date,p_to date)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.is_active_member(auth.uid()) or not private.has_role('admin'::public.user_role) then
 raise exception using errcode='42501',message='Active administrator access required';end if;
 return private.coverage_dashboard(p_kind,p_from,p_to,(now() at time zone 'America/Chicago')::date);
end $$;
revoke all on function public.admin_coverage_dashboard(text,date,date) from public,anon;
grant execute on function public.admin_coverage_dashboard(text,date,date) to authenticated;

revoke all on function private.coverage_bucket_valid(text) from public,anon,authenticated,service_role;
revoke all on function private.coverage_parent(text) from public,anon,authenticated,service_role;
revoke all on function private.coverage_merge_metrics(jsonb,jsonb) from public,anon,authenticated,service_role;
revoke all on function private.coverage_count_bin(integer) from public,anon,authenticated,service_role;
revoke all on function private.record_coverage_demand_summary(jsonb) from public,anon,authenticated,service_role;
revoke all on function private.retain_coverage_demand(date) from public,anon,authenticated,service_role;
revoke all on function private.coverage_safe_metrics(jsonb,bigint) from public,anon,authenticated,service_role;
