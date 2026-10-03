// Infrastructure only: real local Supabase; no production credentials or data.
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {spawn,execFileSync} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {chromium} from 'playwright';
const v=Object.fromEntries(readFileSync(process.env.PR34_LOCAL_ENV,'utf8').split('\n').filter(x=>x.includes('=')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).replace(/^"|"$/g,'')]}));
const api=v.API_URL, key=v.ANON_KEY, service=v.SERVICE_ROLE_KEY;
assert.equal(api,'http://127.0.0.1:54321');assert.ok(key&&service);
const base='http://127.0.0.1:3000', evidence='pr34-evidence';
mkdirSync(evidence,{recursive:true});
const results={}; const pass=k=>{results[k]='PASS';console.log(k+': PASS')};
const sql=q=>execFileSync('psql',['-X','-At','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p','54322','-U','postgres','-d','postgres','-c',q],{encoding:'utf8',env:{...process.env,PGPASSWORD:'postgres'}}).trim();
const required=['profiles','member_account_status','user_roles','contributor_applications','contributor_school_assignments','contributor_recruitment_pipeline'];
for(const t of required)assert.equal(sql("select to_regclass('public."+t+"') is not null"),'t');
assert.equal(sql("select to_regprocedure('public.review_contributor_application(uuid,text,text)') is not null"),'t');
assert.equal(sql('select max(version) from supabase_migrations.schema_migrations'),'20261002200333');
pass('canonical_schema');
async function req(path,token,method='GET',body){
 const r=await fetch(api+path,{method,headers:{apikey:key,Authorization:'Bearer '+token,'Content-Type':'application/json',Prefer:'return=representation'},body:body===undefined?undefined:JSON.stringify(body)});
 let data;try{data=await r.json()}catch{data=null}return {ok:r.ok,status:r.status,data};
}
async function user(name){
 const password=randomBytes(24).toString('base64url'), email='pr34-'+name+'@example.invalid';
 let r=await fetch(api+'/auth/v1/admin/users',{method:'POST',headers:{apikey:service,Authorization:'Bearer '+service,'Content-Type':'application/json'},body:JSON.stringify({email,password,email_confirm:true,user_metadata:{display_name:'Disposable '+name}})});
 assert.ok(r.ok,'fixture creation');
 const id=(await r.json()).id;
 r=await req('/auth/v1/token?grant_type=password',key,'POST',{email,password,gotrue_meta_security:{captcha_token:'XXXX.DUMMY.TOKEN.XXXX'}});assert.ok(r.ok,'fixture session');
 return {id,session:r.data};
}
const actors={};
for(const name of ['member','pending','deferred','declined','withdrawn','keeper','coach','revoked','removed','suspended','admin'])actors[name]=await user(name);
sql("insert into public.user_roles(user_id,role) values('"+actors.admin.id+"','admin')");
pass('disposable_auth_fixtures');
const application=(u,school='de-leon',role='scorekeeper')=>({applicant_id:u.id,school_slug:school,requested_role:role,affiliation:'Disposable verification',contact_detail:'test@example.invalid',experience_note:'Disposable integration fixture for contributor verification only.'});
async function submit(u,school,role){const r=await req('/rest/v1/contributor_applications',u.session.access_token,'POST',application(u,school,role));assert.ok(r.ok,'application submission');assert.equal(r.data[0].status,'pending');return r.data[0].id}
async function review(id,decision){const r=await req('/rest/v1/rpc/review_contributor_application',actors.admin.session.access_token,'POST',{target_application_id:id,decision,note:'Disposable verification only'});assert.ok(r.ok,'admin '+decision)}
const apps={};
for(const n of ['pending','deferred','declined','withdrawn','keeper','coach','revoked','removed'])apps[n]=await submit(actors[n],'de-leon',n==='coach'?'coach':'scorekeeper');
let dup=await req('/rest/v1/contributor_applications',actors.pending.session.access_token,'POST',application(actors.pending));assert.equal(dup.data.code,'23505');pass('duplicate_pending');
await submit(actors.pending,'cisco');pass('second_school');
await review(apps.deferred,'defer');
dup=await req('/rest/v1/contributor_applications',actors.deferred.session.access_token,'POST',application(actors.deferred));assert.equal(dup.data.code,'23505');pass('deferred_active_duplicate');
await review(apps.declined,'decline');
await submit(actors.declined);sql("update public.contributor_applications set status='declined' where applicant_id='"+actors.declined.id+"'");pass('declined_reapply');
sql("update public.contributor_applications set status='withdrawn' where id='"+apps.withdrawn+"'");
await submit(actors.withdrawn);sql("update public.contributor_applications set status='withdrawn' where applicant_id='"+actors.withdrawn.id+"'");pass('withdrawn_reapply');
for(const n of ['keeper','coach','revoked','removed'])await review(apps[n],'approve');
assert.equal(sql("select count(*) from public.user_roles where user_id='"+actors.keeper.id+"' and role='scorekeeper'"),'1');
assert.equal(sql("select count(*) from public.contributor_school_assignments where user_id='"+actors.keeper.id+"' and assignment_role='scorekeeper' and active"),'1');
pass('admin_approval_role_assignment');
assert.equal(sql("select assignment_role from public.contributor_school_assignments where user_id='"+actors.coach.id+"'"),'coach');pass('coach_assignment');
sql("update public.contributor_school_assignments set active=false where user_id='"+actors.revoked.id+"';delete from public.user_roles where user_id='"+actors.removed.id+"' and role='scorekeeper';update public.member_account_status set status='suspended',suspended_at=now() where user_id='"+actors.suspended.id+"'");
const denied=await req('/rest/v1/rpc/review_contributor_application',actors.member.session.access_token,'POST',{target_application_id:apps.pending,decision:'approve',note:null});assert.equal(denied.data.code,'42501');pass('ordinary_member_cannot_approve');
// App outbound fetch is restricted to local disposable services, including analytics.
const guard=evidence+'/local-fetch-guard.cjs';
writeFileSync(guard,"const original=global.fetch;global.fetch=(input,...args)=>{const u=new URL(typeof input==='string'?input:input.url||String(input));if(!['127.0.0.1','localhost','[::1]'].includes(u.hostname))return Promise.reject(new Error('Disposable runtime blocks external fetch'));return original(input,...args)};");
const env={PATH:process.env.PATH,HOME:process.env.HOME,CI:'1',NODE_ENV:'development',NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:api,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:key,NEXT_PUBLIC_TURNSTILE_SITE_KEY:'1x00000000000000000000AA',NODE_OPTIONS:'--require '+process.cwd()+'/'+guard};
const log=await import('node:fs').then(fs=>fs.openSync(evidence+'/runtime.log','w',0o600));
const app=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3000'],{env,stdio:['ignore',log,log]});
let browser;
try{
 for(let i=0;i<120;i++){try{if((await fetch(base+'/scoreboard')).ok)break}catch{}assert.notEqual(i,119,'runtime readiness');await new Promise(r=>setTimeout(r,500))}
 browser=await chromium.launch();
 async function contextFor(u){
  const c=await browser.newContext({viewport:{width:400,height:900}});
  await c.route('**/*',route=>{const url=new URL(route.request().url());return ['127.0.0.1','localhost','challenges.cloudflare.com'].includes(url.hostname)?route.continue():route.abort()});
  if(u){const encoded='base64-'+Buffer.from(JSON.stringify(u.session)).toString('base64url');const chunks=encoded.match(/.{1,3180}/g);await c.addCookies(chunks.map((value,i)=>({name:chunks.length===1?'sb-127-auth-token':'sb-127-auth-token.'+i,value,url:base,sameSite:'Lax',httpOnly:false})))}
  return c;
 }
 const labels={signed_out:'Become a Scorekeeper',member:'Become a Scorekeeper',pending:'View application status',deferred:'View application status',declined:'Become a Scorekeeper',withdrawn:'Become a Scorekeeper',keeper:'Report a Score',coach:'View contributor access',revoked:'View contributor access',removed:'View contributor access',suspended:'View contributor information'};
 for(const [name,label] of Object.entries(labels)){
  const c=await contextFor(actors[name]),p=await c.newPage();
  const r=await p.goto(base+'/scoreboard');assert.equal(r.status(),200);
  const card=p.getByRole('region',{name:'Scorekeeper participation'});await card.getByRole('link',{name:label,exact:true}).waitFor();
  const html=await card.innerHTML();
  assert.ok(!/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(html));
  for(const forbidden of ['applicant_id','reviewed_by','user_id','Disposable integration fixture'])assert.ok(!html.includes(forbidden));
  await p.screenshot({path:evidence+'/state-'+name+'.png',fullPage:true});pass('browser_'+name);await c.close();
 }
 const c=await contextFor(actors.member),p=await c.newPage();
 await p.goto(base+'/contributors?school=de-leon&role=scorekeeper');
 assert.equal(await p.locator('[name=school_slug]').inputValue(),'de-leon');
 assert.equal(await p.locator('[name=requested_role]').inputValue(),'scorekeeper');
 await p.locator('[name=school_slug]').selectOption('cisco');await p.locator('[name=school_slug]').selectOption('de-leon');pass('editable_valid_prefill');
 await p.locator('[name=affiliation]').fill('Disposable local fan');
 await p.locator('[name=contact_detail]').fill('test@example.invalid');
 await p.locator('[name=experience_note]').fill('I can provide accurate local LIVE scores for this disposable verification.');
 await p.getByRole('button',{name:'Submit Application'}).click();await p.waitForURL(/submitted=true/);
 assert.equal(sql("select status from public.contributor_applications where applicant_id='"+actors.member.id+"' and school_slug='de-leon'"),'pending');pass('real_browser_application_submission');
 await p.goto(base+'/contributors?school=de-leon&role=scorekeeper');assert.equal(await p.locator('[name=school_slug] option[value=de-leon]').count(),0);assert.ok(await p.locator('[name=school_slug] option[value=cisco]').count());pass('pending_prefill_no_duplicate');
 await p.goto(base+'/contributors?school=not-a-school&role=admin');assert.equal(await p.locator('[name=school_slug]').inputValue(),'');assert.equal(await p.locator('[name=requested_role]').inputValue(),'scorekeeper');pass('invalid_prefill');
 await c.close();
 const signed=await contextFor(),sp=await signed.newPage();
 await sp.goto(base+'/scoreboard');
 await sp.getByRole('region',{name:'Scorekeeper participation'}).getByRole('link',{name:'Become a Scorekeeper'}).click();
 await sp.getByRole('heading',{name:'Sign in to apply'}).waitFor();pass('signed_out_clickthrough');
 await sp.goto(base+'/contributors?school=de-leon&role=scorekeeper');
 for(const label of ['Create Account','Sign In']){
  const href=await sp.getByRole('link',{name:label,exact:true}).getAttribute('href');
  assert.equal(new URL(href,base).searchParams.get('next'),'/contributors?school=de-leon&role=scorekeeper');
  await sp.goto(new URL(href,base).href);
  assert.equal(await sp.locator('[name=next]').inputValue(),'/contributors?school=de-leon&role=scorekeeper');
  await sp.goto(base+'/contributors?school=de-leon&role=scorekeeper');
 }
 await sp.goto(base+'/login?next=https://example.invalid/unsafe');
 assert.equal(await sp.locator('[name=next]').inputValue(),'/account');pass('auth_intent_paths');
 await signed.clearCookies();
 const signupEmail='pr34-browser-signup@example.invalid',signupPassword=randomBytes(24).toString('base64url');
 await sp.goto(base+'/contributors?school=de-leon&role=scorekeeper');
 await sp.getByRole('link',{name:'Create Account',exact:true}).click();
 await sp.locator('[name=display_name]').fill('Disposable signup');
 await sp.locator('[name=email]').fill(signupEmail);
 await sp.locator('[name=password]').fill(signupPassword);
 await sp.getByRole('button',{name:'Create VarsityVue Account',exact:true}).click({timeout:60000});
 await sp.waitForURL(/status=confirmation-pending/);
 let body;
 for(let i=0;i<30;i++){
  const r=await fetch('http://127.0.0.1:54324/view/latest.html?query='+encodeURIComponent('to:'+signupEmail));
  if(r.ok){body=await r.text();break}
  await new Promise(r=>setTimeout(r,500));
 }
 assert.ok(body,'Local confirmation mail');
 const links=[...body.matchAll(/(?:href="|https?:\/\/)([^"\s<>]+)/g)].map(m=>m[0].startsWith('href')?m[1]:m[0]);
 const verification=links.find(x=>x.includes('/auth/v1/verify'));assert.ok(verification);
 const verifyUrl=new URL(verification.replaceAll('&amp;','&'));
 assert.ok(['127.0.0.1','localhost'].includes(verifyUrl.hostname));assert.equal(verifyUrl.port,'54321');
 await sp.goto(verifyUrl.href);
 await sp.waitForURL(url=>url.pathname==='/contributors');
 assert.equal(await sp.locator('[name=school_slug]').inputValue(),'de-leon');
 assert.equal(await sp.locator('[name=requested_role]').inputValue(),'scorekeeper');pass('browser_signup_email_confirmation_return');
 await signed.clearCookies();
 await sp.goto(base+'/contributors?school=de-leon&role=scorekeeper');
 await sp.getByRole('link',{name:'Sign In',exact:true}).click();
 await sp.locator('[name=email]').fill(signupEmail);
 await sp.locator('[name=password]').fill(signupPassword);
 await sp.getByRole('button',{name:'Sign In',exact:true}).click({timeout:60000});
 await sp.waitForURL(url=>url.pathname==='/contributors');
 assert.equal(await sp.locator('[name=school_slug]').inputValue(),'de-leon');
 assert.equal(await sp.locator('[name=requested_role]').inputValue(),'scorekeeper');
 for(const key of new URL(sp.url()).searchParams.keys())assert.ok(['school','role','confirmed'].includes(key));
 pass('browser_signin_return');results.auth_credentials='PASS: actual local signup, local confirmation mail, and sign-in return with official test CAPTCHA.';
 await signed.clearCookies();

 await sp.goto(base+'/scoreboard');
 const card=sp.getByRole('region',{name:'Scorekeeper participation'});
 for(const width of [390,400,430,1280]){
  await sp.setViewportSize({width,height:900});
  assert.ok(await sp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
  const rect=await card.boundingBox();const action=await card.getByRole('link').boundingBox();assert.ok(action.height>=43);
  const geometry=await card.evaluate(el=>({prev:el.previousElementSibling?.getBoundingClientRect().bottom,next:el.nextElementSibling?.getBoundingClientRect().top,top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom,position:getComputedStyle(el).position}));
  assert.ok(geometry.prev<=geometry.top&&geometry.bottom<=geometry.next);assert.ok(!['fixed','sticky'].includes(geometry.position));
  assert.equal(await sp.getByRole('region',{name:'Scorekeeper participation'}).count(),1);
  await sp.screenshot({path:evidence+'/scoreboard-'+width+'.png',fullPage:true});
  pass('responsive_'+width);
 }
 assert.equal(await card.getByRole('heading',{level:2,name:'Help cover local games'}).count(),1);
 assert.equal(await card.locator('[aria-live]').count(),0);
 const link=card.getByRole('link',{name:'Become a Scorekeeper'});
 for(let i=0;i<100;i++){await sp.keyboard.press('Tab');if(await link.evaluate(el=>el===document.activeElement))break;assert.notEqual(i,99)}
 const focus=await link.evaluate(el=>({style:getComputedStyle(el).outlineStyle,width:getComputedStyle(el).outlineWidth}));assert.notEqual(focus.style,'none');assert.ok(parseFloat(focus.width)>=2);
 await sp.screenshot({path:evidence+'/keyboard-focus.png',fullPage:true});
 await sp.keyboard.press('Enter');await sp.getByRole('heading',{name:'Sign in to apply'}).waitFor();pass('keyboard_semantics_focus');
 results.screen_reader='NOT VERIFIED: no manual screen reader.';
 await sp.goto(base+'/scoreboard');const contrast=await card.evaluate(el=>{
 const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');
 const rgba=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v)};
 const blend=(fg,bg)=>fg.slice(0,3).map((v,i)=>v*fg[3]+bg[i]*(1-fg[3]));
 const back=node=>{if(!node)return [0,0,0];return blend(rgba(getComputedStyle(node).backgroundColor),back(node.parentElement))};
 const lum=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
 return [...el.querySelectorAll('h2,p,a')].map(node=>{const bg=back(node);const fg=blend(rgba(getComputedStyle(node).color),bg);const a=lum(fg),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
 });assert.ok(contrast.every(x=>x>=4.5),'CTA text contrast');results.contrast_ratios=contrast;pass('text_contrast');
 await signed.close();
 pass('private_identity_cta_markup');
 pass('production_backend_isolation');
}catch(error){results.failure=error.message;throw error}
finally{writeFileSync(evidence+'/results.json',JSON.stringify(results,null,2));await browser?.close();app.kill('SIGTERM');const runtime=readFileSync(evidence+'/runtime.log','utf8');writeFileSync(evidence+'/runtime.log',runtime.replace(/token_hash=[^&\\s]+/g,'token_hash=[REDACTED]'))}
