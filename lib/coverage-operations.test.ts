import test from "node:test";
import assert from "node:assert/strict";
import { heartbeat, ingestionHealth, runRetention, validHeartbeatUrl } from "./coverage-operations";
import { readFileSync } from "node:fs";
const target="https://hc-ping.com/00000000-0000-0000-0000-000000000000";
const result={reporting_date:"2026-10-03",completed_at:"2026-10-03T08:00:00Z",moved_rows:12,postconditions:"passed",skipped:false};
const request=(suffix="",secret="fixture")=>new Request("https://test.invalid/api/cron/coverage-demand-retention"+suffix,{headers:{authorization:`Bearer ${secret}`}});
const config={secret:"fixture",enabled:true,configured:true};
test("retention authentication, strict input, absent config and invalid results fail safely",async()=>{
 let calls=0;const retain=async()=>{calls++;return result;};const ping=async()=>true;
 for(const cfg of [{...config,secret:undefined},config])assert.equal((await runRetention(request("","bad"),cfg,retain,ping)).status,401);
 assert.equal((await runRetention(request("?today=2027-01-01"),config,retain,ping)).status,400);
 assert.equal((await runRetention(request(),{...config,enabled:false},retain,ping)).status,503);
 assert.equal((await runRetention(request(),{...config,configured:false},retain,ping)).status,503);assert.equal(calls,0);
 assert.equal((await runRetention(request(),config,async()=>({...result,secret:"bad"}),ping)).status,503);
 assert.equal((await runRetention(request(),config,retain,ping)).status,200);assert.equal(calls,1);
});
test("heartbeat failure cannot undo maintenance; uncertain delivery retries, recovery and strict redacted response",async()=>{
 const signals:string[]=[];let work=0;
 const retain=async()=>{work++;return {...result,skipped:work>1};};
 const fail=async(s:string)=>{signals.push(s);throw Error('sensitive provider error');};
 const first=await runRetention(request(),config,retain,fail);assert.equal(first.status,502);
 assert.deepEqual(await first.json(),{state:"completed_monitor_failed"});assert.equal(work,1);
 assert.equal((await runRetention(request(),config,retain,async s=>{signals.push(s);return true;})).status,200);assert.equal(work,2);
 assert.equal((await runRetention(request(),config,async()=>{throw Error('uncertain');},async s=>{signals.push(s);return true;})).status,503);
 assert.deepEqual(signals,['success','success','fail']);
});
test("monitor adapter restricts destination and emits empty bounded signals with no redirects or credentials",async()=>{
 for(const url of [undefined,'https://evil.invalid/a',target+'?secret=x',target+'/start',target+'#x',target.replace('https:','http:'),target.replace('hc-ping.com','user@hc-ping.com')])assert.equal(validHeartbeatUrl(url),false);
 const send:typeof fetch=async(url,init)=>{assert.equal(String(url),target+'/fail');assert.equal(init?.body,'');assert.equal(init?.credentials,'omit');assert.equal(init?.redirect,'error');assert.ok(init?.signal);return new Response(null,{status:200});};
 assert.equal(await heartbeat(target,'fail',send),true);
 assert.equal(await heartbeat(target,'success',async()=>{throw Error('secret');}),false);
});
test("bounded ingestion totals detect sustained failures, retry notification and recover; inactivity never alerts",async()=>{
 let now=0;const health=ingestionHealth(()=>now);const signals:string[]=[];let delivery=false;
 const ping=async(s:string)=>{signals.push(s);return delivery;};
 for(let i=0;i<4;i++)await health('database_failure',ping);assert.deepEqual(signals,[]);
 await health('capacity_failure',ping);assert.deepEqual(signals,['fail']);
 delivery=true;now=60000;await health('database_failure',ping);assert.deepEqual(signals,['fail','fail']);
 now=300000;for(let i=0;i<3;i++)await health('accepted',ping);assert.deepEqual(signals,['fail','fail','success']);
 now=900000;await health('accepted',ping);assert.equal(signals.length,3);
});
test("operations have no sensitive console logs, public status route, active schedule or client secret reference",()=>{
 for(const file of ['lib/coverage-operations.ts','app/api/cron/coverage-demand-retention/route.ts','app/api/coverage-demand/route.ts'])assert.doesNotMatch(readFileSync(file,'utf8'),/console\.|track\(|getUser\(|cookies\(/);
 assert.doesNotMatch(readFileSync('vercel.json','utf8'),/coverage-demand/);
 for(const file of ['lib/coverage-demand-client.ts','components/CoverageMeasurementChoice.tsx','app/privacy/page.tsx'])assert.doesNotMatch(readFileSync(file,'utf8'),/SERVICE_ROLE|HEARTBEAT_URL|CRON_SECRET/);
});

test("independent deadman fixture detects absent run at 09:00 UTC, empty fail signal and delivery recovery",async()=>{
 // Disposable monitor contract fixture, not proof of a configured Healthchecks check or email delivery.
 const expected=Date.parse('2026-10-04T08:00:00Z'), grace=3600000;
 let success=false,down=false,deliver=false,pending=false;let attempts=0;
 const notify=()=>{attempts++;pending=!deliver;};
 const evaluate=(now:number)=>{if(!success && now>=expected+grace && !down){down=true;notify();}else if(pending)notify();};
 evaluate(expected+grace-1);assert.equal(attempts,0);
 evaluate(expected+grace);assert.equal(down,true);assert.equal(pending,true);
 deliver=true;evaluate(expected+grace+1000);assert.equal(pending,false);assert.equal(attempts,2);
 success=true;down=false;notify();assert.equal(down,false);assert.equal(pending,false);
});
