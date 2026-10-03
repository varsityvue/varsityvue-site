import test from "node:test";
import assert from "node:assert/strict";
import { CoverageEpisode,CoveragePreference,deliverCoverageSummary } from "./coverage-demand-client";
import { fixtureSummary } from "./coverage-demand-test-fixture";
import type { GamesNearMeSearchSummary } from "../types/coverage-demand";

test("one summary per episode, expansion counts capped with no chronological trail, first selection finalizes",()=>{
 const sent:GamesNearMeSearchSummary[]=[];const ep=new CoverageEpisode(s=>sent.push(s));const center={};
 ep.observe(center,fixtureSummary,true);
 for(const radius of [100,150,10,25,10,50,10,150]) ep.observe(center,{...fixtureSummary,final_radius_miles:radius},true);
 ep.finalize(true);ep.finalize(true);ep.observe(center,fixtureSummary,true);ep.finalize();
 assert.equal(sent.length,1);assert.equal(sent[0].initial_radius_miles,50);assert.equal(sent[0].final_radius_miles,150);assert.equal(sent[0].radius_expansion_steps,4);assert.equal(sent[0].radius_expanded,true);assert.equal(sent[0].game_selected,true);
 assert.ok(!Object.keys(sent[0]).some(k=>/trail|history|identifier|episode_id/.test(k)));
});
test("center and week changes finalize/reset; Clear, declined and unavailable discard safely",()=>{
 const sent:GamesNearMeSearchSummary[]=[];const ep=new CoverageEpisode(s=>sent.push(s));const c={};
 ep.observe(c,fixtureSummary,true);ep.observe({},fixtureSummary,true);assert.equal(sent.length,1);
 ep.observe(c,{...fixtureSummary,week:8},true);assert.equal(sent.length,2);
 ep.finalize();ep.discard();ep.finalize();assert.equal(sent.length,3);
 ep.observe(c,fixtureSummary,false);ep.finalize();assert.equal(sent.length,3);
 ep.observe(c,fixtureSummary,true);ep.observe(c,null,true);ep.finalize();assert.equal(sent.length,3);
 ep.observe(c,fixtureSummary,true);ep.discard();ep.finalize();assert.equal(sent.length,3);
});
test("delivery explicitly omits credentials/referrer, has a timeout, no retry, and failure never throws",async()=>{
 const original=globalThis.fetch;const enabled=process.env.NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED;let calls=0;
 try{
 globalThis.fetch=async(_url,options)=>{calls++;assert.equal(options?.credentials,'omit');assert.equal(options?.referrerPolicy,'no-referrer');assert.equal(options?.keepalive,true);assert.ok(options?.signal);throw new Error('blocked');};
 process.env.NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED='false';deliverCoverageSummary(fixtureSummary);assert.equal(calls,0);
 process.env.NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED='true';assert.doesNotThrow(()=>deliverCoverageSummary(fixtureSummary));await Promise.resolve();assert.equal(calls,1);
 const ep=new CoverageEpisode(()=>{throw new Error('offline');});ep.observe({},fixtureSummary,true);assert.doesNotThrow(()=>ep.finalize(true));
 }finally{globalThis.fetch=original;if(enabled===undefined)delete process.env.NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED;else process.env.NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED=enabled;}
});

test("preference reconciliation revokes stale consent, invalid/removal values, and preserves unreadable-storage memory",()=>{
 let persisted:string|null='enabled';let blocked=false;
 const preference=new CoveragePreference(()=>{if(blocked)throw Error('blocked');return persisted;});
 let sent=0;const ep=new CoverageEpisode(()=>sent++,()=>preference.reconcile()==='enabled');
 assert.equal(preference.reconcile(),'enabled');ep.observe({},fixtureSummary,true);
 persisted='disabled';ep.finalize(true);assert.equal(sent,0);
 for(const value of [null,'invalid','']){persisted='enabled';preference.reconcile();ep.observe({},fixtureSummary,true);persisted=value;ep.finalize();assert.equal(sent,0);assert.equal(preference.reconcile(),null);}
 blocked=true;preference.choose('enabled');ep.observe({},fixtureSummary,true);ep.finalize();assert.equal(sent,1);
 preference.choose('disabled');ep.observe({},fixtureSummary,true);ep.finalize();assert.equal(sent,1);
});
