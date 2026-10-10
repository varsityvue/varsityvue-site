import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { publicReadFetch, optionalRead } from "./public-read";
import { loadPublicScoreStatesResult } from "./public-score-loader";
import { evaluateHealth, evaluateMonitoring, type HealthWindow } from "./resilience-monitor";

test("real HTTP 503/504/pool errors are single attempts without fallback; recovery preserves verified zero", async () => {
  let status = 503, calls = 0;
  const server = createServer((_req,res) => { calls++; res.writeHead(status, { 'Content-Type':'application/json' }); res.end(status === 200 ? JSON.stringify([{game_id:'synthetic',status:'live',home_score:0,away_score:0,verified:true}]) : JSON.stringify({code:'PGRST003',message:'private diagnostic'})); });
  await new Promise<void>(r => server.listen(0,'127.0.0.1',r));
  const port = (server.address() as {port:number}).port;
  try {
    const client = createClient(`http://127.0.0.1:${port}`,'synthetic-key',{global:{fetch:publicReadFetch()},auth:{persistSession:false}});
    for (const failure of [503,504]) {status=failure; const before=calls; const result=await loadPublicScoreStatesResult(client); assert.deepEqual(result,{states:[],status:'failed'}); assert.equal(calls-before,1);}
    status=200; const result=await loadPublicScoreStatesResult(client); assert.equal(result.status,'primary'); assert.equal(result.states[0].home_score,0);
  } finally { server.closeAllConnections(); await new Promise<void>(r=>server.close(()=>r())); }
});

test("optional exception is contained without forwarding private error",async()=>{
  assert.equal(await optionalRead(()=>Promise.reject(new Error('private account')),null),null);
});

test("public transport aborts slow service and respects caller cancellation",async()=>{
  const server=createServer(()=>{}); await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));
  const port=(server.address() as {port:number}).port;
  try { const started=Date.now(); await assert.rejects(publicReadFetch()(`http://127.0.0.1:${port}`)); assert.ok(Date.now()-started<4500); const ac=new AbortController(); ac.abort(); await assert.rejects(publicReadFetch()(`http://127.0.0.1:${port}`,{signal:ac.signal})); }
  finally {server.closeAllConnections(); await new Promise<void>(r=>server.close(()=>r()));}
});

test("single visitor connection failure does not qualify as public outage",()=>{
 const w:HealthWindow={observations:20,failedVantages:1,availabilityFailedWindows:2,dataApiRequests:20,dataApiFailures:0,poolTimeouts:0,postgresRepeatedErrors:0,submissionAttempts:0,submissionFailures:0,accountChecks:0,accountFailures:0,overdueJobs:0};
 assert.deepEqual(evaluateHealth(w),[]);
 assert.deepEqual(evaluateHealth({...w,failedVantages:2}),['public_availability']);
 assert.ok(evaluateHealth({...w,poolTimeouts:1}).includes('pool_timeout_investigate'));
});

test("Request cancellation and no-store are preserved", async()=>{
 const ac=new AbortController();ac.abort();
 await assert.rejects(publicReadFetch()(new Request('http://127.0.0.1:1',{signal:ac.signal})));
 let cache: RequestCache|undefined;
 await publicReadFetch(async (_input,init)=>{cache=init?.cache;return new Response('ok');})('http://127.0.0.1:1');
 assert.equal(cache,'no-store');
});

test("missing, invalid and stale monitoring observations remain unknown",()=>{
 assert.equal(evaluateMonitoring({},Date.now()).status,'unknown');
 assert.equal(evaluateMonitoring({poolTimeouts:1},Date.now()-121000).status,'unknown');
 assert.deepEqual(evaluateMonitoring({poolTimeouts:1},Date.now()).alerts,['pool_timeout_investigate']);
 assert.equal(evaluateMonitoring({poolTimeouts:NaN},Date.now()).status,'unknown');
});

test('all proposed alert thresholds distinguish boundaries',()=>{
 const base:HealthWindow={observations:20,failedVantages:0,availabilityFailedWindows:0,dataApiRequests:20,dataApiFailures:0,poolTimeouts:0,postgresRepeatedErrors:0,connectionUsedPercent:0,connectionPressureMinutes:0,submissionAttempts:5,submissionFailures:0,accountChecks:5,accountFailures:0,overdueJobs:0,pageP95Ms:100};
 assert.equal(evaluateMonitoring(base,Date.now()).status,'healthy');
 for(const [patch,expected] of [
  [{dataApiFailures:5},'data_api_errors'],[{postgresRepeatedErrors:20},'postgres_repeat_storm'],
  [{connectionUsedPercent:70,connectionPressureMinutes:5},'connection_pressure'],
  [{submissionFailures:3},'submission_failures'],[{accountFailures:3},'account_status_failures'],
  [{overdueJobs:1},'scheduled_job_overdue'],[{pageP95Ms:3001},'page_latency']
 ] as const)assert.ok(evaluateHealth({...base,...patch}).includes(expected));
 assert.deepEqual(evaluateHealth({...base,postgresRepeatedErrors:19,connectionUsedPercent:69,connectionPressureMinutes:5,pageP95Ms:3000,submissionFailures:2,accountFailures:2}),[]);
});
