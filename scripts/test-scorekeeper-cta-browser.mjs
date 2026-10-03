// Local disposable Auth/API responses only. Never creates production users or records.
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHmac } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
const apiPort=54327,appPort=3017, origin=`http://127.0.0.1:${appPort}`;
const cases=['member','pending','deferred','declined','withdrawn','keeper','coach','revoked','removed-role','suspended','unavailable'];
const users=cases.map((state,i)=>({state,id:`00000000-0000-4000-8000-${String(i+1).padStart(12,'0')}`,email:`${state}@example.invalid`}));
function session(user){const payload={sub:user.id,aud:'authenticated',role:'authenticated',email:user.email,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600};const body=[{alg:'HS256',typ:'JWT'},payload].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');return {access_token:`${body}.${createHmac('sha256','disposable-fixture-only').update(body).digest('base64url')}`,refresh_token:'fixture-refresh',token_type:'bearer',expires_in:3600,expires_at:payload.exp,user:{id:user.id,email:user.email,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}}};}
let unknownWrites=0;
const server=http.createServer(async(req,res)=>{
 res.setHeader('Content-Type','application/json');
 let user;try{user=users.find(u=>u.id===JSON.parse(Buffer.from((req.headers.authorization??'').split('.')[1]??'','base64url')).sub);}catch{}
 const url=new URL(req.url,`http://127.0.0.1:${apiPort}`);const path=url.pathname;
 const send=x=>res.end(JSON.stringify(x));
 if(path==='/auth/v1/verify'){send(session(users[0]));return;}
 if(path==='/auth/v1/user'){send(session(user??users[0]).user);return;}
 if(req.method!=='GET'&&req.method!=='HEAD'&&req.method!=='OPTIONS'&&path!=='/rest/v1/rpc/public_score_states'){unknownWrites++;res.statusCode=403;send({message:'Fixture write not enabled'});return;}
 if(path.endsWith('/member_account_status')){send(user?[{status:user.state==='suspended'?'suspended':'active'}]:[]);return;}
 if(path.endsWith('/user_roles')){send(user&&['keeper','coach','revoked','suspended'].includes(user.state)?[{role:'scorekeeper'}]:[]);return;}
 if(path.endsWith('/contributor_school_assignments')){send(user&&['keeper','coach','revoked','removed-role','suspended'].includes(user.state)?[{school_slug:'de-leon',assignment_role:user.state==='coach'?'coach':'scorekeeper',active:user.state!=='revoked'}]:[]);return;}
 if(path.endsWith('/contributor_applications')){
  if(user?.state==='unavailable'){res.statusCode=503;send({message:'Fixture unavailable'});return;}
  const status=user&&['pending','deferred','declined','withdrawn'].includes(user.state)?user.state:user&&['keeper','coach','revoked','removed-role'].includes(user.state)?'approved':null;
  send(status?[{id:'fixture-own-application',school_slug:'de-leon',requested_role:user.state==='coach'?'coach':'scorekeeper',status,submitted_at:'2026-10-02T12:00:00Z',review_note:null}]:[]);return;
 }
 send([]);
});
await new Promise(r=>server.listen(apiPort,'127.0.0.1',r));
const app=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port',String(appPort)],{stdio:['ignore','pipe','pipe'],env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:`http://127.0.0.1:${apiPort}`,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'fixture-publishable-key'}});
let output='';app.stdout.on('data',d=>output+=d);app.stderr.on('data',d=>output+=d);
let browser;
try{
 for(let i=0;i<120;i++){if(app.exitCode!==null)throw Error(output.slice(-2000));try{if((await fetch(`${origin}/contributors`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));if(i===119)throw Error(output.slice(-2000));}
 if(process.env.CTA_HTTP_ONLY === '1') {
  const cookie=user=>`sb-127-auth-token=base64-${Buffer.from(JSON.stringify(session(user))).toString('base64url')}`;
  const get=async(path,user)=>{const r=await fetch(origin+path,{headers:user?{cookie:cookie(user)}:{}});assert.equal(r.status,200);return r.text();};
  const anonHtml=await get('/scoreboard');assert.match(anonHtml,/Become a Scorekeeper/);
  for(const user of users){
   const html=await get('/scoreboard',user);const card=html.match(/<section aria-label="Scorekeeper participation"[\s\S]*?<\/section>/)?.[0];assert.ok(card);
   const expected=['pending','deferred'].includes(user.state)?'View application status':user.state==='keeper'?'Report a Score':['coach','revoked','removed-role'].includes(user.state)?'View contributor access':['suspended','unavailable'].includes(user.state)?'View contributor information':'Become a Scorekeeper';assert.ok(card.includes(expected),user.state);assert.ok(!card.includes(user.id));
   const form=await get('/contributors?school=de-leon&role=scorekeeper',user);
   const select=form.match(/<select id="school_slug"[\s\S]*?<\/select>/)?.[0];
   if(['pending','deferred'].includes(user.state)){assert.ok(select&&!select.includes('value="de-leon"'));assert.ok(select.includes('value="cisco"'));}
   else if(['suspended','unavailable'].includes(user.state))assert.ok(!form.includes('Submit Application'));
   else { assert.ok(select, `${user.state}: ${form.slice(form.indexOf("Sign in to apply")-100, form.indexOf("Sign in to apply")+250)} / ${form.includes("successful access verification")}`); assert.match(select,/value="de-leon"[^>]*selected/); }
  }
  const html=await get('/contributors?school=de-leon&role=scorekeeper');
  assert.ok(html.includes('next=%2Fcontributors%3Fschool%3Dde-leon%26role%3Dscorekeeper'));
  for(const mode of ['', '&mode=signup']){const login=await get('/login?next='+encodeURIComponent('/contributors?school=de-leon&role=scorekeeper')+mode);assert.match(login,/name="next" value="\/contributors\?school=de-leon&amp;role=scorekeeper"/);}
  const confirm=await fetch(origin+'/auth/confirm?token_hash=fixture&type=signup&next='+encodeURIComponent('/contributors?school=de-leon&role=scorekeeper'),{redirect:'manual'});assert.equal(confirm.status,307);const destination=new URL(confirm.headers.get('location'));assert.equal(destination.pathname,'/contributors');assert.equal(destination.searchParams.get('school'),'de-leon');assert.equal(destination.searchParams.get('role'),'scorekeeper');
  const invalid=await get('/contributors?school=not-a-school&role=admin',users[0]);assert.match(invalid,/value="scorekeeper"[^>]*selected/);assert.equal(unknownWrites,0);
  console.log('PASS: HTTP/server rendering for 11 authenticated disposable Auth/API fixture states, signed-out navigation, school/role validation, signup/sign-in/confirmation return, no private CTA identifiers, no business writes. Browser layout NOT VERIFIED.');
 } else {
 browser=await chromium.launch({executablePath:process.env.CHROME_PATH,args:['--no-sandbox']});
 async function context(user){const c=await browser.newContext();await c.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());if(user)await c.addCookies([{name:'sb-127-auth-token',value:`base64-${Buffer.from(JSON.stringify(session(user))).toString('base64url')}`,url:origin,sameSite:'Lax'}]);return c;}
 const anon=await context();const page=await anon.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`${origin}/scoreboard`);const card=page.getByRole('region',{name:'Scorekeeper participation'});await card.getByRole('link',{name:'Become a Scorekeeper',exact:true}).waitFor();assert.equal(await card.getByRole('link').getAttribute('href'),'/contributors');
 for(const width of [390,400,430,1280]){await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow ${width}`);assert.ok((await card.getByRole('link').boundingBox()).height>=44);}
 await page.goto(`${origin}/contributors?school=de-leon&role=scorekeeper`);
 for(const label of ['Create Account','Sign In']){const href=await page.getByRole('link',{name:label,exact:true}).getAttribute('href');assert.equal(new URL(href,origin).searchParams.get('next'),'/contributors?school=de-leon&role=scorekeeper');}
 await page.getByRole('link',{name:'Create Account',exact:true}).click();assert.equal(await page.locator('input[name=next]').inputValue(),'/contributors?school=de-leon&role=scorekeeper');
 await page.getByRole('link',{name:'Sign in',exact:true}).click();assert.equal(await page.locator('input[name=next]').inputValue(),'/contributors?school=de-leon&role=scorekeeper');
 // Exercise the actual confirmation route against disposable Auth verify response.
 await page.goto(`${origin}/auth/confirm?token_hash=fixture&type=signup&next=${encodeURIComponent('/contributors?school=de-leon&role=scorekeeper')}`);
 await page.waitForURL(/\/contributors\?/);assert.equal(await page.locator('#school_slug').inputValue(),'de-leon');assert.equal(await page.locator('#requested_role').inputValue(),'scorekeeper');
 for(const user of users){const c=await context(user);const p=await c.newPage();await p.goto(`${origin}/scoreboard`);const expected=['pending','deferred'].includes(user.state)?'View application status':user.state==='keeper'?'Report a Score':['coach','revoked','removed-role'].includes(user.state)?'View contributor access':['suspended','unavailable'].includes(user.state)?'View contributor information':'Become a Scorekeeper';await p.getByRole('region',{name:'Scorekeeper participation'}).getByRole('link',{name:expected,exact:true}).waitFor();
  await p.goto(`${origin}/contributors?school=de-leon&role=scorekeeper`);
  if(['pending','deferred'].includes(user.state)){assert.equal(await p.locator('#school_slug option[value="de-leon"]').count(),0);assert.ok(await p.locator('#school_slug option[value="cisco"]').count());}
  else if(!['suspended','unavailable'].includes(user.state)){assert.equal(await p.locator('#school_slug').inputValue(),'de-leon');}
  else assert.equal(await p.getByRole('button',{name:'Submit Application'}).count(),0);
  assert.equal(await p.locator('[name=applicant_id],[name=reviewed_by],[name=user_id]').count(),0);await c.close();
 }
 await page.goto(`${origin}/contributors?school=not-a-school&role=admin`);assert.equal(await page.locator('#school_slug').inputValue(),'');assert.equal(await page.locator('#requested_role').inputValue(),'scorekeeper');
 assert.equal(unknownWrites,0);assert.deepEqual(errors,[]);console.log('PASS: 11 authenticated fixture states, signed-out CTA, prefill/auth/confirmation return, four widths, no private ID inputs, no fixture business writes.');
}
}finally{if(browser)await browser.close();app.kill('SIGTERM');server.close();}
