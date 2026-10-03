#!/usr/bin/env bash
set -euo pipefail
# Fixed loopback disposable database; no remote parameters.
export PGPASSWORD=postgres
ops_dir=$(mktemp -d)
trap 'rm -rf "$ops_dir"' EXIT
psql_local=(psql -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 54322 -U postgres -d postgres)
node --import tsx -e 'const {fixtureSummary}=require("./lib/coverage-demand-test-fixture.ts");console.log("select public.server_record_coverage_demand_summary($summary$"+JSON.stringify({...fixtureSummary,coarse_bucket_id:"tx25-v1:c17r36"})+"$summary$::jsonb);");' > "$ops_dir/ingest.sql"
"${psql_local[@]}" -c 'begin;select pg_advisory_xact_lock(730026001);select pg_sleep(2);commit;' > "$ops_dir/lock.log" 2>&1 &
lock_pid=$!
# Wait for the isolated lock owner rather than relying on a scheduling race.
for _ in $(seq 1 50); do
 if [[ $("${psql_local[@]}" -Atc "select count(*) from pg_locks where locktype='advisory' and objid=730026001 and granted") == 1 ]]; then break; fi
 sleep 0.05
done
if "${psql_local[@]}" -c 'select public.server_maintain_coverage_demand();' > "$ops_dir/blocked.log" 2>&1; then echo 'FAIL retention ignored lock timeout';exit 1;fi
if ! grep -q 'lock timeout' "$ops_dir/blocked.log"; then cat "$ops_dir/blocked.log";exit 1;fi
wait "$lock_pid"
"${psql_local[@]}" -c 'select public.server_maintain_coverage_demand();' > "$ops_dir/retry.log"
# Simulate a short maintenance lock concurrent with ingestion, using the same advisory key.
"${psql_local[@]}" -c 'begin;select pg_advisory_xact_lock(730026001);select pg_sleep(0.3);select public.server_maintain_coverage_demand();commit;' > "$ops_dir/maintain.log" 2>&1 &
maintenance_pid=$!
pids=()
for number in $(seq 1 20); do "${psql_local[@]}" -f "$ops_dir/ingest.sql" > "$ops_dir/$number.log" 2>&1 & pids+=("$!");done
wait "$maintenance_pid"
for pid in "${pids[@]}";do wait "$pid";done
"${psql_local[@]}" <<'SQL'
do $$begin
 if (select sum(summary_count) from private.coverage_demand_daily where coarse_bucket_id='tx25-v1:c17r36')<>20 then raise exception 'Maintenance/ingestion race lost counts';end if;
end $$;
delete from private.coverage_demand_daily where coarse_bucket_id='tx25-v1:c17r36';
SQL
echo 'PASS maintenance 1s lock timeout, safe retry, short shared-lock wait and 20 concurrent ingestion increments'
# Real backlog holds the shared lock longer than the unchanged ingestion deadline.
# A timed-out ingestion must fail/roll back, while maintenance completes and a later isolated call succeeds.
"${psql_local[@]}" <<'SQL'
truncate private.coverage_demand_daily,private.coverage_demand_monthly,private.coverage_demand_season,private.coverage_demand_maintenance;
insert into private.coverage_demand_daily
select (now() at time zone 'America/Chicago')::date-30-i/7560,'tx25-v1',
 'tx25-v1:c'||(i%36-18)||'r'||(2+(i/36)%35),
 case when (i/1260)%2=0 then 'school_center' else 'browser_location' end,2026,7+(i/2520)%3,
 'locations-edc8867688bf','schedule-1692cf167930',1,jsonb_build_object('game_selected',1,'radius_expanded',0,'zero_result',0,'query_present',0,'district_only',0,'additional_filters_present',0,'current_only',0,'verified_only',0,'held_results',0,'initial_radius_50',1,'final_radius_50',1,'expansion_steps_0',1,'filter_all',1,'reason_none',1,'week_real_11_plus',1,'week_located_11_plus',1,'week_unlocated_0',1,'in_radius_6_10',1,'default_eligible_6_10',1,'returned_6_10',1,'live_0',1,'kickoff_window_0',1,'upcoming_6_10',1,'final_0',1,'other_0',1),now()
from generate_series(0,19999) i;
SQL
"${psql_local[@]}" -c 'select public.server_maintain_coverage_demand();' > "$ops_dir/backlog.log" 2>&1 &
backlog_pid=$!
for _ in $(seq 1 50); do
 if [[ $("${psql_local[@]}" -Atc "select count(*) from pg_locks where locktype='advisory' and objid=730026001 and granted") == 1 ]]; then break; fi
 sleep 0.05
done
if PGOPTIONS='-c statement_timeout=2000' "${psql_local[@]}" -f "$ops_dir/ingest.sql" > "$ops_dir/ingest-blocked.log" 2>&1; then echo 'FAIL fixture backlog did not exercise 2s ingestion contention';exit 1;fi
if ! grep -q 'statement timeout' "$ops_dir/ingest-blocked.log";then cat "$ops_dir/ingest-blocked.log";exit 1;fi
wait "$backlog_pid"
PGOPTIONS='-c statement_timeout=2000' "${psql_local[@]}" -f "$ops_dir/ingest.sql" > "$ops_dir/ingest-retry.log"
"${psql_local[@]}" <<'SQL'
do $$begin
 if (select sum(summary_count) from private.coverage_demand_daily)<>1 then raise exception 'Timed-out ingestion committed or retry lost';end if;
 if (select sum(summary_count) from private.coverage_demand_monthly)<>20000 then raise exception 'Backlog monthly duplication';end if;
 if (select sum(summary_count) from private.coverage_demand_season)<>20000 then raise exception 'Backlog season duplication';end if;
end $$;
truncate private.coverage_demand_daily,private.coverage_demand_monthly,private.coverage_demand_season,private.coverage_demand_maintenance;
SQL
echo 'PASS actual 20k retention backlog with 2s concurrent ingestion deadline: safe failure, atomic maintenance, later isolated retry with no duplicate counts'
