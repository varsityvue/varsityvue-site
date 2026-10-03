#!/usr/bin/env bash
set -euo pipefail
# Disposable local Supabase ONLY. No remote connection parameters accepted.
export PGPASSWORD=postgres
coverage_race_dir=$(mktemp -d)
trap 'rm -rf "$coverage_race_dir"' EXIT
psql_local=(psql -X -v ON_ERROR_STOP=1 -h 127.0.0.1 -p 54322 -U postgres -d postgres)
node --import tsx -e 'const {fixtureSummary}=require("./lib/coverage-demand-test-fixture.ts"); console.log("select public.server_record_coverage_demand_summary($summary$"+JSON.stringify({...fixtureSummary,coarse_bucket_id:"tx25-v1:c17r36"})+"$summary$::jsonb);");' > "$coverage_race_dir/increment.sql"
"${psql_local[@]}" -c "delete from private.coverage_demand_daily where coarse_bucket_id='tx25-v1:c17r36';"
for number in $(seq 1 20); do "${psql_local[@]}" -f "$coverage_race_dir/increment.sql" > "$coverage_race_dir/$number.log" 2>&1 & done
wait
"${psql_local[@]}" <<'SQL'
do $$ begin
 if (select sum(summary_count) from private.coverage_demand_daily where coarse_bucket_id='tx25-v1:c17r36')<>20 then raise exception 'Concurrent increment lost updates';end if;
 if (select count(*) from private.coverage_demand_daily where coarse_bucket_id='tx25-v1:c17r36')<>1 then raise exception 'Concurrent increment stored event rows';end if;
end $$;
delete from private.coverage_demand_daily where coarse_bucket_id='tx25-v1:c17r36';
SQL
