// Real Auth/PostgREST/Postgres + production-build browser tests in disposable loopback only.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
assert.equal(process.cwd(), '/vercel/package');
const mode = process.argv[2] ?? 'candidate';
const { chromium } = createRequire('/vercel/test-tools/package.json')('playwright');
const fixture = JSON.parse(fs.readFileSync('/vercel/runtime-fixture.json', 'utf8'));
assert.equal(fixture.API_URL, 'http://127.0.0.1:54321');
assert.match(fs.readFileSync('.env.local','utf8'), /NEXT_PUBLIC_SUPABASE_URL=http:\/\/127.0.0.1:54323/);
const api = 'http://127.0.0.1:54323', base = 'http://127.0.0.1:3000';
const sql = q => execFileSync('psql', ['-X','-At','-h','127.0.0.1','-p','54322','-U','postgres','-v','ON_ERROR_STOP=1','-c',q],
  {env:{...process.env,PGPASSWORD:'isolated-fixture-only'},encoding:'utf8'}).trim();
const control = async value => assert.ok((await fetch(api+'/__test/control',{method:'POST',body:JSON.stringify({mode:value,reset:true})})).ok);
const counters = async () => (await (await fetch(api+'/__test/stats')).json());
const weekId = 'd0000000-0000-4000-8000-000000009001';
if (!fs.existsSync('/vercel/mobile-actor.json')) {
  const email = `responsive-${randomBytes(5).toString('hex')}@example.invalid`, password = randomBytes(24).toString('base64url');
  const r = await fetch(fixture.API_URL+'/auth/v1/admin/users',{method:'POST',headers:{Authorization:`Bearer ${fixture.SERVICE_ROLE_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({email,password,email_confirm:true,role:"authenticated",aud:"authenticated"})});
  assert.ok(r.ok); const actor = (await r.json()).id;
  const client = createClient(api,fixture.ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const login = await client.auth.signInWithPassword({email,password}); assert.ifError(login.error);
  fs.writeFileSync('/vercel/mobile-actor.json',JSON.stringify({actor,session:login.data.session}),{mode:0o600});
}
if (sql(`select count(*) from public.pickem_weeks where id='${weekId}'`) === '0') {
  sql(`insert into public.pickem_weeks(id,season,week,title,status,opens_at,entry_deadline_at,closes_at,official_rules_version,official_rules_published_at) values('${weekId}',2100,8,'Synthetic Week 8','draft',now()-interval '1 hour',now()+interval '1 day',now()+interval '1 day','synthetic-v1',now());
  insert into public.pickem_games(id,week_id,game_id,sort_order,lock_at,away_school_slug,home_school_slug) values
  ('d0000000-0000-4000-8000-000000009002','${weekId}','hico-at-de-leon-2026-week-8',1,now()+interval '1 day','hico','de-leon'),
  ('d0000000-0000-4000-8000-000000009003','${weekId}','china-spring-at-stephenville-2026-week-8',2,now()+interval '1 day','china-spring','stephenville');
  update public.pickem_weeks set status='open', tiebreaker_game_id='d0000000-0000-4000-8000-000000009002' where id='${weekId}';`);
}
const actor = JSON.parse(fs.readFileSync('/vercel/mobile-actor.json','utf8'));
const browser = await chromium.launch();
const observations = [];
async function context(authenticated, width) {
  const c = await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500});
  await c.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  if (authenticated) {
    const encoded = 'base64-'+Buffer.from(JSON.stringify(actor.session)).toString('base64url'), chunks = encoded.match(/.{1,3180}/g);
    await c.addCookies(chunks.map((value,i)=>({name:chunks.length===1?'sb-127-auth-token':`sb-127-auth-token.${i}`,value,url:base,sameSite:'Lax'})));
  }
  return c;
}
async function measure(c, width, condition) {
  const p = await c.newPage();
  await control(condition);
  await p.goto(base,{waitUntil:'networkidle'});
  await p.evaluate(() => {
    window.__navigationTiming = {started:null,feedback:null,ready:null};
    document.addEventListener('click',e=>{
      if (e.target.closest('a[href="/pickem"]')) window.__navigationTiming.started=performance.now();
    },{capture:true});
    new MutationObserver(()=>{
      const t=window.__navigationTiming; if(t.started===null)return;
      if(t.feedback===null && (document.querySelector('[data-pending]') ||
        [...document.querySelectorAll('[aria-busy="true"] [role="status"]')].some(e=>/Loading Pick/.test(e.textContent)))) t.feedback=performance.now()-t.started;
      if(t.ready===null && document.querySelector('main input[name^="pick_"]:not(:disabled)')) t.ready=performance.now()-t.started;
    }).observe(document.body,{childList:true,subtree:true,attributes:true});
  });
  const nav=p.getByRole('navigation',{name:width<500?'Mobile navigation':'Primary navigation'});
  await nav.getByRole('link',{name:'Pick ’Em',exact:true}).click();
  await p.waitForFunction(()=>window.__navigationTiming.ready!==null,null,{timeout:20000});
  assert.ok((await counters()).paths['/rest/v1/pickem_weeks'] > 0, 'measurement must pass through delayed fixture');
  const value=await p.evaluate(()=>window.__navigationTiming);
  observations.push({width,condition,...value});
  await p.close();
}
try {
  for (const width of [390,1280]) {
    const c = await context(true,width);
    for (let i=0;i<3;i++) await measure(c,width,'delay-150');
    await measure(c,width,'optional-delay');
    await c.close();
  }
  fs.writeFileSync(`/vercel/${mode}-responsiveness-measurements.json`,JSON.stringify(observations,null,2));
  if (mode === 'candidate') {
    const c=await context(true,390),p=await c.newPage();
    await control('normal'); await p.goto(base,{waitUntil:'networkidle'});
    await p.getByRole('navigation',{name:'Mobile navigation'}).getByRole('link',{name:'Pick ’Em',exact:true}).press('Enter');
    await p.locator('form input[name^="pick_"]').first().waitFor();
    await p.goBack(); await p.getByRole('heading',{name:'Texas High School Football Scores, Schedules, Standings and Local Coverage',exact:true}).waitFor();
    await p.goForward(); await p.locator('form input[name^="pick_"]').first().waitFor();
    assert.equal(await p.locator('[data-pending]').count(),0);
    const desktop=await context(true,1280),d=await desktop.newPage();
    await d.goto(base,{waitUntil:'networkidle'});
    const [popup]=await Promise.all([desktop.waitForEvent('page'),d.getByRole('navigation',{name:'Primary navigation'}).getByRole('link',{name:'Pick ’Em',exact:true}).click({modifiers:['Control']})]);
    await popup.waitForURL(base+'/pickem',{waitUntil:'domcontentloaded'}); assert.match(popup.url(),/\/pickem/); assert.equal(new URL(d.url()).pathname,'/'); await desktop.close();
    for (const failure of ['entry-fail','void-fail','status-fail','slate-hang']) {
      await control(failure); await p.goto(base+'/pickem',{waitUntil:'domcontentloaded'});
      await p.getByText(/Pick ’Em could not load safely/).waitFor();
      assert.equal(await p.locator('form input[name^="pick_"]').count(),0);
      assert.ok(!(await p.locator('body').innerText()).includes('PRIVATE_TEST_DIAGNOSTIC'));
      const stats=await counters();
      const path={ 'entry-fail':'/rest/v1/pickem_contest_entries','void-fail':'/rest/v1/pickem_contest_void_games','status-fail':'/rest/v1/member_account_status','slate-hang':'/rest/v1/pickem_game_cards' }[failure];
      assert.ok(stats.paths[path]<=2, 'no retry amplification (page/header may each check status)');
    }
    await control('normal'); await p.getByRole('button',{name:'Try loading again',exact:true}).click(); await p.locator('form input[name^="pick_"]').first().waitFor();
    await control('history-fail'); await p.goto(base+'/pickem',{waitUntil:'networkidle'});
    await p.getByText(/Your Pick ’Em history is temporarily unavailable/).waitFor();
    assert.ok(await p.locator('form input[name^="pick_"]').count()>0);
    await control('normal'); await p.goto(base+'/pickem',{waitUntil:'networkidle'});
    await p.locator('label').filter({has:p.locator('input[name="pick_d0000000-0000-4000-8000-000000009002"][value="hico"]')}).click();
    await p.locator('label').filter({has:p.locator('input[name="pick_d0000000-0000-4000-8000-000000009003"][value="china-spring"]')}).click();
    await p.locator('#predicted_total').fill('0');
    await p.locator('#mobile_phone').fill('254555'+String(1000+Number(sql('select count(*) from private.pickem_entrant_phones'))));
    await p.locator('input[name="eligibility_attested"]').check();
    await control('drop-success');
    await p.getByRole('button',{name:'Submit Week 8 Picks',exact:true}).click();
    await p.getByText(/the save may have completed/).waitFor();
    assert.equal((await counters()).writes,1);
    assert.equal(sql(`select count(*) from public.pickem_contest_entries where week_id='${weekId}' and user_id='${actor.actor}'`),'1');
    assert.equal(await p.locator('#predicted_total').isDisabled(),true);
    assert.equal(await p.locator('#mobile_phone').isDisabled(),true);
    await control('normal');
    await p.getByRole('button',{name:'Check saved state',exact:true}).click();
    await p.getByText(/Your requested selections match the saved state/).waitFor();
    assert.equal((await counters()).writes,0,'read-only reconciliation must not replay');
    assert.equal(await p.getByRole('button',{name:'Submit Week 8 Picks',exact:true}).isDisabled(),true);
    await p.getByRole('link',{name:'Review latest saved entry',exact:true}).click();
    await p.getByText(/Entry completed/).waitFor();
    await p.locator('label').filter({has:p.locator('input[name="pick_d0000000-0000-4000-8000-000000009002"][value="de-leon"]')}).click();
    await control('delay-150');
    const submit=p.getByRole('button',{name:'Save Changes',exact:true}).last();
    await submit.click(); await p.locator('form').evaluate(form=>form.requestSubmit());
    await p.getByText(/Contest entry saved/).waitFor();
    assert.equal((await counters()).writes,1,'second submit cannot bypass ref guard');
    // Member status outage must not revoke the session; ordinary recovery remains authenticated.
    await control('status-fail'); await p.goto(base+'/account'); await p.waitForURL(/account-unavailable/);
    await control('normal'); await p.goto(base+'/pickem'); await p.getByText(/Entry completed/).waitFor();
    const anon=await context(false,390),a=await anon.newPage();
    await a.goto(base+'/pickem'); await a.getByText('Sign in to submit.',{exact:false}).waitFor();
    await a.goto(base+'/account'); await a.waitForURL(/login/);
    await anon.close(); await c.close();
    console.log('PASS required failures, optional isolation, lost committed response, read-only reconciliation, zero prediction, duplicate protection, account outage recovery, anonymous gates');
  }
  fs.writeFileSync(`/vercel/${mode}-responsiveness-measurements.json`,JSON.stringify(observations,null,2));
  console.log(JSON.stringify({mode,observations}));
} finally { await control('normal'); await browser.close(); }
