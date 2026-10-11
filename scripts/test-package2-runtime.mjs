// Real loopback Auth/PostgREST/PostgreSQL/browser verification; synthetic users only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {randomBytes} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {createClient} from '@supabase/supabase-js';
import {checkAvailability} from './check-package2-availability.mjs';
assert.equal(process.cwd(),'/vercel/package');
const v=JSON.parse(fs.readFileSync('/vercel/runtime-fixture.json','utf8'));
assert.equal(v.API_URL,'http://127.0.0.1:54321');
const {chromium}=createRequire('/vercel/test-tools/package.json')('playwright');
const api=v.API_URL,base='http://127.0.0.1:3000';
const control=async mode=>{assert.ok((await fetch(api+'/__fixture/control',{method:'POST',body:JSON.stringify({mode,reset:true})})).ok);};
const stats=async()=>await(await fetch(api+'/__fixture/stats')).json();
const sql=q=>execFileSync('psql',['-X','-At','-v','ON_ERROR_STOP=1','-h','127.0.0.1','-p','54322','-U','postgres','-c',q],{env:{...process.env,PGPASSWORD:'isolated-fixture-only'},encoding:'utf8'}).trim();
let app,browser;
try{
 const email=`package2-${randomBytes(5).toString('hex')}@example.invalid`,password=randomBytes(24).toString('base64url');
 const r=await fetch(api+'/auth/v1/admin/users',{method:'POST',headers:{Authorization:`Bearer ${v.SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({email,password,email_confirm:true,role:'authenticated',aud:'authenticated'})});assert.ok(r.ok);const actor=(await r.json()).id;
 const client=createClient(api,v.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
 const login=await client.auth.signInWithPassword({email,password});assert.ifError(login.error);
 assert.ifError((await client.from('school_follows').insert({user_id:actor,school_slug:'albany',source_surface:'school_hub'})).error);
 const other=await client.from('member_account_status').select('user_id').neq('user_id',actor).retry(false);assert.ok(other.error||other.data.length===0);
 const write=await client.from('game_state').update({away_score:999}).eq('game_id','albany-at-stamford-2026-week-7').select().retry(false);assert.ok(write.error||write.data.length===0);
 sql("insert into public.game_state(game_id,status,home_score,away_score,verified,verified_at,period,clock) values('albany-at-stamford-2026-week-7','live',79,83,true,now(),'4th','01:23') on conflict(game_id) do update set status='live',home_score=79,away_score=83,verified=true,verified_at=now(),period='4th',clock='01:23'");
 browser=await chromium.launch();
 app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3000'],{detached:true,env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:api,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:v.ANON_KEY,NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore',fs.openSync('/tmp/p2-app.log','w'),'ignore']});
 for(let i=0;i<90;i++){try{if((await fetch(base+'/login')).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));assert.notEqual(i,89);}
 const anon=await browser.newContext(),member=await browser.newContext();
 for(const c of [anon,member])await c.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());
 const encoded='base64-'+Buffer.from(JSON.stringify(login.data.session)).toString('base64url'),chunks=encoded.match(/.{1,3180}/g);
 await member.addCookies(chunks.map((value,i)=>({name:chunks.length===1?'sb-127-auth-token':`sb-127-auth-token.${i}`,value,url:base,sameSite:'Lax'})));
 const paths=['/','/games','/games/albany-at-stamford-2026-week-7','/schools','/schools/albany','/schools/hamilton'];
 // Discover a real static article URL rather than introducing fabricated content.
 const home=await anon.newPage();await home.goto(base);const article=await home.locator('a[href^="/coverage/"]').first().getAttribute('href');if(article)paths.push(article);await home.close();
 for(const mode of ['normal','follows-503','editorial-503','feed-503','follows-slow','editorial-slow','all-503','all-504','score-503','normal']){
  await control(mode);
  for(const c of [anon,member]){
   const p=await c.newPage();
   for(const path of paths){const started=Date.now();const response=await p.goto(base+path,{waitUntil:'domcontentloaded',timeout:25000});assert.equal(response.status(),200,`${mode} ${path}`);await p.locator('h1').first().waitFor({timeout:20000});const text=await p.locator('body').innerText();assert.ok(!text.includes('SYNTHETIC_PRIVATE_DIAGNOSTIC'));assert.ok(!text.includes('Application error'));assert.ok(Date.now()-started<24000);
    if(mode.startsWith('follows-')&&c===member&&path==='/')assert.match(text,/Your followed teams are temporarily unavailable/);
    if(mode.startsWith('feed-')&&path==='/schools/hamilton')assert.match(text,/Team Feed is temporarily unavailable/);
    if(path==='/games/albany-at-stamford-2026-week-7'){
      assert.match(text,/Albany/);assert.match(text,/Stamford/);
      if(mode.startsWith('all-')||mode.startsWith('score-')){
        assert.match(text,/Live score data could not be refreshed/);
        assert.equal(await p.getByText('79',{exact:true}).count(),0);
        assert.equal(await p.getByText('83',{exact:true}).count(),0);
      }else{
        assert.ok(await p.getByText('79',{exact:true}).count()>0);
        assert.ok(await p.getByText('83',{exact:true}).count()>0);
      }
    }
   }
   if(mode.startsWith('all-')||mode.startsWith('score-')){const snap=await c.request.get(base+'/api/games/snapshot');assert.equal(snap.status(),503);}
   else if(mode==='normal'){const snap=await c.request.get(base+'/api/games/snapshot');assert.equal(snap.status(),200);assert.equal(snap.headers()['cache-control'],'no-store');const body=await snap.json();assert.ok(['primary','fallback'].includes(body.scoreLoadStatus));assert.ok(!JSON.stringify(body).includes(actor));assert.ok(!JSON.stringify(body).includes(email));}
   await p.close();
  }
  console.log(`PASS real browser public pages ${mode}: anonymous + authenticated; no diagnostic disclosure`);
 }
 await control('normal');
 sql(`delete from public.school_follows where user_id='${actor}'`);
 const missing=await member.newPage();await missing.goto(base);assert.equal(await missing.getByText('Your followed teams are temporarily unavailable.',{exact:true}).count(),0);await missing.close();
 await control('normal');
 const before=Date.now();const results=await Promise.all(Array.from({length:8},(_,i)=>fetch(base+paths[i%paths.length])));assert.ok(results.every(r=>r.status===200));assert.ok(Date.now()-before<24000);const counts=(await stats()).counts.paths;assert.ok((counts['/rest/v1/rpc/public_score_states']??0)<=8,'deduplicated per-request score reads');console.log('PASS eight concurrent isolated public requests; bounded score reads');
 const p=await anon.newPage();await p.goto(base+'/report-score');await p.waitForURL(/login/);await p.close();
 assert.equal(sql(`select count(*) from public.game_state where away_score=999`),'0');
 await control('normal');console.log('PASS recovery, anonymous protected-route denial, authenticated RLS privacy/write protection');
 const monitor=await checkAvailability(base,{enabled:false,timeoutMs:8000,publicPaths:['/','/games','/games/albany-at-stamford-2026-week-7','/api/games/snapshot']});assert.ok(monitor.results.every(r=>r.healthy));console.log('PASS local one-shot availability runner with real production build and Data API');
 console.log('PASS ALL PACKAGE 2 REAL PLATFORM/BROWSER CHECKS');
}finally{await control('normal');await browser?.close();if(app?.pid){try{process.kill(-app.pid,'SIGTERM');}catch{}}}
