// First-party HTTP route -> real disposable local Supabase RPC -> aggregate row.
// All URLs and SQL connection parameters are hard bounded to loopback.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawn,execFileSync } from 'node:child_process';
import { fixtureSummary } from '../lib/coverage-demand-test-fixture.ts';
const vars=Object.fromEntries(readFileSync(process.env.COVERAGE_LOCAL_ENV,'utf8').trim().split('\n').filter(x=>x.includes('=')).map(x=>{const i=x.indexOf('=');return[x.slice(0,i),x.slice(i+1).replace(/^"|"$/g,'')];}));
assert.match(vars.API_URL,/^http:\/\/(127\.0\.0\.1|localhost):54321$/);assert.ok(vars.SERVICE_ROLE_KEY);assert.ok(vars.ANON_KEY);
const sql=s=>execFileSync('psql',['-X','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p','54322','-U','postgres','-d','postgres','-At','-c',s],{env:{...process.env,PGPASSWORD:'postgres'},stdio:['pipe','pipe','pipe']}).toString().trim();
const origin='http://127.0.0.1:3002', summary={...fixtureSummary,coarse_bucket_id:'tx25-v1:c16r35'};
const app=spawn('npm',['run','start','--','--hostname','127.0.0.1','--port','3002'],{detached:true,stdio:['ignore','pipe','pipe'],env:{...process.env,
 NEXT_PUBLIC_SUPABASE_URL:vars.API_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:vars.ANON_KEY,
 COVERAGE_DEMAND_ENABLED:'true',COVERAGE_DEMAND_SUPABASE_URL:vars.API_URL,COVERAGE_DEMAND_SERVICE_ROLE_KEY:vars.SERVICE_ROLE_KEY}});
let logs='';app.stdout.on('data',b=>{logs+=b;});app.stderr.on('data',b=>{logs+=b;});
const post=(body,extra={})=>fetch(origin+'/api/coverage-demand',{method:'POST',headers:{origin,'Content-Type':'application/json',...extra},body:JSON.stringify(body)});
try{
 for(let i=0;i<90;i++){try{if((await fetch(origin+'/api/coverage-demand')).status===405)break;}catch{}await new Promise(r=>setTimeout(r,500));assert.notEqual(i,89,'Local coverage HTTP server unavailable');}
 assert.equal((await post(summary,{Cookie:'fake_member_uuid=00000000-0000-4000-8000-000000000999'})).status,204);
 assert.equal((await post(summary)).status,204);
 assert.equal((await post({...summary,latitude:32.123456789})).status,400);
 assert.equal((await post({...summary,week:10})).status,400);
 assert.equal((await post(summary,{origin:'https://different.invalid'})).status,400);
 const direct=await fetch(vars.API_URL+'/rest/v1/rpc/server_record_coverage_demand_summary',{method:'POST',headers:{apikey:vars.ANON_KEY,Authorization:'Bearer '+vars.ANON_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_summary:summary})});assert.ok(direct.status>=400);
 assert.equal(sql("select count(*)||':'||sum(summary_count) from private.coverage_demand_daily where coarse_bucket_id='tx25-v1:c16r35'"),'1:2');
 const rows=sql("select row_to_json(d) from private.coverage_demand_daily d where coarse_bucket_id='tx25-v1:c16r35'");
 for(const value of ['32.123456789','-98.543210987','00000000-0000-4000-8000-000000000999',vars.SERVICE_ROLE_KEY]){assert.ok(!rows.includes(value));assert.ok(!logs.includes(value));}
 assert.ok(!logs.includes('coarse_bucket_id'));assert.ok(!logs.includes('coverage_summary'));
 console.log('PASS real HTTP -> server-only RPC -> one aggregate row/count 2; unknown GPS, unapproved week and anonymous RPC rejected; no payload/credential/identity logs');
}finally{try{process.kill(-app.pid,'SIGTERM');}catch{}sql("delete from private.coverage_demand_daily where coarse_bucket_id='tx25-v1:c16r35'");}
