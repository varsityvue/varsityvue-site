// Synthetic local test server only; never inherits an application remote fallback.
import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
const local=JSON.parse(execFileSync('supabase',['status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
assert.equal(new URL(local.API_URL).hostname,'127.0.0.1');
const disabled=process.argv.includes('--disabled'),port=disabled?'3101':'3100';
const child=spawn('npm',['run',process.argv.includes('--built')?'start':'dev','--','--hostname','127.0.0.1','--port',port],{env:{...process.env,ENABLE_INTERNAL_TOOLS:disabled?'true':'false',ENABLE_DATA_INGESTION:disabled?'false':'true',INGESTION_BACKEND:'local',INGESTION_ORIGIN:`http://127.0.0.1:${port}`,INGESTION_SUPABASE_URL:local.API_URL,INGESTION_SUPABASE_PUBLISHABLE_KEY:local.ANON_KEY,NEXT_PUBLIC_SUPABASE_URL:local.API_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:local.ANON_KEY,INGESTION_SERVICE_KEY:local.SERVICE_ROLE_KEY,NEXT_PUBLIC_TURNSTILE_SITE_KEY:'',NEXT_TELEMETRY_DISABLED:'1'},stdio:'inherit'});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??1));
