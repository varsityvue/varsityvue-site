import assert from 'node:assert/strict';
import { test, mock } from 'node:test';
import type { PublicScoreState } from '../../lib/public-score-state';
const originalFetch=globalThis.fetch;
globalThis.fetch=async()=>{throw Error('Network prohibited in isolated operations fixture');};
let roles=['moderator'];
let rpcError: {code:string}|null=null;
const calls: {name:string;args:Record<string,unknown>;retry:boolean}[]=[];
let states: PublicScoreState[]=[];
const invalidated:string[]=[];
const client={
 from:(table:string)=>{assert.equal(table,'user_roles');return {select:()=>({eq:async()=>({data:roles.map(role=>({role}))})})};},
 rpc:(name:string,args:Record<string,unknown>={})=>{
  const query={abortSignal:()=>query,retry:async(retry:boolean)=>{
   if(name==='public_score_states')return {data:states,error:null};
   calls.push({name,args,retry});
   if(!rpcError){states=[...states.filter(s=>s.game_id!==args.p_game_id),{game_id:String(args.p_game_id),status:args.p_game_status as PublicScoreState['status'],home_score:Number(args.p_home_score),away_score:Number(args.p_away_score),verified:true,period:null,clock:null,kickoff_override:null,result_type:'played',official_winner_school_slug:null,attribution_type:'verified'}];}
   return {error:rpcError};
  }};return query;
 }
};
mock.module('next/cache',{namedExports:{revalidatePath:(path:string)=>invalidated.push(path)}});
mock.module('next/navigation',{namedExports:{redirect:(path:string)=>{throw Error('redirect:'+path);}}});
mock.module('../../lib/member-access.ts',{namedExports:{requireActiveMember:async()=>({supabase:client,userId:'isolated-operator'})}});
mock.module('../../lib/supabase/server.ts',{namedExports:{createPublicReadClient:async()=>client}});
const actionsPath='../../app/internal/scoring/actions.ts';
const dynamicPath='../../lib/dynamic-games.ts';
const {submitOperationalScore}=await import(actionsPath);
const {getDynamicGamesSnapshot,getDynamicGamesForSchool}=await import(dynamicPath) as typeof import('../../lib/dynamic-games');
const {getGames}=await import('../../lib/games');
const {verifiedWinner}=await import('../../lib/playoff-bracket-advancement');
const {getRegionalRoundReadiness}=await import('../../lib/regional-round-readiness');
const area=getGames().filter(g=>g.playoff?.round==='Area');
function form(){const f=new FormData();for(const [k,v] of Object.entries({game_id:area[0].id,week:'13',away_score:'14',home_score:'28',intent:'final',confirm_final:'yes',expected_absent:'true',source_note:'Isolated fixture — never sent to production'}))f.set(k,v);return f;}

test('actual scoring action rejects blank/partial finals and requires final confirmation before RPC',async()=>{
 for(const [key,val] of [['home_score',''],['away_score',' '],['confirm_final','no']]){const f=form();f.set(key,val);await assert.rejects(submitOperationalScore(f),/error=1/);}
 assert.equal(calls.length,0);
});
test('actual final action publishes explicit scores to fixture once and refreshes affected public paths',async()=>{
 await assert.rejects(submitOperationalScore(form()),/saved=1/);
 assert.equal(calls.length,1);assert.equal(calls[0].name,'submit_trusted_score_update');assert.equal(calls[0].retry,false);
 assert.equal(calls[0].args.p_home_score,28);assert.equal(calls[0].args.p_away_score,14);
 for(const path of ['/playoffs',`/games/${area[0].id}`,`/schools/${area[0].homeSchoolSlug}/schedule`,`/schools/${area[0].awaySchoolSlug}/schedule`])assert.ok(invalidated.includes(path),path);
 for(const slug of [area[0].homeSchoolSlug!,area[0].awaySchoolSlug!]){const g=(await getDynamicGamesForSchool(slug)).find(g=>g.id===area[0].id)!;assert.equal(g.status,'final');assert.equal(g.homeScore,28);assert.equal(g.awayScore,14);}
});
test('all 96 fixture finals feed 48 correct readiness pairs through the real public loader',async()=>{
 states=area.map(g=>({game_id:g.id,status:'final',home_score:28,away_score:14,verified:true,period:null,clock:null,kickoff_override:null,result_type:'played',official_winner_school_slug:null,attribution_type:'verified'}));
 const snapshot=await getDynamicGamesSnapshot();assert.equal(snapshot.scoreLoadStatus,'primary');
 const queue=getRegionalRoundReadiness(snapshot.games);assert.equal(queue.length,48);assert.ok(queue.every(r=>r.status==='needs-schedule'&&r.teams.every(Boolean)));
 assert.equal(snapshot.games.filter(g=>g.playoff?.round==='Regional Semifinal').length,0);
 const before=queue[0].teams;
 states[0]={...states[0],home_score:7,away_score:21,attribution_type:'correction'};
 const corrected=await getDynamicGamesSnapshot();assert.equal(verifiedWinner(corrected.games.find(g=>g.id===area[0].id)),area[0].awayTeam);
 assert.notDeepEqual(getRegionalRoundReadiness(corrected.games)[0].teams,before);
 for(const slug of [area[0].homeSchoolSlug!,area[0].awaySchoolSlug!])assert.equal((await getDynamicGamesForSchool(slug)).find(g=>g.id===area[0].id)?.awayScore,21);
});
test('stale writes do not retry or invalidate, and scorekeeper role cannot use moderator action',async()=>{
 rpcError={code:'PT409'};const count=calls.length;const refreshed=invalidated.length;
 await assert.rejects(submitOperationalScore(form()),/stale=1/);assert.equal(calls.length,count+1);assert.equal(calls.at(-1)?.retry,false);assert.equal(invalidated.length,refreshed);
 roles=['scorekeeper'];await assert.rejects(submitOperationalScore(form()),/redirect:\/account/);assert.equal(calls.length,count+1);
 globalThis.fetch=originalFetch;
});
