// Real Auth/HTTP/browser Package 1 checks. Synthetic records only; loopback enforced.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import net from 'node:net';
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {readMemberAccountStatus,enforceMemberStatus} from '../lib/member-status.ts';
import {isScoreConflict,scoreConflictMessage} from '../lib/score-conflict.ts';
const require=createRequire('/vercel/test-tools/package.json');const {chromium}=require('playwright');
const v=JSON.parse(fs.readFileSync('/vercel/runtime-fixture.json','utf8'));
assert.equal(v.API_URL,'http://127.0.0.1:54321');assert.equal(process.cwd(),'/vercel/package');
const api=v.API_URL;
const sql=q=>execFileSync('psql',['-X','-At','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p','54322','-U','postgres','-d','postgres','-c',q],{env:{...process.env,PGPASSWORD:'isolated-fixture-only'},encoding:'utf8',timeout:10000}).trim();
const control=async(mode,reset=true)=>{const r=await fetch(api+'/__fixture/control',{method:'POST',body:JSON.stringify({mode,reset})});assert.ok(r.ok);};
const stats=async()=>await(await fetch(api+'/__fixture/stats')).json();
async function user(label,role='member'){
 const email=`p0-${label}-${runId}@example.invalid`,password=randomBytes(24).toString('base64url');
 let r=await fetch(api+'/auth/v1/admin/users',{method:'POST',headers:{Authorization:`Bearer ${v.SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({email,password,email_confirm:true,role:'authenticated',aud:'authenticated'})});assert.ok(r.ok,`create ${label}: ${r.status}`);
 const actor=(await r.json()).id;assert.match(actor,/^[0-9a-f-]{36}$/);
 if(role!=='member')sql(`insert into public.user_roles(user_id,role) values('${actor}','${role}')`);
 const client=createClient(api,v.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const signed=await client.auth.signInWithPassword({email,password});assert.ifError(signed.error);
 return{actor,client,session:signed.data.session,label,role};
}
const runId=randomBytes(5).toString('hex');
const actors=[];let browser,app;
try{
 for(const role of ['member','scorekeeper','moderator','admin'])actors.push(await user(role,role));
 const [member,keeper,moderator,admin]=actors;
 const game='albany-at-stamford-2026-week-7';
 sql(`insert into public.contributor_school_assignments(user_id,school_slug) values('${keeper.actor}','albany'); update public.profiles set username='p0_keeper_${runId}' where id='${keeper.actor}';`);
 // Administrative first-publication, assigned update, stale rejection, history/audit retention.
 const existing=sql(`select coalesce((select row_to_json(s)::text from public.game_state s where game_id='${game}'),'null')`);const initial=JSON.parse(existing);
 let r=await admin.client.rpc('submit_trusted_score_update',{p_game_id:game,p_home_score:14,p_away_score:21,p_game_status:'live',p_period:'3rd',p_clock:'04:00',p_source_note:null,p_expected_state_updated_at:initial?.updated_at??null,p_expected_state_revision:initial?.score_revision??null,p_expected_state_absent:!initial}).retry(false);
 assert.ifError(r.error);let state=JSON.parse(sql(`select row_to_json(s) from public.game_state s where game_id='${game}'`));
 // Fetch actual SQL argument names from installed signature, avoiding production assumptions.
 const names=sql("select array_to_json(proargnames) from pg_proc where oid='public.submit_assigned_scorekeeper_update(text,integer,integer,text,text,timestamp with time zone,bigint,boolean)'::regprocedure");
 console.log('assigned argument contract',names);
 const assigned={p_game_id:game,p_home_score:14,p_away_score:28,p_period:'4th',p_clock:'02:00',p_expected_state_updated_at:state.updated_at,p_expected_state_revision:state.score_revision,p_confirm_score_decrease:false};
 r=await keeper.client.rpc('submit_assigned_scorekeeper_update',assigned).retry(false);assert.ifError(r.error);
 const before=sql(`select json_build_object('state',(select row_to_json(s) from public.game_state s where game_id='${game}'),'submissions',(select count(*) from public.score_submissions where game_id='${game}'),'events',(select count(*) from public.score_submission_events where submission_id in(select id from public.score_submissions where game_id='${game}'))) `);
 await control('normal');r=await keeper.client.rpc('submit_assigned_scorekeeper_update',{...assigned,p_away_score:22}).retry(false);
 assert.equal(r.error?.code,'PT409');assert.ok(isScoreConflict(r.error));assert.equal((await stats()).counts.rpc,1);
 assert.equal(sql(`select json_build_object('state',(select row_to_json(s) from public.game_state s where game_id='${game}'),'submissions',(select count(*) from public.score_submissions where game_id='${game}'),'events',(select count(*) from public.score_submission_events where submission_id in(select id from public.score_submissions where game_id='${game}'))) `),before);
 console.log('PASS HTTP assigned PT409 single client request; score/history/audit unchanged');
 // PostgREST server-execution count survives transaction rollback via a test-only sequence.
 sql(`drop function if exists public.p0_stale_probe(); drop sequence if exists public.p0_execution_counter; create sequence public.p0_execution_counter; grant usage,select on sequence public.p0_execution_counter to authenticated; create function public.p0_stale_probe() returns void language plpgsql security invoker as $$begin perform nextval('public.p0_execution_counter'); perform public.submit_assigned_scorekeeper_update('${game}',14,22,'4th','02:00','${state.updated_at}',${state.score_revision},false); end;$$; grant execute on function public.p0_stale_probe() to authenticated; notify pgrst,'reload schema';`);
 await new Promise(r=>setTimeout(r,500));
 r=await keeper.client.rpc('p0_stale_probe').retry(false);assert.equal(r.error?.code,'PT409');assert.equal(sql('select last_value from public.p0_execution_counter'),'1');
 console.log('PASS real PostgREST PT409 executes losing transaction exactly once');
 for(const actor of actors){
  await control('503');const result=await readMemberAccountStatus(actor.client,actor.actor);assert.equal(result,'unavailable');let writes=0,signouts=0;
  await assert.rejects(async()=>{await enforceMemberStatus(result,async()=>{signouts++;await actor.client.auth.signOut({scope:'global'});},path=>{throw new Error(path);});writes++;},/account-unavailable/);
  assert.equal(writes,0);assert.equal(signouts,0);assert.equal((await stats()).counts.status,1);assert.equal((await stats()).counts.logout,0);
  await control('normal');assert.equal(await readMemberAccountStatus(actor.client,actor.actor),'active');assert.ifError((await actor.client.auth.getUser()).error);assert.ifError((await actor.client.auth.refreshSession()).error);
  console.log('PASS real Auth session preserved/recovered and protected gate closed: '+actor.role);
 }
 await control('timeout');const start=Date.now();assert.equal(await readMemberAccountStatus(keeper.client,keeper.actor),'unavailable');assert.ok(Date.now()-start>=2800&&Date.now()-start<4500);assert.equal((await stats()).counts.status,1);await control('normal');
 console.log('PASS real HTTP account-status timeout bounded; no SDK retry');
 // Authenticated role is insufficient for publisher authority, and RLS prevents overwrites.
 state=JSON.parse(sql(`select row_to_json(s) from public.game_state s where game_id='${game}'`));
 const current={...assigned,p_expected_state_updated_at:state.updated_at,p_expected_state_revision:state.score_revision};
 r=await member.client.rpc('submit_assigned_scorekeeper_update',current).retry(false);assert.equal(r.error?.code,'42501');
 r=await member.client.from('game_state').update({away_score:99}).eq('game_id',game).select();assert.ok(r.error||r.data.length===0);assert.equal(sql(`select away_score from public.game_state where game_id='${game}'`),'28');
 const leaked=await member.client.from('member_account_status').select('user_id').eq('user_id',admin.actor).retry(false);assert.ok(leaked.error||leaked.data.length===0);
 console.log('PASS HTTP ordinary-member publication rejection and row-level privacy/write enforcement');
 const probe=net.createServer();await new Promise((resolve,reject)=>{probe.once('error',reject);probe.listen(3000,'127.0.0.1',resolve);});await new Promise(resolve=>probe.close(resolve));
 browser=await chromium.launch();
 app=spawn(process.execPath,['node_modules/next/dist/bin/next',process.env.P1_PRODUCTION_BUILD === '1' ? 'start' : 'dev','--hostname','127.0.0.1','--port','3000'],{detached:true,env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:api,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:v.ANON_KEY,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore',fs.openSync('/tmp/p0-app.log','w'),'pipe']});
 for(let i=0;i<90;i++){try{if((await fetch('http://127.0.0.1:3000/login')).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));assert.notEqual(i,89);}
 assert.equal(app.exitCode,null,'Application process must be running');
 async function context(actor){const c=await browser.newContext();const session=(await actor.client.auth.getSession()).data.session;const encoded='base64-'+Buffer.from(JSON.stringify(session)).toString('base64url');const chunks=encoded.match(/.{1,3180}/g);await c.addCookies(chunks.map((value,i)=>({name:chunks.length===1?'sb-127-auth-token':`sb-127-auth-token.${i}`,value,url:'http://127.0.0.1:3000',sameSite:'Lax'})));return c;}
 const c=await context(keeper),page=await c.newPage();
 await page.goto(`http://127.0.0.1:3000/report-score?game=${game}`);await page.getByRole('heading',{name:'Trusted LIVE Update',exact:true}).waitFor();
 const form=()=>page.locator('form').filter({has:page.getByRole('button',{name:'Publish Trusted LIVE Update',exact:true})});
 state=JSON.parse(sql(`select row_to_json(s) from public.game_state s where game_id='${game}'`));
 r=await moderator.client.rpc('submit_trusted_score_update',{p_game_id:game,p_home_score:14,p_away_score:35,p_game_status:'live',p_period:'4th',p_clock:'01:00',p_source_note:null,p_expected_state_updated_at:state.updated_at,p_expected_state_revision:state.score_revision,p_expected_state_absent:false}).retry(false);assert.ifError(r.error);
 await form().locator('[name=away_score]').fill('42');await form().getByRole('button').click();await page.getByText(scoreConflictMessage,{exact:true}).waitFor();assert.equal(sql(`select away_score from public.game_state where game_id='${game}'`),'35');
 console.log('PASS browser assigned stale conflict message; losing save cannot overwrite winner');
 // Browser route failure/recovery with actual session cookie. No logout may be sent.
 await page.goto(`http://127.0.0.1:3000/report-score?game=${game}`);await form().locator('[name=away_score]').fill('42');const beforeFailure=sql(`select row_to_json(s) from public.game_state s where game_id='${game}'`);await control('503');await form().getByRole('button').click();await page.waitForURL(/account-unavailable/);await page.getByRole('heading',{name:'Member access temporarily unavailable',exact:true}).waitFor();assert.equal((await stats()).counts.writeRpc,0);assert.equal(sql(`select row_to_json(s) from public.game_state s where game_id='${game}'`),beforeFailure);assert.equal((await stats()).counts.logout,0);assert.ok((await c.cookies()).some(x=>x.name.startsWith('sb-127-auth-token')));await control('normal');await page.goto(`http://127.0.0.1:3000/report-score?game=${game}`);await page.getByRole('heading',{name:'Trusted LIVE Update',exact:true}).waitFor();
 console.log('PASS browser mutation fails closed before score RPC during temporary failure; recoverable page/cookie/scoring form recovery');
 sql(`delete from public.contributor_school_assignments where user_id='${keeper.actor}'`);
 state=JSON.parse(sql(`select row_to_json(s) from public.game_state s where game_id='${game}'`));r=await keeper.client.rpc('submit_assigned_scorekeeper_update',{...current,p_expected_state_updated_at:state.updated_at,p_expected_state_revision:state.score_revision}).retry(false);assert.equal(r.error?.code,'42501');
 await page.goto(`http://127.0.0.1:3000/report-score?game=${game}`);assert.equal(await page.getByRole('heading',{name:'Trusted LIVE Update',exact:true}).count(),0);
 console.log('PASS revoked assignment denied in HTTP RPC and browser');
 sql(`update public.member_account_status set status='suspended',suspended_at=now() where user_id='${keeper.actor}'`);await page.goto(`http://127.0.0.1:3000/report-score?game=${game}`);await page.waitForURL(/account-suspended/);assert.ok((await stats()).counts.logout>=1);assert.equal((await c.cookies()).filter(x=>x.name.startsWith('sb-127-auth-token')).length,0);
 r=await keeper.client.rpc('submit_assigned_scorekeeper_update',{...current,p_expected_state_updated_at:state.updated_at,p_expected_state_revision:state.score_revision}).retry(false);assert.equal(r.error?.code,'42501');
 console.log('PASS explicitly suspended account denied and browser session removed');
 const anonymous=await browser.newContext(),anonpage=await anonymous.newPage();await anonpage.goto('http://127.0.0.1:3000/report-score');await anonpage.waitForURL(/login/);await anonymous.close();
 for(const a of [admin,moderator]){const ctx=await context(a),p=await ctx.newPage();await p.goto('http://127.0.0.1:3000/internal/scoring');await p.getByRole('heading',{name:'Friday-night scores',exact:true}).waitFor();await ctx.close();}
 console.log('PASS browser anonymous denial and moderator/admin scoring access');
 // Native independent-connection test proves engine 40001; do not manufacture a retry storm.
 console.log('PASS ALL PACKAGE 1 AUTH/HTTP/BROWSER VERIFICATION');
}finally{await control('normal');await browser?.close();if(app?.pid){try{process.kill(-app.pid,'SIGTERM');}catch{}}}
