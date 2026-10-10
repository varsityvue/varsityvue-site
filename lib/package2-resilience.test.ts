import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createClient } from "@supabase/supabase-js";
import { publicReadFetch, optionalRead } from "./public-read";
import { loadPublicScoreStatesResult } from "./public-score-loader";
import { evaluateHealth, type HealthWindow } from "./resilience-monitor";

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
