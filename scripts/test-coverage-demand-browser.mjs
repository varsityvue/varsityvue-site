// Isolated mounted UI -> first-party route -> synthetic aggregate sink.
// No production connection and no owner geolocation.
import assert from 'node:assert/strict';
import { mkdirSync,writeFileSync } from 'node:fs';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
const evidence='coverage-demand-browser-evidence';mkdirSync(evidence,{recursive:true});
let accepted=0, sinkMode='ok';const sinkBodies=[];
const api=http.createServer(async(req,res)=>{
 res.setHeader('Content-Type','application/json');
 if(req.url==='/rest/v1/rpc/server_record_coverage_demand_summary'){
  let body='';for await(const chunk of req)body+=chunk; sinkBodies.push(JSON.parse(body));
  if(sinkMode==='error'){res.statusCode=500;res.end('{}');return;}
  if(sinkMode==='timeout'){setTimeout(()=>{res.end('{}');},3001).unref();return;}
  accepted++;res.end('null');return;
 }
 res.end('[]');
});
await new Promise(resolve=>api.listen(54326,'127.0.0.1',resolve));
const app=spawn('npm',['run','dev','--','--hostname','127.0.0.1','--port','3001'],{detached:true,
 stdio:'inherit',env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54326',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'disposable-public',
 NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED:'true',COVERAGE_DEMAND_ENABLED:'true',COVERAGE_DEMAND_SUPABASE_URL:'http://127.0.0.1:54326',COVERAGE_DEMAND_SERVICE_ROLE_KEY:'disposable-server-key',
 NEXT_PUBLIC_TURNSTILE_SITE_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',RESEND_API_KEY:'',CRON_SECRET:''}
});
let browser;const results=[];const pass=name=>{results.push({name,status:'PASS'});console.log(`PASS ${name}`);};
try{
 for(let i=0;i<90;i++){try{if((await fetch('http://127.0.0.1:3001/games')).ok)break;}catch{}await new Promise(r=>setTimeout(r,500));assert.notEqual(i,89,'Disposable app did not start');}
 // Compile the dev route before measuring background delivery; this rejected
 // request creates no aggregate and keeps cold compiler time outside the test.
 assert.equal((await fetch('http://127.0.0.1:3001/api/coverage-demand',{method:'POST',headers:{origin:'http://127.0.0.1:3001','Content-Type':'application/json'},body:'{}'})).status,400);
 browser=await chromium.launch();
 const context=await browser.newContext({viewport:{width:390,height:900}});
 await context.addInitScript(()=>{
  window.geoFixture={calls:0,mode:'granted',latitude:32.123456789,longitude:-98.543210987,accuracy:30};
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(success,error){
   const f=window.geoFixture;f.calls++;if(f.mode==='hold'){f.release=()=>success({coords:f});return;}
   if(f.mode==='granted')success({coords:f});else error({code:1});
  },watchPosition(){throw Error('watchPosition forbidden');}}});
 });
 await context.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,route=>route.abort());
 const page=await context.newPage(), errors=[],consoleMessages=[],requests=[],summaries=[],responses=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>consoleMessages.push(m.text()));
 page.on('request',r=>{requests.push(r.url()+(r.postData()??''));if(r.url().endsWith('/api/coverage-demand'))summaries.push(JSON.parse(r.postData()));});
 page.on('response',r=>{if(r.url().endsWith('/api/coverage-demand'))responses.push(r.status());});
 await page.clock.install();
 const nearby=page.locator('#nearby-games'),locate=nearby.getByRole('button',{name:'Games Near Me',exact:true}),cards=nearby.locator('a[href^="/games/"]');
 const optin=nearby.getByRole('button',{name:'Allow regional measurement',exact:true}),decline=nearby.getByRole('button',{name:'Don’t share regional usage',exact:true});
 const clear=()=>nearby.getByRole('button',{name:'Clear',exact:true}).click();
 const idle=()=>page.waitForTimeout(750);
 await page.goto('http://127.0.0.1:3001/games',{waitUntil:'networkidle'});await nearby.locator('#nearby-week').selectOption('7');
 await nearby.waitFor();assert.ok((await nearby.innerText()).includes('Games Near Me works without sharing.'));
 assert.equal(await page.evaluate(()=>window.geoFixture.calls),0);assert.equal(await optin.getAttribute('aria-pressed'),'false');
 await locate.click();assert.ok(await cards.count()>0);await clear();await idle();assert.equal(summaries.length,0);
 pass('Default no measurement; explicit GPS permission alone sends nothing; discovery works');
 await decline.click();await locate.click();await nearby.locator('#nearby-radius').selectOption('150');await clear();await idle();assert.equal(summaries.length,0);
 await page.reload({waitUntil:'networkidle'});assert.equal(await decline.getAttribute('aria-pressed'),'true');await nearby.locator('#nearby-week').selectOption('7');
 pass('Decline persists only preference; discovery/radius/Clear work; no repeat prompt or sends');
 await optin.click();await locate.click();await nearby.locator('#nearby-radius').selectOption('50');await nearby.locator('#nearby-radius').selectOption('100');await nearby.locator('#nearby-radius').selectOption('150');
 await nearby.locator('#nearby-search').fill('private-free-text-query');await clear();await idle();
 assert.equal(summaries.length,1);assert.equal(summaries[0].center_source,'browser_location');assert.equal(summaries[0].query_present,true);assert.equal(summaries[0].radius_expansion_steps,2);assert.equal(summaries[0].zero_result_reason,'query_filter_excluded');
 assert.equal(accepted,1);assert.ok(responses.includes(204));
 pass('Opt-in, browser-location summary, repeated expansion, query boolean and actual first-party route acceptance');
 await nearby.locator('#nearby-week').selectOption('8');await nearby.getByRole('button',{name:'Choose a school instead',exact:true}).click();await nearby.locator('#nearby-center').selectOption('hamilton');
 await nearby.locator('#nearby-search').fill('');await nearby.locator('#nearby-radius').selectOption('50');await clear();await idle();assert.equal(summaries.length,2);assert.equal(summaries[1].center_source,'school_center');
 pass('School-center demand explicitly separate; center and week changes reset episodes');
 await locate.click();await nearby.locator('#nearby-radius').selectOption('150');
 const count=summaries.length;await cards.first().click();await page.waitForURL(/\/games\/.+/);await idle();assert.equal(summaries.length,count+1);assert.equal(summaries.at(-1).game_selected,true);
 pass('First selection finalizes exactly once; navigation never waits for telemetry');
 await page.goto('http://127.0.0.1:3001/games',{waitUntil:'networkidle'});await nearby.locator('#nearby-week').selectOption('7');
 sinkMode='error';await locate.click();assert.ok(await cards.count()>0);await clear();await idle();assert.ok(responses.includes(503));
 sinkMode='timeout';await locate.click();await nearby.locator('#nearby-radius').selectOption('100');const before=Date.now();await clear();assert.ok(Date.now()-before<1500);await page.waitForTimeout(2300);sinkMode='ok';
 await page.route('**/api/coverage-demand',r=>r.abort());await locate.click();await nearby.locator('#nearby-radius').selectOption('150');await cards.first().click();await page.waitForURL(/\/games\/.+/);await page.unroute('**/api/coverage-demand');
 pass('Endpoint 503, timeout and blocked delivery do not delay results, radius, Clear or navigation');
 await page.goto('http://127.0.0.1:3001/games',{waitUntil:'networkidle'});await nearby.locator('#nearby-week').selectOption('7');
 await page.evaluate(()=>{window.geoFixture.mode='denied';});await locate.click();assert.match(await nearby.innerText(),/permission was denied/);
 await nearby.locator('#nearby-center').selectOption('de-leon');assert.ok(await cards.count()>0);await clear();await idle();
 await page.evaluate(()=>{window.geoFixture.mode='hold';});await locate.click();await nearby.getByRole('button',{name:'Cancel location request'}).click();await page.evaluate(()=>window.geoFixture.release());assert.equal(await cards.count(),0);
 pass('Denied GPS offers school fallback; cancelled late callback cannot restore center');
 for(const week of ['7','8','9']){await nearby.locator('#nearby-week').selectOption(week);assert.ok(await locate.isEnabled());}
 const sentBeforeDisabled=summaries.length,geoBeforeDisabled=await page.evaluate(()=>window.geoFixture.calls);
 for(const week of ['10','11']){await nearby.locator('#nearby-week').selectOption(week);assert.ok(await locate.isDisabled());assert.equal(await cards.count(),0);}
 await idle();assert.equal(summaries.length,sentBeforeDisabled);assert.equal(await page.evaluate(()=>window.geoFixture.calls),geoBeforeDisabled);
 pass('Weeks 7/8/9 enabled; Weeks 10/11 disabled with no GPS request or regional event');
 await nearby.locator('#nearby-week').selectOption('9');await nearby.getByRole('button',{name:'Choose a school instead',exact:true}).click();await nearby.locator('#nearby-center').selectOption('jacksboro');
 for(const width of [390,400,430,1280]){
  await page.setViewportSize({width,height:900});await nearby.scrollIntoViewIfNeeded();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  for(const rect of await nearby.locator('button,input,select').evaluateAll(ns=>ns.filter(n=>n.getBoundingClientRect().height>0).map(n=>{const r=n.getBoundingClientRect();return{height:r.height,left:r.left,right:r.right};}))) assert.ok(rect.height>=44&&rect.left>=0&&rect.right<=width);
  await page.screenshot({path:`${evidence}/nearby-${width}.png`,fullPage:false});pass(`${width}px disclosure/results/control layout; no overflow; 44px controls`);
 }
 const beforeInactivity=summaries.length;await page.clock.fastForward(61000);await idle();assert.equal(summaries.length,beforeInactivity+1);await nearby.locator('#nearby-radius').selectOption('100');await page.clock.fastForward(61000);await idle();assert.equal(summaries.length,beforeInactivity+1);
 pass('Bounded inactivity finalizes once; later radius interactions cannot duplicate the same episode');
 await page.keyboard.press('Tab');await optin.focus();const focus=await optin.evaluate(e=>({active:document.activeElement===e,outline:getComputedStyle(e).outlineStyle}));assert.ok(focus.active);assert.notEqual(focus.outline,'none');await page.keyboard.press('Tab');assert.equal(await decline.evaluate(e=>document.activeElement===e),true);await page.keyboard.press('Enter');assert.equal(await decline.getAttribute('aria-pressed'),'true');
 const beforeDecline=summaries.length;await clear();await idle();assert.equal(summaries.length,beforeDecline);
 pass('Keyboard/focus and opt-out discard active episode without delivery');
 const privacy=await page.evaluate(async()=>({url:location.href,html:document.documentElement.outerHTML,local:JSON.stringify(localStorage),session:JSON.stringify(sessionStorage),cookie:document.cookie,databases:indexedDB.databases?await indexedDB.databases():[]}));
 assert.equal(privacy.databases.length,0);assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage)),['coverage_measurement_v1']);
 for(const secret of ['32.123456789','-98.543210987','private-free-text-query','disposable-server-key']){
  assert.ok(!JSON.stringify(summaries).includes(secret));assert.ok(!JSON.stringify(sinkBodies).includes(secret));assert.ok(!JSON.stringify(privacy).includes(secret));assert.ok(!consoleMessages.join('\n').includes(secret));
  // The query is typed into an input, but is absent from every request; precise point never appears anywhere.
  assert.ok(!requests.join('\n').includes(secret));
 }
 for(const s of summaries){assert.deepEqual(Object.keys(s).sort(),['schema_version','grid_version','coarse_bucket_id','center_source','season','week','initial_radius_miles','final_radius_miles','radius_expansion_steps','radius_expanded','filter_scope','query_present','week_real_game_count','week_located_game_count','week_unlocated_game_count','in_radius_real_game_count','in_radius_default_eligible_count','returned_game_count','live_game_count','kickoff_window_game_count','upcoming_game_count','final_game_count','game_selected','zero_result_reason','location_catalog_version','schedule_catalog_version'].sort());}
 const restricted=await browser.newContext({viewport:{width:390,height:900}});await restricted.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 await restricted.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('storage blocked');};Storage.prototype.setItem=()=>{throw Error('storage blocked');};Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(success){success({coords:{latitude:32.123456789,longitude:-98.543210987,accuracy:30}});}}});});
 const restrictedPage=await restricted.newPage(),restrictedSummaries=[];restrictedPage.on('request',r=>{if(r.url().endsWith('/api/coverage-demand'))restrictedSummaries.push(JSON.parse(r.postData()));});await restrictedPage.goto('http://127.0.0.1:3001/games',{waitUntil:'networkidle'});const restrictedNear=restrictedPage.locator('#nearby-games');await restrictedNear.locator('#nearby-week').selectOption('7');await restrictedNear.getByRole('button',{name:'Allow regional measurement'}).click();await restrictedNear.getByRole('button',{name:'Games Near Me',exact:true}).click();assert.ok(await restrictedNear.locator('a[href^="/games/"]').count()>0);await restrictedNear.getByRole('button',{name:'Clear',exact:true}).click();await restrictedPage.waitForTimeout(750);assert.equal(restrictedSummaries.length,1,'Unreadable storage retains explicit page-memory permission through delivery');await restrictedPage.reload({waitUntil:'networkidle'});assert.equal(await restrictedNear.getByRole('button',{name:'Allow regional measurement'}).getAttribute('aria-pressed'),'false');await restricted.close();
 pass('Unavailable preference storage falls back to page memory and resets safely on reload');
 assert.deepEqual(errors,[]);pass('Exact synthetic point, identities, credentials, query and selected identity absent from telemetry, URLs, cookies, storage, markup and console');
 // Two mounted tabs share preference storage; B must have a live unfinished episode.
 const tabA=await context.newPage(),tabB=await context.newPage();const tabSummaries=[];
 for(const tab of [tabA,tabB])tab.on('pageerror',e=>errors.push(e.message));
 tabB.on('request',r=>{if(r.url().endsWith('/api/coverage-demand'))tabSummaries.push(JSON.parse(r.postData()));});
 await tabB.addInitScript(()=>{window.__delayCoverageStorage=false;window.addEventListener('storage',event=>{if(window.__delayCoverageStorage)event.stopImmediatePropagation();},true);});
 await tabB.clock.install();
 await tabA.goto('http://127.0.0.1:3001/games',{waitUntil:'networkidle'});
 const a=tabA.locator('#nearby-games'),b=tabB.locator('#nearby-games');
 const allowA=()=>a.getByRole('button',{name:'Allow regional measurement',exact:true}).click();
 const allowB=b.getByRole('button',{name:'Allow regional measurement',exact:true});
 const activeB=async()=>{
  await allowA();await tabB.goto('http://127.0.0.1:3001/games',{waitUntil:'networkidle'});
  await b.locator('#nearby-week').selectOption('7');await b.getByRole('button',{name:'Games Near Me',exact:true}).click();
  await b.locator('#nearby-radius').selectOption('100');assert.ok(await b.locator('a[href^="/games/"]').count()>0);
  assert.equal(await allowB.getAttribute('aria-pressed'),'true');
 };
 for(const mode of ['withdraw','remove','invalid','clear']){
  const before=tabSummaries.length;await activeB();assert.equal(tabSummaries.length,before,'Episode must be unfinished before revocation');
  if(mode==='withdraw')await a.getByRole('button',{name:'Don’t share regional usage',exact:true}).click();
  else await tabA.evaluate(mode=>{if(mode==='remove')localStorage.removeItem('coverage_measurement_v1');else if(mode==='invalid')localStorage.setItem('coverage_measurement_v1','invalid');else localStorage.clear();},mode);
  await tabB.waitForFunction(()=>document.querySelector('#nearby-games button[aria-pressed]')?.getAttribute('aria-pressed')==='false');
  await tabB.clock.fastForward(61000);await tabB.waitForTimeout(750);assert.equal(tabSummaries.length,before);
  await b.locator('a[href^="/games/"]').first().click();await tabB.waitForURL(/\/games\/.+/);await tabB.waitForTimeout(750);assert.equal(tabSummaries.length,before);
  pass(`Two-tab ${mode}: active unfinished B episode discarded before inactivity/selection; navigation works`);
 }
 // A delivered withdrawal also revokes page-memory fallback if reads become blocked.
 await activeB();const beforeBlockedWithdrawal=tabSummaries.length;
 await tabB.evaluate(()=>{Storage.prototype.getItem=()=>{throw Error('storage became unreadable');};});
 await a.getByRole('button',{name:'Don’t share regional usage',exact:true}).click();
 await tabB.waitForFunction(()=>document.querySelector('#nearby-games button[aria-pressed]')?.getAttribute('aria-pressed')==='false');
 await tabB.clock.fastForward(61000);await b.locator('a[href^="/games/"]').first().click();await tabB.waitForURL(/\/games\/.+/);await tabB.waitForTimeout(750);assert.equal(tabSummaries.length,beforeBlockedWithdrawal);
 pass('Delivered cross-tab withdrawal revokes memory fallback when B storage reads become blocked');
 // Deliberately prevent B's storage notification: finalization must still read storage.
 await activeB();await tabB.evaluate(()=>{window.__delayCoverageStorage=true;});
 const beforeDelayed=tabSummaries.length;await tabA.evaluate(()=>localStorage.setItem('coverage_measurement_v1','disabled'));
 assert.equal(await allowB.getAttribute('aria-pressed'),'true','Keep stale component state to exercise finalization guard');
 await b.locator('a[href^="/games/"]').first().click();await tabB.waitForURL(/\/games\/.+/);await tabB.waitForTimeout(750);assert.equal(tabSummaries.length,beforeDelayed);
 pass('Suppressed storage notification cannot authorize delivery: selection reconciles persisted withdrawal');
 // Cross-tab opt-in starts from current controls, without reconstructing prior changes.
 await tabB.goto('http://127.0.0.1:3001/games',{waitUntil:'networkidle'});await b.locator('#nearby-week').selectOption('7');
 await b.getByRole('button',{name:'Games Near Me',exact:true}).click();await b.locator('#nearby-radius').selectOption('150');await b.locator('#nearby-radius').selectOption('25');
 const beforeOptin=tabSummaries.length;await allowA();await tabB.waitForFunction(()=>document.querySelector('#nearby-games button[aria-pressed]')?.getAttribute('aria-pressed')==='true');
 await b.getByRole('button',{name:'Clear',exact:true}).click();await tabB.waitForTimeout(750);assert.equal(tabSummaries.length,beforeOptin+1);
 assert.equal(tabSummaries.at(-1).initial_radius_miles,25);assert.equal(tabSummaries.at(-1).radius_expansion_steps,0);
 for(const payload of tabSummaries)assert.deepEqual(Object.keys(payload).sort(),Object.keys(summaries[0]).sort());
 for(const payload of tabSummaries)for(const secret of ['32.123456789','-98.543210987','disposable-server-key'])assert.ok(!JSON.stringify(payload).includes(secret));
 pass('Cross-tab opt-in observes current state only; no pre-consent radius trail or precise coordinates');
 assert.deepEqual(errors,[]);await tabA.close();await tabB.close();
 writeFileSync(`${evidence}/results.json`,JSON.stringify({results,accepted,twoTabSummaryCount:tabSummaries.length,geolocation:'synthetic only',sink:'loopback aggregate fixture; database security tested separately',screenReader:'NOT VERIFIED: manual screen-reader session'},null,2));
}finally{await browser?.close();try{process.kill(-app.pid,'SIGTERM');}catch{}api.close();}
