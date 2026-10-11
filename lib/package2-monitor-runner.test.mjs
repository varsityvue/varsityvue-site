import test from 'node:test';
import assert from 'node:assert/strict';
import {checkAvailability} from '../scripts/check-package2-availability.mjs';
const config={enabled:false,timeoutMs:100,publicPaths:['/','/api/games/snapshot']};
test('monitor cannot activate production while disabled',async()=>{
 let calls=0;await assert.rejects(checkAvailability('https://varsityvue.com',config,async()=>{calls++;return new Response();}));assert.equal(calls,0);
});
test('monitor is sequential and rejects stale/failed score snapshots',async()=>{
 let active=0,max=0;
 const fetcher=async url=>{max=Math.max(max,++active);await new Promise(r=>setTimeout(r,5));active--;return url.pathname.includes('snapshot')?Response.json({games:[],scoreLoadStatus:'failed',fetchedAt:new Date().toISOString()}):new Response('ok');};
 const result=await checkAvailability('http://127.0.0.1:3000',config,fetcher);assert.equal(max,1);assert.equal(result.results[0].healthy,true);assert.equal(result.results[1].healthy,false);
 const stale=await checkAvailability('http://127.0.0.1:3000',{...config,publicPaths:['/api/games/snapshot']},async()=>Response.json({games:[],scoreLoadStatus:'primary',fetchedAt:'2020-01-01'}));assert.equal(stale.results[0].healthy,false);
});
