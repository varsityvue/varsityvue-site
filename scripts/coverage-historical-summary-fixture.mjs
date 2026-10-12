// Test-only payload for the immutable, pre-reconciliation database contract.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const sql=readFileSync(new URL('../supabase/tests/coverage_demand_analytics.sql',import.meta.url),'utf8');
const matches=[...sql.matchAll(/insert into coverage_fixture values \(\$summary\$(.*?)\$summary\$::jsonb\);/g)];
assert.equal(matches.length,1);
const summary=JSON.parse(matches[0][1]);
assert.equal(Object.keys(summary).length,32);
assert.equal(summary.location_catalog_version,'locations-edc8867688bf');
assert.equal(summary.schedule_catalog_version,'schedule-b0c0555adaf6');
assert.equal(summary.week_real_game_count,17);
assert.equal(summary.week_located_game_count,17);
console.log('select public.server_record_coverage_demand_summary($summary$'+JSON.stringify({...summary,coarse_bucket_id:'tx25-v1:c17r36'})+'$summary$::jsonb);');
