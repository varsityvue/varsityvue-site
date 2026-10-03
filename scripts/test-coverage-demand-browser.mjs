// Isolated mounted UI -> first-party route -> synthetic aggregate sink.
// No production connection and no owner geolocation.
import assert from 'node:assert/strict';
import { mkdirSync,writeFileSync } from 'node:fs';
import http from 'node:http';
import { spawn, execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
const evidence='coverage-demand-browser-evidence';mkdirSync(evidence,{recursive:true});
let accepted=0, sinkMode='ok', scoreRows=[], timeoutCalls=0;const sinkBodies=[];
const api=http.createServer(async(req,res)=>{
 res.setHeader('Content-Type','application/json');
 if(req.url==='/rest/v1/rpc/server_record_coverage_demand_summary'){
  let body='';for await(const chunk of req)body+=chunk; sinkBodies.push(JSON.parse(body));
  if(sinkMode==='error'){res.statusCode=500;res.end('{}');return;}
  if(sinkMode==='timeout'){timeoutCalls++;setTimeout(()=>{res.end('{}');},3001).unref();return;}
  accepted++;res.end('null');return;
 }
 res.end(JSON.stringify(req.url.startsWith('/rest/v1/rpc/public_score_states') ? scoreRows : []));
});
await new Promise(resolve=>api.listen(54326,'127.0.0.1',resolve));
const app=spawn('npm',['run','dev','--','--hostname','127.0.0.1','--port','3001'],{detached:true,
 stdio:'inherit',env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54326',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'disposable-public',
 NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED:'true',COVERAGE_DEMAND_ENABLED:'true',COVERAGE_DEMAND_SUPABASE_URL:'http://127.0.0.1:54326',COVERAGE_DEMAND_SERVICE_ROLE_KEY:'disposable-server-key',
 NEXT_PUBLIC_TURNSTILE_SITE_KEY:'',SUPABASE_SERVICE_ROLE_KEY:'',RESEND_API_KEY:'',CRON_SECRET:''}
});
let browser;
const origin='http://127.0.0.1:3001',results=[];
const pass=name=>{results.push({name,status:'PASS'});console.log(`PASS ${name}`);};
const summaries=[], requests=[], errors=[],responses=[];
try {
 for(let i=0;i<120;i++) {try {if((await fetch(origin+'/games?week=7')).ok)break;}catch{} await new Promise(r=>setTimeout(r,500));assert.notEqual(i,119,'App unavailable');}
 assert.equal((await fetch(origin+'/api/coverage-demand',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:'{}'})).status,400);
 browser=await chromium.launch();
 const context=await browser.newContext({viewport:{width:390,height:900}});
 await context.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 await context.addInitScript(()=>{
  window.geoFixture={calls:0, mode:'granted', latitude:32.123456789,longitude:-98.543210987,accuracy:30};
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{getCurrentPosition(ok,fail){const f=window.geoFixture;f.calls++;if(f.mode==='hold')f.release=()=>ok({coords:f});else if(f.mode==='denied')fail({code:1});else ok({coords:f});},watchPosition(){throw Error('watchPosition forbidden');}}});
 });
 const make=async(c=context)=>{const p=await c.newPage();p.on('response',r=>{if(r.url().endsWith('/api/coverage-demand'))responses.push(r.status());});p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{requests.push(r.url()+(r.postData()??''));if(r.url().endsWith('/api/coverage-demand'))summaries.push({page:p,body:JSON.parse(r.postData())});});await p.clock.install();return p;};
 const page=await make();
 const allow=p=>p.getByRole('button',{name:'Allow regional measurement',exact:true});
 const decline=p=>p.getByRole('button',{name:'Don’t share regional usage',exact:true});
 const locate=p=>p.getByRole('button',{name:'Use my location',exact:true});
 const clear=p=>p.getByRole('button',{name:'Clear location',exact:true}).click();
 const cards=p=>p.locator('.weekly-row-link');
 const sent=p=>summaries.filter(s=>s.page===p).map(s=>s.body);
 const idle=p=>p.waitForTimeout(900);
 const go=(p,route='/games',week=7)=>p.goto(`${origin}${route}?season=2026&week=${week}&mode=nearby`,{waitUntil:'networkidle'});
 const radius=async(p,n)=>{await p.locator('.weekly-filters summary').click();await p.locator('select[name=radius]').selectOption(String(n));await p.getByRole('button',{name:'Apply filters',exact:true}).click();await p.locator('.weekly-filters summary').click();};
 const query=async(p,q)=>{await p.locator('#weekly-search').fill(q);await p.getByRole('button',{name:'Search',exact:true}).click();};
 await go(page);assert.equal(await page.evaluate(()=>window.geoFixture.calls),0);
 // The previous dormant preference must not enable a newly mounted episode.
 await page.evaluate(()=>localStorage.setItem('coverage_measurement_v1','enabled'));
 await page.reload({waitUntil:'networkidle'});
 assert.equal(await allow(page).getAttribute('aria-pressed'),'false');
 await locate(page).click();await page.clock.fastForward(61000);await idle(page);
 assert.equal(sent(page).length,0);await clear(page);
 await page.evaluate(()=>localStorage.removeItem('coverage_measurement_v1'));
 assert.equal(await page.getByRole('link',{name:'Read privacy, retention and withdrawal details'}).getAttribute('href'),'/privacy#regional-measurement');
 pass('Legacy dormant opt-in rejected; fuller disclosure linked; no pre-consent episode reconstructed');
 await page.getByRole('link',{name:'Read privacy, retention and withdrawal details'}).click();
 await page.getByRole('heading',{name:'Privacy at VarsityVue',exact:true}).waitFor();
 await page.screenshot({path:`${evidence}/privacy-disclosure.png`,fullPage:true});
 await page.goBack({waitUntil:'networkidle'});
 await page.getByRole('heading',{name:'Games & Scores',exact:true}).waitFor();
 assert.equal(await allow(page).getAttribute('aria-pressed'),'false');
 pass('General disclosure renders, browser Back restores Games & Scores and consent remains default off');

 await locate(page).click();assert.ok(await cards(page).count()>0);await clear(page);await idle(page);assert.equal(sent(page).length,0);
 await decline(page).click();await locate(page).click();await radius(page,150);await clear(page);await idle(page);assert.equal(sent(page).length,0);
 await page.reload({waitUntil:'networkidle'});assert.equal(await decline(page).getAttribute('aria-pressed'),'true');
 pass('Default/decline: location permission independent; discovery works; only preference persists');
 await allow(page).click();await radius(page,50);await locate(page).click();await radius(page,100);await radius(page,150);
 await query(page,'private-free-text-query');await clear(page);await idle(page);
 assert.equal(sent(page).length,1);assert.equal(sent(page)[0].radius_expansion_steps,2);assert.equal(sent(page)[0].query_present,true);assert.equal(sent(page)[0].zero_result_reason,'query_filter_excluded');assert.equal(accepted,1);
 pass('Unified controls emit one schema-2 coarse summary through real first-party HTTP; query text excluded');
 await query(page,'');await page.getByRole('link',{name:'Week 8',exact:true}).click();
 await page.getByRole('combobox',{name:'Or choose a school'}).selectOption('hamilton');await clear(page);await idle(page);assert.equal(sent(page).at(-1).center_source,'school_center');
 pass('School source distinct; week/center/Clear boundaries preserved');
 await locate(page).click();const beforeSelect=sent(page).length;await cards(page).first().click();await page.waitForURL(/\/games\/.+/);await idle(page);assert.equal(sent(page).length,beforeSelect+1);assert.equal(sent(page).at(-1).game_selected,true);
 const destination=page.url();assert.ok(!/latitude|longitude|bucket|measurement|consent|32\.123/.test(destination));
 await page.getByRole('link',{name:'← Back to Games',exact:true}).click();await page.waitForURL(/\/games\?/);assert.match(page.url(),/mode=nearby/);assert.equal(await cards(page).count(),0);
 pass('Selection/unmount dedupe; Game Center return preserves public context without location or consent');
 for(const alias of ['/games','/scoreboard']) {
  scoreRows=[{game_id:'lampasas-at-stephenville-2026-week-7',status:'live',home_score:10,away_score:0,verified:true,period:'1st',clock:'08:00',attribution_type:'verified',attribution_username:null}];
  await go(page,alias);await page.getByRole('link',{name:'LIVE',exact:true}).click();assert.equal(await page.getByRole('heading',{name:'Games & Scores',exact:true}).count(),1);assert.equal(await allow(page).count(),1);
  await locate(page).click();await page.clock.fastForward(30000);
  const start=sent(page).length;scoreRows=[{...scoreRows[0],status:'final'}];await page.getByRole('button',{name:'Refresh',exact:true}).click();await page.getByRole('button',{name:'Refresh',exact:true}).waitFor();await idle(page);assert.equal(sent(page).length,start);
  await page.clock.fastForward(31000);await idle(page);assert.equal(sent(page).length,start+1,'Refresh must not reset inactivity');assert.equal(sent(page).at(-1).held_results,true);assert.equal(sent(page).at(-1).final_game_count,1);assert.equal(sent(page).at(-1).live_game_count,0);
  await page.getByRole('button',{name:'Refresh',exact:true}).click();await page.getByRole('button',{name:'Refresh',exact:true}).waitFor();await clear(page);await idle(page);assert.equal(sent(page).length,start+1);
 }
 scoreRows=[];
 pass('Both direct aliases: one renderer, one consent control, one episode owner; refresh neither finalizes/restarts nor resets inactivity');
 await go(page);sinkMode='error';await locate(page).click();assert.ok(await cards(page).count());await clear(page);await idle(page);assert.ok(responses.includes(503));
 sinkMode='timeout';await locate(page).click();const began=Date.now();await clear(page);assert.ok(Date.now()-began<1500);await page.waitForTimeout(2300);assert.ok(timeoutCalls>0);sinkMode='ok';
 await page.route('**/api/coverage-demand',r=>r.abort());await locate(page).click();await cards(page).first().click();await page.waitForURL(/\/games\/.+/);await page.unroute('**/api/coverage-demand');
 pass('Failed, timed-out and blocked ingestion cannot impair discovery/Clear/navigation');
 await go(page);await page.evaluate(()=>window.geoFixture.mode='denied');await locate(page).click();assert.match(await page.locator('.weekly-location').innerText(),/permission denied/);
 await page.getByRole('combobox',{name:'Or choose a school'}).selectOption('de-leon');assert.ok(await cards(page).count());await clear(page);
 await page.evaluate(()=>window.geoFixture.mode='hold');await locate(page).click();await page.getByRole('button',{name:'Cancel request',exact:true}).click();await page.evaluate(()=>window.geoFixture.release());assert.equal(await cards(page).count(),0);
 pass('Denied GPS fallback and cancelled late callback remain safe');
 await page.evaluate(()=>window.geoFixture.mode='granted');
 for(const w of [7,8,9]){await page.getByRole('link',{name:`Week ${w}`,exact:true}).click();assert.ok(await locate(page).isEnabled());}
 for(const w of [10,11]){await page.getByRole('link',{name:`Week ${w}`,exact:true}).click();assert.ok(await locate(page).isDisabled());}
 pass('Weeks 7/8/9 enabled; 10/11 disabled');
 await page.getByRole('link',{name:'Week 9',exact:true}).click();await page.getByRole('combobox',{name:'Or choose a school'}).selectOption('jacksboro');
 for(const width of [390,400,430,1280]) {await page.setViewportSize({width,height:900});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:`${evidence}/unified-nearby-${width}.png`,fullPage:true});}
 await page.keyboard.press('Tab');await allow(page).focus();assert.notEqual(await allow(page).evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.keyboard.press('Tab');assert.ok(await decline(page).evaluate(e=>document.activeElement===e));await page.keyboard.press('Enter');await clear(page);
 pass('Responsive disclosure/results and keyboard consent reversal');
 // Each mounted B episode is active and unfinished before A withdraws. No hide/page navigation is used to withdraw.
 const a=await make(),b=await make();
 await b.addInitScript(()=>{window.delayStorage=false;window.addEventListener('storage',e=>{if(window.delayStorage)e.stopImmediatePropagation();},true);});
 await go(a);
 const activeB=async()=>{await allow(a).click();await go(b);await locate(b).click();await radius(b,100);assert.ok(await cards(b).count());assert.equal(await allow(b).getAttribute('aria-pressed'),'true');};
 for(const mode of ['withdraw','remove','invalid','clear']) {
  const before=sent(b).length;await activeB();assert.equal(sent(b).length,before);
  if(mode==='withdraw')await decline(a).click();else await a.evaluate(mode=>{if(mode==='remove')localStorage.removeItem('coverage_measurement_v2');else if(mode==='invalid')localStorage.setItem('coverage_measurement_v2','invalid');else localStorage.clear();},mode);
  await b.waitForFunction(()=>document.querySelector('[aria-describedby=coverage-disclosure] button')?.getAttribute('aria-pressed')==='false');
  await b.screenshot({path:`${evidence}/two-tab-${mode}-discarded.png`,fullPage:true});await b.clock.fastForward(61000);await idle(b);assert.equal(sent(b).length,before);
  await cards(b).first().click();await b.waitForURL(/\/games\/.+/);await idle(b);assert.equal(sent(b).length,before);
  pass(`Two-tab ${mode}: unfinished episode discarded; inactivity then selection sends nothing`);
 }
 await activeB();const blocked=sent(b).length;await b.evaluate(()=>{Storage.prototype.getItem=()=>{throw Error('blocked');};});await decline(a).click();
 await b.waitForFunction(()=>document.querySelector('[aria-describedby=coverage-disclosure] button')?.getAttribute('aria-pressed')==='false');await b.clock.fastForward(61000);await cards(b).first().click();await b.waitForURL(/\/games\/.+/);await idle(b);assert.equal(sent(b).length,blocked);
 pass('Cross-tab withdrawal revokes mounted fallback when reads become blocked');
 await activeB();await b.evaluate(()=>window.delayStorage=true);const delayed=sent(b).length;await decline(a).click();assert.equal(await allow(b).getAttribute('aria-pressed'),'true');await cards(b).first().click();await b.waitForURL(/\/games\/.+/);await idle(b);assert.equal(sent(b).length,delayed);
 pass('Finalization re-reads preference even when cross-tab notification is suppressed');
 await go(b);await locate(b).click();await radius(b,150);await radius(b,25);const preOpt=sent(b).length;await allow(a).click();
 await b.waitForFunction(()=>document.querySelector('[aria-describedby=coverage-disclosure] button')?.getAttribute('aria-pressed')==='true');await clear(b);await idle(b);assert.equal(sent(b).length,preOpt+1);assert.equal(sent(b).at(-1).initial_radius_miles,25);assert.equal(sent(b).at(-1).radius_expansion_steps,0);
 pass('Cross-tab opt-in starts current controls; no pre-consent interaction reconstruction');
 const restricted=await browser.newContext();await restricted.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 await restricted.addInitScript(()=>{Storage.prototype.getItem=()=>{throw Error('blocked');};Storage.prototype.setItem=()=>{throw Error('blocked');};Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(ok){ok({coords:{latitude:32.123456789,longitude:-98.543210987,accuracy:30}});}}});});
 const r=await make(restricted);await go(r);await allow(r).click();await locate(r).click();await clear(r);await idle(r);assert.equal(sent(r).length,1);await r.reload({waitUntil:'networkidle'});assert.equal(await allow(r).getAttribute('aria-pressed'),'false');await restricted.close();
 pass('Blocked storage explicit mounted memory fallback delivers; reload defaults off');
 const writeBlocked=await browser.newContext();await writeBlocked.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 await writeBlocked.addInitScript(()=>{Storage.prototype.setItem=()=>{throw Error('blocked writes');};});const w=await make(writeBlocked);await go(w);await allow(w).click();assert.equal(await allow(w).getAttribute('aria-pressed'),'false');await clear(w);await idle(w);assert.equal(sent(w).length,0);await writeBlocked.close();
 pass('Readable storage with failed writes fails conservatively');
 // Route departure sends one at most, and returning never carries geography or resumes an old episode.
 await go(page);await allow(page).click();await locate(page).click();const departed=accepted;await page.goto(origin+'/scoreboard?week=7&mode=nearby',{waitUntil:'networkidle'});await idle(page);assert.equal(accepted,departed+1,'Server receives exactly one departure summary even when unload detaches the page request listener');await clear(page);await idle(page);assert.equal(accepted,departed+1);
 pass('Alias departure is one boundary; returning alias cannot reconstruct a location episode');
 const stored=await page.evaluate(()=>({local:JSON.stringify(localStorage),session:JSON.stringify(sessionStorage),cookies:document.cookie,html:document.documentElement.outerHTML}));
 assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage)),['coverage_measurement_v2']);
 for(const secret of ['32.123456789','-98.543210987','private-free-text-query','disposable-server-key']){assert.ok(!JSON.stringify(summaries.map(s=>s.body)).includes(secret));assert.ok(!JSON.stringify(sinkBodies).includes(secret));assert.ok(!JSON.stringify(stored).includes(secret));if(secret!=='private-free-text-query')assert.ok(!requests.join('\n').includes(secret));}
 assert.deepEqual(errors,[]);pass('Precise synthetic coordinates, credentials, query and identities absent from requests/storage/markup; no runtime errors');
 writeFileSync(`${evidence}/results.json`,JSON.stringify({head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),tree:execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim(),results,accepted,twoTabSummaryCount:sent(b).length,fixture:'Loopback synthetic sink; no production data or owner GPS',screenReader:'NOT VERIFIED'},null,2));
 await context.close();
} finally {await browser?.close();try{process.kill(-app.pid,'SIGTERM');}catch{}api.closeAllConnections();api.close();}
