// All fixtures are disposable. This runner rejects non-loopback before any Auth/DB/Storage use.
import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
import sharp from 'sharp';
const env=JSON.parse(execFileSync('supabase',['status','-o','json'],{encoding:'utf8',stdio:['ignore','pipe','pipe']}));
assert.equal(new URL(env.API_URL).hostname,'127.0.0.1');
const service=createClient(env.API_URL,env.SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const accounts=JSON.parse(readFileSync('/tmp/vv-phase1-local-accounts.json','utf8'));
const sql=query=>execFileSync('docker',['exec','-i','supabase_db_varsityvue-phase1','psql','-X','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres','-At','-c',query],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const q=s=>"'"+String(s).replaceAll("'","''")+"'";
const canonical=()=>sql("select jsonb_object_agg(name,fingerprint) from (select 'roster' name,md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) fingerprint from public.school_roster_players t union all select 'scores',md5(coalesce(jsonb_agg(to_jsonb(t) order by game_id)::text,'')) from public.game_state t union all select 'pickem',md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) from public.pickem_weeks t union all select 'feed',md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) from public.team_feed_posts t) s;");
const canonicalBefore=canonical();
async function client(name){const a=accounts.find(a=>a.name===name);const c=createClient(env.API_URL,env.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});assert.equal((await c.auth.signInWithPassword({email:a.email,password:a.password})).error,null);return {a,c};}
const admin=await client('admin'),moderator=await client('moderator');
const results=[];
const absent={state:'omitted'};
const rosterVersion=sql("select md5(coalesce(jsonb_agg(to_jsonb(t) order by id)::text,'')) from public.school_roster_players t;");
function payload(id,actor=admin.a.id){const source=randomUUID();return {school:'albany',season:2027,class:'roster',operation:'create',source:{id:source,kind:'text',label:'Pilot fixture',body:'Synthetic local record'},draft:{schemaVersion:1,draftId:id,dataClass:'roster',operation:'create',schoolSlug:'albany',season:2027,target:{match:{state:'unresolved',candidates:[]},expectedRevision:absent},sources:[{sourceId:source,kind:'text',locator:absent}],evidence:[],identityMatches:[],availability:[],issues:[],disposition:'pending',values:{rows:[{rowId:randomUUID(),name:'Pilot fixture',player:{state:'confirmed',id:'new:albany-pilot-fixture-2027',confirmedBy:actor},jerseyNumber:absent,grade:absent,positions:absent,height:absent,weight:absent}]}},validation:{managedRosterVersion:rosterVersion,reviewable:true,validationHash:'synthetic-trusted-pilot'}};}
const mutate=(id,command,revision=0,hash=null,payload={},actor=admin.a.id,request=randomUUID())=>service.rpc('ingestion_mutate',{p_actor:actor,p_id:id,p_command:command,p_revision:revision,p_hash:hash,p_payload:payload,p_request:request});
const baseCount=Number(sql('select count(*) from private.ingestion_submissions;'));
sql('delete from private.ingestion_pilot_usage;delete from private.ingestion_request_usage;');
const ids=[];
for(let i=0;i<25;i++){const id=randomUUID();ids.push(id);const r=await mutate(id,'create',0,null,payload(id));assert.equal(r.error,null);}
const first=await admin.c.rpc('ingestion_inbox',{p_limit:20});assert.equal(first.error,null);assert.equal(first.data.length,20);const last=first.data.at(-1);
let all=[...first.data],cursor=last;while(cursor){const page=await admin.c.rpc('ingestion_inbox',{p_before:cursor.created_at,p_before_id:cursor.id,p_limit:20});assert.equal(page.error,null);all.push(...page.data);cursor=page.data.length===20?page.data.at(-1):null;}assert.equal(all.length,baseCount+25);assert.equal(new Set(all.map(x=>x.id)).size,all.length);
assert.ok((await admin.c.rpc('ingestion_inbox',{p_limit:21})).error);assert.ok((await admin.c.rpc('ingestion_inbox',{p_before:last.created_at})).error);
const id=ids[0];let current=(await admin.c.rpc('ingestion_read',{p_id:id})).data;
for(let i=0;i<23;i++){const r=await mutate(id,'save',current.revision,current.review_hash,{draft:current.current.draft,validation:current.current.validation});assert.equal(r.error,null);current=(await admin.c.rpc('ingestion_read',{p_id:id})).data;}
assert.equal(current.history.length,20);assert.ok(current.history.every(e=>!('snapshot' in e)));
const older=await admin.c.rpc('ingestion_history',{p_id:id,p_before:current.history.at(-1).id});assert.equal(older.error,null);assert.equal(older.data.length,4);assert.equal(new Set([...older.data,...current.history].map(e=>e.id)).size,24);
assert.ok((await admin.c.rpc('ingestion_history',{p_id:id,p_limit:21})).error);
assert.ok((await service.rpc('ingestion_mutate_phase1',{p_actor:admin.a.id,p_id:id,p_command:'save',p_revision:current.revision,p_hash:current.review_hash,p_request:randomUUID(),p_payload:{}})).error);
results.push('bounded keyset inbox/history, metadata-only event pages, creation recovery fields and revoked legacy service RPC');
for(const name of ['member','coach','suspended','inactive']){const x=await client(name);assert.equal((await x.c.rpc('ingestion_pilot_access')).data,false);for(const rpc of ['ingestion_inbox','ingestion_history','ingestion_cleanup_candidates'])assert.ok((await x.c.rpc(rpc,rpc==='ingestion_history'?{p_id:id}:{})).error);}
assert.ok((await moderator.c.rpc('ingestion_cleanup_candidates')).error);
assert.ok((await admin.c.rpc('ingestion_admit',{p_actor:admin.a.id,p_kind:'write'})).error);
for(const t of ['ingestion_pilot_control','ingestion_pilot_usage','ingestion_request_usage'])assert.equal(sql(`select has_table_privilege('authenticated','private.${t}','UPDATE');`),'f');
results.push('existing active role/suspension denial, admin-only operator queue and protected gate/admission tables');
// Admission counters remain after a separate later mutation fails.
sql(`insert into private.ingestion_request_usage values(${q(admin.a.id)},'write',date_trunc('minute',clock_timestamp()),59) on conflict(actor,kind,minute) do update set requests=59;`);
assert.equal((await service.rpc('ingestion_admit',{p_actor:admin.a.id,p_kind:'write'})).data,true);
assert.ok((await mutate(id,'save',current.revision,current.review_hash,{invalid:true})).error);
assert.equal((await service.rpc('ingestion_admit',{p_actor:admin.a.id,p_kind:'write'})).data,false);
assert.ok((await mutate(id,'save',current.revision,current.review_hash,{huge:'x'.repeat(1048577)})).error);
sql('delete from private.ingestion_pilot_usage;');
const request=randomUUID(),saved=await mutate(id,'save',current.revision,current.review_hash,{draft:current.current.draft,validation:current.current.validation},admin.a.id,request);assert.equal(saved.error,null);
sql(`update private.ingestion_pilot_usage set writes=60 where actor=${q(admin.a.id)};`);
assert.deepEqual((await mutate(id,'save',current.revision,current.review_hash,{draft:current.current.draft,validation:current.current.validation},admin.a.id,request)).data,saved.data);
assert.ok((await mutate(id,'save',saved.data.revision,saved.data.hash,{draft:current.current.draft,validation:current.current.validation})).error);
sql('delete from private.ingestion_pilot_usage;delete from private.ingestion_request_usage;');
results.push('failed input consumes independently committed request budget; 60/min mutation cap and free exact duplicate retry; payload cap');
// Hold the final admission slot in one real PostgreSQL transaction. Competitor blocks.
sql(`insert into private.ingestion_request_usage values(${q(admin.a.id)},'write',date_trunc('minute',clock_timestamp()),59);`);
const args=['exec','-i','supabase_db_varsityvue-phase1','psql','-X','-v','ON_ERROR_STOP=1','-U','postgres','-d','postgres','-At','-c'];
const admission=`select public.ingestion_admit(${q(admin.a.id)},'write');`;
function start(query){const child=spawn('docker',[...args,query]);let output='',error='';child.stdout.on('data',x=>output+=x);child.stderr.on('data',x=>error+=x);const done=new Promise(resolve=>child.on('exit',code=>resolve({code,output,error})));return {done};}
const a=start(`begin;set local role service_role;set application_name='vv_pilot_admit_a';${admission}select pg_sleep(4);commit;`);
for(let i=0;i<50;i++){if(sql("select count(*) from pg_stat_activity where application_name='vv_pilot_admit_a' and wait_event='PgSleep';")==='1')break;await new Promise(r=>setTimeout(r,50));}
const b=start(`begin;set local role service_role;set application_name='vv_pilot_admit_b';${admission}commit;`);let overlap;
for(let i=0;i<40;i++){const rows=JSON.parse(sql("select coalesce(jsonb_agg(jsonb_build_object('pid',pid,'name',application_name,'wait',wait_event_type,'event',wait_event,'xact_start',xact_start)),'[]') from pg_stat_activity where application_name in ('vv_pilot_admit_a','vv_pilot_admit_b') and xact_start is not null;"));if(rows.length===2&&rows.some(r=>r.wait==='Lock')){overlap=rows;break;}await new Promise(r=>setTimeout(r,50));}
assert.ok(overlap);assert.equal(new Set(overlap.map(r=>r.pid)).size,2);assert.match((await a.done).output,/\nt\n/);assert.match((await b.done).output,/\nf\n/);
sql('delete from private.ingestion_request_usage;delete from private.ingestion_pilot_usage;');
results.push('real competing last-slot admission transactions with distinct backend IDs and observed lock overlap');
// Physical orphan cleanup is audited, denies finalized objects and preserves history.
current=(await admin.c.rpc('ingestion_read',{p_id:id})).data;
const source=randomUUID();assert.equal((await mutate(id,'reserve',current.revision,current.review_hash,{id:source,label:'Pilot orphan'})).error,null);
const prefix=`${admin.a.id}/${id}/${source}`,png=await sharp({create:{width:4,height:4,channels:3,background:'#fff'}}).png().toBuffer();
assert.equal((await admin.c.storage.from('ingestion-evidence').upload(`${prefix}/original`,png,{contentType:'image/png'})).error,null);
assert.equal((await mutate(id,'fail_source',current.revision,current.review_hash,{id:source},admin.a.id,randomUUID())).error?.message,'Reason required');
const failed=await service.rpc('ingestion_mutate',{p_actor:admin.a.id,p_id:id,p_command:'fail_source',p_revision:current.revision,p_hash:current.review_hash,p_request:randomUUID(),p_payload:{id:source},p_reason:'Abandoned disposable upload'});assert.equal(failed.error,null);
const queue=await admin.c.rpc('ingestion_cleanup_candidates');assert.equal(queue.error,null);assert.ok(queue.data.some(r=>r.id===source));assert.ok((await admin.c.rpc('ingestion_cleanup_candidates',{p_limit:21})).error);
const attempt=randomUUID(),audit={p_actor:admin.a.id,p_source:source,p_attempt:attempt,p_reason:'Audited disposable orphan cleanup'};
assert.ok((await service.rpc('ingestion_cleanup_audit',{...audit,p_actor:moderator.a.id})).error);
const plan=await service.rpc('ingestion_cleanup_audit',audit);assert.equal(plan.error,null);assert.deepEqual(plan.data.paths,[`${prefix}/original`,`${prefix}/preview.webp`]);
assert.equal((await service.storage.from('ingestion-evidence').remove(plan.data.paths)).error,null);
assert.equal((await service.rpc('ingestion_cleanup_audit',{...audit,p_complete:true})).error,null);
assert.equal((await service.rpc('ingestion_cleanup_audit',{...audit,p_complete:true})).error,null);
assert.equal(sql(`select count(*) from private.ingestion_events where submission_id=${q(id)} and command in ('cleanup_attempt','cleanup_result');`),'2');
assert.equal(sql(`select count(*) from storage.objects where bucket_id='ingestion-evidence' and name=${q(prefix+'/original')};`),'0');
assert.throws(()=>sql(`delete from private.ingestion_events where submission_id=${q(id)};`));
results.push('admin-only audited cleanup attempt/result, idempotent outcome, real Storage removal and immutable history');
// The disabled database gate rejects direct RPCs and Storage without relying on the UI.
current=(await admin.c.rpc('ingestion_read',{p_id:id})).data;const blockedSource=randomUUID();assert.equal((await mutate(id,'reserve',current.revision,current.review_hash,{id:blockedSource,label:'Gate fixture'})).error,null);
sql('update private.ingestion_pilot_control set enabled=false where singleton;');
assert.equal((await admin.c.rpc('ingestion_pilot_access')).data,false);
for(const rpc of ['ingestion_read','ingestion_inbox','ingestion_history','ingestion_roster_catalog','ingestion_cleanup_candidates'])assert.ok((await admin.c.rpc(rpc,['ingestion_read','ingestion_history'].includes(rpc)?{p_id:id}:{})).error);
assert.ok((await mutate(id,'save',current.revision,current.review_hash,{})).error);
assert.equal((await service.rpc('ingestion_admit',{p_actor:admin.a.id,p_kind:'write'})).data,false);
assert.ok((await admin.c.storage.from('ingestion-evidence').upload(`${admin.a.id}/${id}/${blockedSource}/original`,png,{contentType:'image/png'})).error);
sql('update private.ingestion_pilot_control set enabled=true where singleton;');
results.push('database disable closes direct RPC, service mutation/admission and Storage reservation writes');

// Real Storage policy reservation lock overlaps a concurrent audited failure.
current=(await admin.c.rpc('ingestion_read',{p_id:id})).data;const lockSource=randomUUID();
assert.equal((await mutate(id,'reserve',current.revision,current.review_hash,{id:lockSource,label:'Storage locking fixture'})).error,null);
const lockPath=`${admin.a.id}/${id}/${lockSource}/original`;
const claim=JSON.stringify({sub:admin.a.id,role:'authenticated'});
const lockA=start(`begin;set local role authenticated;set local request.jwt.claims=${q(claim)};set application_name='vv_pilot_storage_a';select private.ingestion_object_allowed(${q(lockPath)},true);select pg_sleep(4);commit;`);
for(let i=0;i<50;i++){if(sql("select count(*) from pg_stat_activity where application_name='vv_pilot_storage_a' and wait_event='PgSleep';")==='1')break;await new Promise(r=>setTimeout(r,50));}
const failStatement=`select public.ingestion_mutate(${q(admin.a.id)},${q(id)},'fail_source',${current.revision},${current.review_hash?q(current.review_hash):'null'},${q(randomUUID())},${q(JSON.stringify({id:lockSource}))}::jsonb,'Abandoned lock fixture');`;
const lockB=start(`begin;set local role service_role;set application_name='vv_pilot_storage_b';${failStatement}commit;`);let storageOverlap;
for(let i=0;i<40;i++){const rows=JSON.parse(sql("select coalesce(jsonb_agg(jsonb_build_object('pid',pid,'name',application_name,'wait',wait_event_type,'event',wait_event,'xact_start',xact_start)),'[]') from pg_stat_activity where application_name in ('vv_pilot_storage_a','vv_pilot_storage_b') and xact_start is not null;"));if(rows.length===2&&rows.some(r=>r.wait==='Lock')){storageOverlap=rows;break;}await new Promise(r=>setTimeout(r,50));}
assert.ok(storageOverlap);assert.equal(new Set(storageOverlap.map(r=>r.pid)).size,2);assert.equal((await lockA.done).code,0);assert.equal((await lockB.done).code,0);
assert.ok((await admin.c.storage.from('ingestion-evidence').upload(lockPath,png,{contentType:'image/png'})).error);
results.push('Storage reservation gate/share locks overlap a waiting source failure; subsequent real Storage upload denied');

// Quotas tested using marked, no-history fixtures; only local private staging is modified.
const marker=randomUUID();
sql(`insert into private.ingestion_submissions(id,creator,school_slug,season,data_class,operation) select gen_random_uuid(),${q(marker)},'albany',2027,'roster','create' from generate_series(1,2000-(select count(*)::integer from private.ingestion_submissions));`);
const overGlobal=randomUUID();assert.match((await mutate(overGlobal,'create',0,null,payload(overGlobal))).error.message,/submission quota/);
sql(`delete from private.ingestion_submissions where creator=${q(marker)};`);
const capsId=randomUUID();assert.equal((await mutate(capsId,'create',0,null,payload(capsId))).error,null);let caps=(await admin.c.rpc('ingestion_read',{p_id:capsId})).data;
sql(`update private.ingestion_submissions set revision=200 where id=${q(capsId)};`);
assert.ok((await mutate(capsId,'save',200,caps.review_hash,{draft:caps.current.draft,validation:caps.current.validation})).error);
sql(`update private.ingestion_submissions set revision=${caps.revision} where id=${q(capsId)};`);
results.push('global 2,000-submission quota and bounded 200-revision storage growth');

const dailySeeds=JSON.parse(sql(`with t as (insert into private.ingestion_submissions(id,creator,school_slug,season,data_class,operation) select gen_random_uuid(),${q(admin.a.id)},'albany',2027,'roster','create' from generate_series(1,100-(select count(*)::integer from private.ingestion_submissions where creator=${q(admin.a.id)} and created_at>=date_trunc('day',clock_timestamp()))) returning id) select jsonb_agg(id) from t;`));
const overDaily=randomUUID();assert.match((await mutate(overDaily,'create',0,null,payload(overDaily))).error.message,/submission quota/);
sql(`delete from private.ingestion_submissions where id in(${dailySeeds.map(q).join(',')});`);
const sourceMarker=randomUUID();sql(`insert into private.ingestion_sources(id,submission_id,owner_id,kind,label,state) select gen_random_uuid(),${q(capsId)},${q(admin.a.id)},'text',${q(sourceMarker)},'failed' from generate_series(1,31);`);
assert.match((await mutate(capsId,'reserve',caps.revision,caps.review_hash,{id:randomUUID(),label:'Over source quota'})).error.message,/source limit/);
sql(`delete from private.ingestion_sources where label=${q(sourceMarker)};`);
const charged=Number(sql("select count(*) from private.ingestion_sources s where kind='image' and (s.state in ('reserved','finalized') or exists(select 1 from storage.objects o where o.bucket_id='ingestion-evidence' and o.name in(s.object_path,s.preview_path)));"));
sql(`insert into private.ingestion_submissions(id,creator,school_slug,season,data_class,operation) select gen_random_uuid(),${q(marker)},'albany',2027,'roster','create' from generate_series(1,50-${charged});`);
sql(`insert into private.ingestion_sources(id,submission_id,owner_id,kind,label,state,object_path,preview_path) select sid,id,creator,'image','Budget fixture','reserved',creator::text||'/'||id::text||'/'||sid::text||'/original',creator::text||'/'||id::text||'/'||sid::text||'/preview.webp' from (select gen_random_uuid() sid,id,creator from private.ingestion_submissions where creator=${q(marker)}) t;`);
assert.match((await mutate(capsId,'reserve',caps.revision,caps.review_hash,{id:randomUUID(),label:'Over budget'})).error.message,/evidence budget/);
sql(`delete from private.ingestion_sources where owner_id=${q(marker)};delete from private.ingestion_submissions where creator=${q(marker)};`);
results.push('100 creations/actor/day, 32 total sources/submission and atomic 50-image-pair/500 MiB reservation budget');
assert.equal(canonical(),canonicalBefore);
sql(`insert into private.ingestion_request_usage values(${q(admin.a.id)},'read',date_trunc('minute',clock_timestamp()),300) on conflict(actor,kind,minute) do update set requests=300;`);
assert.match((await admin.c.rpc('ingestion_inbox')).error.message,/read rate/);
sql("delete from private.ingestion_request_usage where kind='read';");
results.push('direct authenticated read RPC cannot bypass exhausted database admission');
const bytesBefore=sql('select payload_bytes from private.ingestion_pilot_control where singleton;');
sql('update private.ingestion_pilot_control set payload_bytes=134217728 where singleton;');
const blockedBudget=await mutate(capsId,'save',caps.revision,caps.review_hash,{draft:caps.current.draft,validation:caps.current.validation});assert.ok(blockedBudget.error);
assert.equal(sql(`select revision from private.ingestion_submissions where id=${q(capsId)};`),String(caps.revision));
sql(`update private.ingestion_pilot_control set payload_bytes=${bytesBefore} where singleton;`);
assert.equal(sql("select (select payload_bytes from private.ingestion_pilot_control)=coalesce(sum(bytes),0) from (select octet_length(to_jsonb(t)::text) bytes from private.ingestion_submissions t union all select octet_length(to_jsonb(t)::text) from private.ingestion_sources t union all select octet_length(to_jsonb(t)::text) from private.ingestion_revisions t union all select octet_length(to_jsonb(t)::text) from private.ingestion_events t) x;"),'t');
results.push('128 MiB transactional logical-payload budget includes immutable snapshots; exhausted save rolls back revision/event changes; accounting exact');
results.push('canonical roster, score state, Pick Em and Team Feed fingerprints unchanged');

sql('delete from private.ingestion_request_usage;delete from private.ingestion_pilot_usage;');
// SQL NULL is distinct from omission: exercise real RPCs with >20 eligible rows.
const pageChecks=[];
const cleanupMarker=randomUUID(),cleanupPaths=[];
for(let n=0;n<25;n++) {
 const sid=randomUUID(),path=`${admin.a.id}/${capsId}/${sid}/original`;cleanupPaths.push(path);
 sql(`insert into private.ingestion_sources(id,submission_id,owner_id,kind,label,state,object_path,preview_path) values(${q(sid)},${q(capsId)},${q(admin.a.id)},'image',${q(cleanupMarker)},'failed',${q(path)},${q(path.replace('/original','/preview.webp'))});`);
 assert.equal((await service.storage.from('ingestion-evidence').upload(path,png,{contentType:'image/png'})).error,null);
}
try {
 for(const [rpc,args,countSql] of [
  ['ingestion_inbox',{},'select count(*) from private.ingestion_submissions;'],
  ['ingestion_history',{p_id:id},`select count(*) from private.ingestion_events where submission_id=${q(id)};`],
  ['ingestion_cleanup_candidates',{},`select count(*) from private.ingestion_sources where label=${q(cleanupMarker)};`]
 ]) {
  const eligible=Number(sql(countSql));assert.ok(eligible>20);
  const omitted=await admin.c.rpc(rpc,args);assert.equal(omitted.error,null);assert.equal(omitted.data.length,20);
  for(const limit of [null,0,-1,21]) {
   const rejected=await admin.c.rpc(rpc,{...args,p_limit:limit});assert.ok(rejected.error);assert.match(rejected.error.message,/Invalid bounded/);
  }
  for(const limit of [1,7,20]) {const r=await admin.c.rpc(rpc,{...args,p_limit:limit});assert.equal(r.error,null);assert.equal(r.data.length,limit);}
  const unauthorized=[createClient(env.API_URL,env.ANON_KEY,{auth:{persistSession:false}})];
  for(const name of ['member','coach','suspended','inactive'])unauthorized.push((await client(name)).c);
  if(rpc==='ingestion_cleanup_candidates')unauthorized.push(moderator.c);
  for(const c of unauthorized)for(const input of [args,...[null,0,-1,21,1,20].map(p_limit=>({...args,p_limit}))])assert.ok((await c.rpc(rpc,input)).error);
  pageChecks.push({rpc,eligibleRows:eligible,omittedLimitRows:20,rejectedLimits:[null,0,-1,21],validLimits:[1,7,20],unauthorizedCallers:unauthorized.length,result:'PASS'});
 }
 // Audit other new nullable checks: no NULL admission-kind succeeds or mutates counters.
 const admissionBefore=sql("select coalesce(jsonb_agg(to_jsonb(t) order by actor,kind,minute),'[]') from private.ingestion_request_usage t;");
 assert.ok((await service.rpc('ingestion_admit',{p_actor:admin.a.id,p_kind:null})).error);
 assert.equal(sql("select coalesce(jsonb_agg(to_jsonb(t) order by actor,kind,minute),'[]') from private.ingestion_request_usage t;"),admissionBefore);
 assert.equal((await service.rpc('ingestion_admit',{p_actor:null,p_kind:'read'})).data,false);
 results.push('three RPCs: >20 eligible rows, omitted default=20, explicit NULL/0/-1/21 rejected, 1/7/20 bounded, all unauthorized roles denied; NULL admission fails closed');
} finally {
 assert.equal((await service.storage.from('ingestion-evidence').remove(cleanupPaths)).error,null);
 sql(`delete from private.ingestion_sources where label=${q(cleanupMarker)};`);
}
assert.equal(canonical(),canonicalBefore);
sql('delete from private.ingestion_request_usage;delete from private.ingestion_pilot_usage;');
writeFileSync('/tmp/vv-readiness-pilot-db-results.json',JSON.stringify({result:'PASS',results,pageChecks,overlap,storageOverlap,canonicalBefore,canonicalAfter:canonical()},null,2)+'\n');
for(const r of results)console.log('PASS '+r);console.log('ADMISSION_OVERLAP '+JSON.stringify(overlap));
