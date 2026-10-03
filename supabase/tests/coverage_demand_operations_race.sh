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
if ! rg -q 'lock timeout' "$ops_dir/blocked.log"; then cat "$ops_dir/blocked.log";exit 1;fi
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
