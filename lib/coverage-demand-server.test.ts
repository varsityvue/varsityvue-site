import test from "node:test";
import assert from "node:assert/strict";
import { coverageBudget,ingestCoverage } from "./coverage-demand-server";
import { fixtureSummary } from "./coverage-demand-test-fixture";
import { readFileSync } from "node:fs";
const request=(body:unknown,headers:Record<string,string>={})=>new Request('https://test.invalid/api/coverage-demand',{method:'POST',headers:{origin:'https://test.invalid','content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
const options={enabled:true,budget:()=>true,approved:()=>true};
test("strict credential-free ingestion, size bound (including streamed body), failures and approval gate",async()=>{
 let calls=0;const record=async()=>{calls++;};
 assert.equal((await ingestCoverage(request(fixtureSummary),record,options)).status,204);assert.equal(calls,1);
 for(const body of [{...fixtureSummary,lat:32}, {...fixtureSummary,user_id:'x'}, {...fixtureSummary,final_radius_miles:99},'broken',' '.repeat(2049),{...fixtureSummary,returned_game_count:-1}])assert.equal((await ingestCoverage(request(body),record,options)).status,400);
 assert.equal((await ingestCoverage(request(fixtureSummary,{'content-length':'2049'}),record,options)).status,400);
 assert.equal((await ingestCoverage(request(fixtureSummary,{origin:'https://evil.invalid'}),record,options)).status,400);
 assert.equal((await ingestCoverage(request(fixtureSummary),record,{...options,enabled:false})).status,503);
 assert.equal((await ingestCoverage(request(fixtureSummary),record,{...options,budget:()=>false})).status,429);
 assert.equal((await ingestCoverage(request(fixtureSummary),record,{...options,approved:()=>false})).status,400);
 assert.equal((await ingestCoverage(request(fixtureSummary),async()=>{throw Error('db down');},options)).status,503);
 assert.equal(calls,1);
});
test("anonymous budget is global, transient and bounded; route bypasses auth and has no payload logging",()=>{
 let now=0;const budget=coverageBudget(2,()=>now);assert.ok(budget());assert.ok(budget());assert.equal(budget(),false);now=60000;assert.ok(budget());
 const route=readFileSync('app/api/coverage-demand/route.ts','utf8');assert.doesNotMatch(route,/console\.|trackConversion\(|getClaims\(|getUser\(|cookies\(|request\.headers/);
 const proxy=readFileSync('proxy.ts','utf8');assert.ok(proxy.indexOf('"/api/coverage-demand"')<proxy.indexOf('return updateSession(request)'));
});

test("same-origin validation uses incoming Host when Next has an internal listener URL",async()=>{
 const req=new Request('http://localhost:3002/api/coverage-demand',{method:'POST',headers:{origin:'http://127.0.0.1:3002',host:'127.0.0.1:3002','content-type':'application/json'},body:JSON.stringify(fixtureSummary)});
 assert.equal((await ingestCoverage(req,async()=>{},options)).status,204);
 const mismatch=new Request('http://localhost:3002/api/coverage-demand',{method:'POST',headers:{origin:'http://different.invalid:3002',host:'127.0.0.1:3002','content-type':'application/json'},body:JSON.stringify(fixtureSummary)});
 assert.equal((await ingestCoverage(mismatch,async()=>{},options)).status,400);
});

test("bounded SQLSTATE classification and sanitized operational categories do not alter ingestion responses",async()=>{
 const {coverageFailureCategory,CoverageDatabaseFailure}=await import('./coverage-demand-server');
 assert.equal(await coverageFailureCategory(Response.json({code:'54000',message:'sensitive'})),'capacity_failure');
 assert.equal(await coverageFailureCategory(new Response('x'.repeat(4097))),'database_failure');
 const statuses:string[]=[];
 assert.equal((await ingestCoverage(request(fixtureSummary),async()=>{throw new CoverageDatabaseFailure('capacity_failure');},{...options,health:s=>statuses.push(s)})).status,503);
 assert.deepEqual(statuses,['capacity_failure']);
 assert.equal((await ingestCoverage(request(fixtureSummary),async()=>{},{...options,health:()=>{throw Error('monitor');}})).status,204);
});
