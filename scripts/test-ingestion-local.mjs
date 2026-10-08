// Disposable loopback-only Supabase integration/security/race verification.
import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {writeFileSync} from 'node:fs';
import {createClient} from '@supabase/supabase-js';
import sharp from 'sharp';
const env=JSON.parse(execFileSync('supabase',['status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
assert.equal(new URL(env.API_URL).hostname,'127.0.0.1');
const admin=createClient(env.API_URL,env.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const sql=s=>execFileSync('docker',['exec','-i','supabase_db_varsityvue-phase1','psql','-X','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres','-At','-c',s],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const q=s=>"'"+String(s).replaceAll("'","''")+"'";
const canonical=()=>sql("select jsonb_object_agg(name,fingerprint) from (select 'roster' name,md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) fingerprint from public.school_roster_players t union all select 'scores',md5(coalesce(jsonb_agg(to_jsonb(t) order by game_id)::text,'')) from public.game_state t union all select 'pickem',md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) from public.pickem_weeks t union all select 'feed',md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) from public.team_feed_posts t) s;");
const before=canonical();const accounts=[];
for(const [name,role,status] of [['admin','admin','active'],['moderator','moderator','active'],['member','member','active'],['coach','member','active'],['suspended','admin','suspended'],['inactive','moderator',null]]) {
 const email=`ingestion-${name}@local.example`,password='Disposable-Review-2026!';
 const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.equal(error,null);
 const id=data.user.id;
 sql(`insert into public.user_roles(user_id,role) values(${q(id)},${q(role)}) on conflict do nothing; ${status?`update public.member_account_status set status=${q(status)},suspended_at=${status==='suspended'?'clock_timestamp()':'null'} where user_id=${q(id)};`:`delete from public.member_account_status where user_id=${q(id)};`}`);
 if(name==='coach')sql(`insert into public.contributor_school_assignments(user_id,school_slug,assignment_role,active,assigned_by) values(${q(id)},'albany','coach',true,${q(id)});`);
 const client=createClient(env.API_URL,env.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});assert.equal((await client.auth.signInWithPassword({email,password})).error,null);accounts.push({name,id,email,password,client});
}
const actor=accounts[0],moderator=accounts[1];
const mutate=(a,id,command,revision,hash,payload={},request=randomUUID(),reason=null)=>admin.rpc('ingestion_mutate',{p_actor:a.id,p_id:id,p_command:command,p_revision:revision,p_hash:hash,p_payload:payload,p_request:request,p_reason:reason});
const source=randomUUID(),id=randomUUID();const missing={state:'omitted'},confirmed=id=>({state:'confirmed',id,confirmedBy:actor.id});
const draft={schemaVersion:1,draftId:id,dataClass:'roster',operation:'create',schoolSlug:'albany',season:2027,target:{match:{state:'unresolved',candidates:[]},expectedRevision:missing},sources:[{sourceId:source,kind:'text',locator:missing}],evidence:[],identityMatches:[],availability:[],issues:[],disposition:'pending',values:{rows:[{rowId:randomUUID(),name:'Disposable Review Player',player:confirmed('new:albany-disposable-review-player-2027'),jerseyNumber:missing,grade:missing,positions:missing,height:missing,weight:missing}]}};
const validation={managedRosterVersion:sql("select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) from public.school_roster_players t;"),reviewable:true,validationHash:'trusted-test-validation'};
let r=await mutate(actor,id,'create',0,null,{school:'albany',season:2027,class:'roster',operation:'create',draft,validation,source:{id:source,kind:'text',label:'Disposable test source',body:'Name retained verbatim'}});assert.equal(r.error,null);let current=r.data;
assert.equal((await moderator.client.rpc('ingestion_read',{p_id:id})).error,null);
for(const a of accounts.slice(2)){assert.ok((await a.client.rpc('ingestion_read',{p_id:id})).error);assert.ok((await a.client.rpc('ingestion_roster_catalog')).error);assert.ok((await mutate(a,id,'save',current.revision,current.hash,{draft,validation})).error);}
const anonymous=createClient(env.API_URL,env.ANON_KEY,{auth:{persistSession:false}});assert.ok((await anonymous.rpc('ingestion_read',{p_id:id})).error);
assert.ok((await actor.client.rpc('ingestion_mutate',{p_actor:actor.id,p_id:id,p_command:'approve',p_revision:1,p_hash:current.hash,p_request:randomUUID(),p_payload:{},p_reason:null})).error);
for(const table of ['ingestion_submissions','ingestion_sources','ingestion_revisions','ingestion_events']) assert.match(sql(`select has_table_privilege('authenticated','private.${table}','INSERT')||'/'||has_table_privilege('authenticated','private.${table}','UPDATE')||'/'||has_table_privilege('authenticated','private.${table}','DELETE');`),/false\/false\/false/);
console.log('PASS active admin/moderator; anonymous/member/assigned coach/suspended/missing-status denial; no direct table/RPC forgery');
// Real Storage reservations and scope/path restrictions.
const imageId=randomUUID();assert.equal((await mutate(actor,id,'reserve',current.revision,current.hash,{id:imageId,label:'Test image'})).error,null);
const path=`${actor.id}/${id}/${imageId}`,png=await sharp({create:{width:4,height:4,channels:3,background:'#aabbcc'}}).png().toBuffer(),webp=await sharp(png).webp().toBuffer();
assert.ok((await actor.client.storage.from('ingestion-evidence').upload(`${path}/wrong`,png,{contentType:'image/png'})).error);
assert.ok((await moderator.client.storage.from('ingestion-evidence').upload(`${path}/original`,png,{contentType:'image/png'})).error);
assert.ok((await actor.client.storage.from('ingestion-evidence').upload(`${path}/original`,Buffer.from('x'),{contentType:'image/svg+xml'})).error);
assert.ok((await actor.client.storage.from('ingestion-evidence').upload(`${path}/original`,Buffer.alloc(5242881),{contentType:'image/png'})).error);
assert.equal((await actor.client.storage.from('ingestion-evidence').upload(`${path}/original`,png,{contentType:'image/png'})).error,null);
assert.ok((await actor.client.storage.from('ingestion-evidence').download(`${path}/original`)).error);
assert.ok((await mutate(actor,id,'save',current.revision,current.hash,{draft,validation,source:{id:imageId,kind:'image',sha256:'a'.repeat(64),bytes:png.length,mime:'image/png'}})).error);
assert.equal((await actor.client.storage.from('ingestion-evidence').upload(`${path}/preview.webp`,webp,{contentType:'image/webp'})).error,null);
draft.sources.push({sourceId:imageId,kind:'image',locator:missing});r=await mutate(actor,id,'save',current.revision,current.hash,{draft,validation,source:{id:imageId,kind:'image',sha256:'a'.repeat(64),bytes:png.length,mime:'image/png'}});assert.equal(r.error,null);current=r.data;
assert.equal((await moderator.client.storage.from('ingestion-evidence').download(`${path}/preview.webp`)).error,null);
for(const a of accounts.slice(2))assert.ok((await a.client.storage.from('ingestion-evidence').download(`${path}/preview.webp`)).error);
assert.ok((await anonymous.storage.from('ingestion-evidence').download(`${path}/preview.webp`)).error);
assert.ok((await actor.client.storage.from('ingestion-evidence').upload(`${path}/original`,png,{contentType:'image/png',upsert:true})).error);
console.log('PASS real private storage reservation, MIME/size/path/owner denial, missing object failure and privileged review reads');
// State/idempotency, approval/edit race, rejection/reopening and stale tokens.
assert.ok((await mutate(actor,id,'ready',current.revision,current.hash,{validationHash:validation.validationHash},randomUUID(),'')).error,'Reasonless readiness must fail even when warnings are reviewable');
r=await mutate(actor,id,'ready',current.revision,current.hash,{validationHash:validation.validationHash},randomUUID(),'Reviewed limitations');assert.equal(r.error,null);current=r.data;
const approvalRequest=randomUUID(),prior={...current};r=await mutate(moderator,id,'approve',prior.revision,prior.hash,{validationHash:validation.validationHash},approvalRequest,'Reviewed');assert.equal(r.error,null);current=r.data;
assert.deepEqual((await mutate(moderator,id,'approve',prior.revision,prior.hash,{validationHash:validation.validationHash},approvalRequest,'Reviewed')).data,current);
assert.ok((await mutate(moderator,id,'approve',prior.revision,prior.hash,{validationHash:validation.validationHash},approvalRequest,'Different input')).error);
assert.ok((await mutate(actor,id,'save',prior.revision,prior.hash,{draft,validation})).error);
const exportRequest=randomUUID();const exported=await mutate(actor,id,'export',current.revision,current.hash,{validationHash:validation.validationHash},exportRequest);assert.equal(exported.error,null);assert.deepEqual(exported.data.approvedSnapshot,draft);assert.equal(exported.data.actor,actor.id);assert.ok(exported.data.exportedAt);
assert.equal((await admin.storage.from('ingestion-evidence').remove([`${path}/original`])).error,null);
assert.ok((await mutate(actor,id,'export',current.revision,current.hash,{validationHash:validation.validationHash})).error);
assert.ok((await mutate(actor,id,'export',current.revision,current.hash,{validationHash:validation.validationHash},exportRequest)).error);
assert.equal((await admin.storage.from('ingestion-evidence').upload(`${path}/original`,png,{contentType:'image/png'})).error,null);
r=await mutate(actor,id,'save',current.revision,current.hash,{draft:{...draft,values:{rows:[{...draft.values.rows[0],name:'Changed after approval'}]}},validation});assert.equal(r.error,null);current=r.data;assert.equal(current.state,'draft');assert.ok((await mutate(actor,id,'export',current.revision,current.hash,{validationHash:validation.validationHash})).error);
r=await mutate(actor,id,'reject',current.revision,current.hash,{},randomUUID(),'Uncertain source');assert.equal(r.error,null);const rejected=r.data;assert.ok((await mutate(actor,id,'approve',current.revision,current.hash,{validationHash:validation.validationHash})).error);
r=await mutate(moderator,id,'reopen',rejected.revision,rejected.hash,{},randomUUID(),'Clarification obtained');assert.equal(r.error,null);current=r.data;
assert.ok((await mutate(actor,id,'approve',rejected.revision,rejected.hash,{validationHash:validation.validationHash})).error);
console.log('PASS exact approved snapshot/export actor/time, duplicate approval retry, edit invalidation and stale rejected transitions');
// Two PostgreSQL connections overlap while one waits for the other's row lock.
const args=['exec','-i','supabase_db_varsityvue-phase1','psql','-X','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres','-At','-c'];
const statement=(cmd,req)=>`select public.ingestion_mutate(${q(actor.id)},${q(id)},${q(cmd)},${current.revision},${q(current.hash)},${q(req)},${q(JSON.stringify({draft,validation}))}::jsonb,null);`;
const a=spawn('docker',[...args,`begin;set local role service_role;set application_name='vv_ingestion_race_a';${statement('save',randomUUID())}select pg_sleep(6);commit;`]);let aOut='',aErr='';a.stdout.on('data',x=>aOut+=x);a.stderr.on('data',x=>aErr+=x);const aDone=new Promise(resolve=>a.on('exit',resolve));
for(let i=0;i<30;i++){if(sql("select count(*) from pg_stat_activity where application_name='vv_ingestion_race_a' and wait_event='PgSleep';")==='1')break;await new Promise(r=>setTimeout(r,100));}
const b=spawn('docker',[...args,`begin;set local role service_role;set application_name='vv_ingestion_race_b';${statement('save',randomUUID())}commit;`]);let bErr='';b.stderr.on('data',x=>bErr+=x);const bDone=new Promise(resolve=>b.on('exit',resolve));
let overlap;for(let i=0;i<30;i++){const rows=JSON.parse(sql("select coalesce(jsonb_agg(jsonb_build_object('pid',pid,'name',application_name,'xact_start',xact_start,'wait',wait_event_type,'event',wait_event)),'[]') from pg_stat_activity where application_name in ('vv_ingestion_race_a','vv_ingestion_race_b') and xact_start is not null;"));if(rows.length===2&&rows.some(x=>x.wait==='Lock')){overlap=rows;break;}await new Promise(r=>setTimeout(r,100));}
assert.ok(overlap);assert.equal(new Set(overlap.map(r=>r.pid)).size,2);assert.equal(await aDone,0,aErr);assert.notEqual(await bDone,0);assert.match(bErr,/Stale revision/);
console.log('PASS true competing-edit transactions with distinct backends and observed lock overlap',JSON.stringify(overlap));
// Trigger immutability also protects against privileged accidental history edits.
for(const table of ['ingestion_events','ingestion_revisions']){assert.throws(()=>sql(`update private.${table} set actor=${q(moderator.id)} where submission_id=${q(id)};`),/Command failed/);assert.throws(()=>sql(`delete from private.${table} where submission_id=${q(id)};`),/Command failed/);}
current=JSON.parse(sql(`select jsonb_build_object('revision',revision,'hash',review_hash) from private.ingestion_submissions where id=${q(id)};`));
r=await mutate(actor,id,'delete_source',current.revision,current.hash,{id:imageId},randomUUID(),'Retention cleanup');assert.equal(r.error,null);current=r.data;assert.ok((await actor.client.storage.from('ingestion-evidence').download(`${path}/preview.webp`)).error);assert.equal((await admin.storage.from('ingestion-evidence').remove([`${path}/original`,`${path}/preview.webp`])).error,null);
assert.equal(sql(`select count(*) from storage.objects where bucket_id='ingestion-evidence' and name in(${q(path+'/original')},${q(path+'/preview.webp')});`),'0');
assert.ok((await mutate(actor,id,'ready',current.revision,current.hash,{validationHash:validation.validationHash})).error);
const orphan=randomUUID();assert.equal((await mutate(actor,id,'reserve',current.revision,current.hash,{id:orphan,label:'Orphan reservation'})).error,null);const orphanPath=`${actor.id}/${id}/${orphan}/original`;assert.equal((await actor.client.storage.from('ingestion-evidence').upload(orphanPath,png,{contentType:'image/png'})).error,null);assert.equal((await mutate(actor,id,'fail_source',current.revision,current.hash,{id:orphan},randomUUID(),'Abandoned upload cleanup')).error,null);assert.equal((await admin.storage.from('ingestion-evidence').remove([orphanPath])).error,null);assert.equal(sql(`select count(*) from storage.objects where bucket_id='ingestion-evidence' and name=${q(orphanPath)};`),'0');
assert.equal(canonical(),before);console.log('PASS append-only protections, deleted evidence denial, orphan reservation cleanup and unchanged canonical sports sinks');
writeFileSync('/tmp/vv-phase1-db-results.json',JSON.stringify({result:'PASS',overlap,canonicalBefore:before,canonicalAfter:canonical(),accounts:accounts.map(a=>({name:a.name,id:a.id,email:a.email}))},null,2));
writeFileSync('/tmp/vv-phase1-local-accounts.json',JSON.stringify(accounts.map(a=>({name:a.name,id:a.id,email:a.email,password:a.password}))),{mode:0o600});
if(process.argv.includes('--serve')){
 const child=spawn('npm',['run','dev','--','--hostname','127.0.0.1','--port','3100'],{env:{...process.env,ENABLE_INTERNAL_TOOLS:'true',NEXT_PUBLIC_SUPABASE_URL:env.API_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:env.ANON_KEY,INGESTION_LOCAL_SERVICE_KEY:env.SERVICE_ROLE_KEY,NEXT_PUBLIC_TURNSTILE_SITE_KEY:'',NEXT_TELEMETRY_DISABLED:'1'},stdio:'inherit'});await new Promise(resolve=>child.on('exit',resolve));
}
