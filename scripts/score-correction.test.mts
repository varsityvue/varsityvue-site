import assert from 'node:assert/strict';
import {mock, test, beforeEach, after} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{throw Error('Network prohibited in score correction fixture');};
let roles=['admin'];
let rpcError:{code:string;message:string}|null=null;
const calls:{name:string;args:Record<string,unknown>;retry:boolean}[]=[];
const invalidated:string[]=[];
const client={
 from:()=>({select:()=>({eq:async()=>({data:roles.map(role=>({role}))})})}),
 rpc:(name:string,args:Record<string,unknown>)=>({retry:async(retry:boolean)=>{calls.push({name,args,retry});return {error:rpcError};}})
};
mock.module('next/cache',{namedExports:{revalidatePath:(path:string)=>invalidated.push(path)}});
mock.module('next/navigation',{namedExports:{redirect:(path:string)=>{throw Error('redirect:'+path);}}});
mock.module('../lib/member-access.ts',{namedExports:{requireActiveMember:async()=>({supabase:client,userId:'isolated-admin'})}});
const actionsPath='../app/internal/score-review/correct/actions.ts';
const {correctScore}=await import(actionsPath);
const formPath='../app/internal/score-review/correct/ScoreCorrectionForm.tsx';
const {default:ScoreCorrectionForm}=await import(formPath);
const gameId='2026-area-2a-d1-ii-4';
function form(){const f=new FormData();for(const [k,v] of Object.entries({game_id:gameId,status:'final',away_score:'0',home_score:'28',expected_outcome_revision:'2',expected_updated_at:'2026-11-16T00:00:00Z',reason:'Isolated fixture correction; no production write',prior_final:'true',confirmed:'yes'}))f.set(k,v);return f;}
beforeEach(()=>{roles=['admin'];rpcError=null;calls.length=0;invalidated.length=0;});
after(()=>{globalThis.fetch=originalFetch;});
test('missing, blank, file and malformed correction scores are rejected before RPC',async()=>{
 for(const key of ['away_score','home_score'])for(const value of [null,'',' ','1e2','0x10','1.5','-1','151',new File(['0'],'score')]){
  const f=form();if(value===null)f.delete(key);else f.set(key,value);
  await assert.rejects(correctScore(f),/Check/);
 }
 assert.equal(calls.length,0);assert.deepEqual(invalidated,[]);
});
test('an explicit zero is preserved in the existing audited correction RPC and revisions are retained',async()=>{
 await assert.rejects(correctScore(form()),/saved=1/);
 assert.equal(calls.length,1);assert.equal(calls[0].name,'correct_game_score');assert.equal(calls[0].retry,false);
 assert.equal(calls[0].args.p_away_score,0);assert.equal(calls[0].args.p_home_score,28);
 assert.equal(calls[0].args.p_expected_outcome_revision,2);assert.equal(calls[0].args.p_expected_updated_at,'2026-11-16T00:00:00Z');
 assert.match(String(calls[0].args.p_reason),/Isolated fixture/);
 for(const path of ['/playoffs','/admin/playoff-publishing','/internal/scoring',`/games/${gameId}`,'/schools/de-leon/schedule','/schools/axtell/schedule'])assert.ok(invalidated.includes(path),path);
});
test('reason and explicit confirmation remain required before RPC',async()=>{
 for(const [key,value] of [['reason',''],['confirmed','no']]){const f=form();f.set(key,value);await assert.rejects(correctScore(f),/Check/);}
 assert.equal(calls.length,0);
});
test('non-admin roles cannot correct an existing final',async()=>{
 for(const role of ['moderator','scorekeeper','member']){roles=[role];await assert.rejects(correctScore(form()),role==='moderator'?/Check/:/redirect:\/account/);}
 assert.equal(calls.length,0);
});
test('a stale correction does not retry or refresh public paths',async()=>{
 rpcError={code:'PT409',message:'stale fixture'};await assert.rejects(correctScore(form()),/game%20changed/i);
 assert.equal(calls.length,1);assert.equal(calls[0].retry,false);assert.deepEqual(invalidated,[]);
});
test('correction form preserves unknown scores as blank and explicit shutouts as zero',()=>{
 const props={gameId,awayName:'De Leon',homeName:'Axtell',isAdmin:true,state:{status:'upcoming',away_score:null,home_score:null,period:null,clock:null,updated_at:'2026-11-16T00:00:00Z',outcome_revision:2,result_type:null}};
 const blank=renderToStaticMarkup(React.createElement(ScoreCorrectionForm,props));
 for(const name of ['away_score','home_score'])assert.match(blank,new RegExp(`name="${name}"[^>]*value=""`));
 const shutout=renderToStaticMarkup(React.createElement(ScoreCorrectionForm,{...props,state:{...props.state,status:'final',away_score:0,home_score:28}}));
 assert.match(shutout,/name="away_score"[^>]*value="0"/);assert.match(shutout,/name="home_score"[^>]*value="28"/);
});
