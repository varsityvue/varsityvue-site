import assert from 'node:assert/strict';
import http from 'node:http';
import {createHmac} from 'node:crypto';
import {spawn,execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {chromium} from 'playwright';
const evidence='games-organization-browser-evidence';mkdirSync(evidence,{recursive:true});
const origin='http://127.0.0.1:3019';const id='00000000-0000-4000-8000-000000000001';
const payload={sub:id,aud:'authenticated',role:'authenticated',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600};const body=[{alg:'HS256',typ:'JWT'},payload].map(x=>Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');const session={access_token:`${body}.${createHmac('sha256','fixture-only').update(body).digest('base64url')}`,refresh_token:'fixture',expires_at:payload.exp,expires_in:3600,token_type:'bearer',user:{id,aud:'authenticated',role:'authenticated',app_metadata:{},user_metadata:{}}};
let mode='normal';let writes=0;
const rows=[
 {game_id:'de-leon-at-hawley-2026-week-7',status:'live',home_score:0,away_score:0,verified:true},
 {game_id:'albany-at-stamford-2026-week-7',status:'final',home_score:7,away_score:0,verified:true,result_type:'played'},
 {game_id:'anson-at-cisco-2026-week-7',status:'postponed',verified:true},
 {game_id:'comanche-at-millsap-2026-week-7',status:'cancelled',verified:true},
 {game_id:'crawford-at-hubbard-2026-week-7',status:'final',verified:true,result_type:'forfeit',official_winner_school_slug:'hubbard'},
 {game_id:'eastland-at-clifton-2026-week-7',status:'scheduled',verified:true,kickoff_override:new Date(Date.now()-3600000).toISOString()},
 {game_id:'hamlin-at-goldthwaite-2026-week-7',status:'final',verified:true,result_type:'no_contest'},
 {game_id:'merkel-at-jacksboro-2026-week-7',status:'live',verified:true},
];
const api=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');const path=req.url;const send=x=>res.end(JSON.stringify(x));if(path.startsWith('/auth/v1/user'))return send(session.user);if(req.method==='POST'&&!path.startsWith('/rest/v1/rpc/public_score_states'))writes++;
 if(mode==='failure'&&(path.includes('public_score_states')||path.includes('public_game_state')||path.includes('school_follows'))){res.statusCode=503;return send({message:'Isolated unavailable fixture'});}
 if(path.includes('public_score_states'))return send(rows);
 if(path.includes('school_follows'))return send([{school_slug:'de-leon'},{school_slug:'hawley'}]);
 if(path.includes('member_account_status'))return send([{status:'active'}]);send([]);
});await new Promise(r=>api.listen(54329,'127.0.0.1',r));
const pagePath='app/games/page.tsx';const after=readFileSync(pagePath,'utf8');let app,browser;let log='';
function start(){app=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3019'],{stdio:['ignore','pipe','pipe'],env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54329',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'fixture-public-key',SUPABASE_SERVICE_ROLE_KEY:'',RESEND_API_KEY:'',CRON_SECRET:''}});app.stdout.on('data',d=>log+=d);app.stderr.on('data',d=>log+=d);}
async function ready(){for(let i=0;i<100;i++){try{if((await fetch(origin+'/games')).ok)return;}catch{}await new Promise(r=>setTimeout(r,500));}throw Error(log.slice(-2000));}
async function isolatedContext(){const c=await browser.newContext();await c.route(/https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());await c.addInitScript(()=>{window.locationCalls=0;Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(){window.locationCalls++;}}});});return c;}
const results=[];const pass=name=>{results.push({name,status:'PASS'});console.log('PASS',name);};
const contrastEvidence=[];
async function checkStatusContrast(page,width,view) {
 const measurements=await page.locator('article[data-game-id] > a:first-child > p:first-child').evaluateAll(labels=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const pixel=()=>Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3);
  const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
  const ratio=(a,b)=>(Math.max(luminance(a),luminance(b))+0.05)/(Math.min(luminance(a),luminance(b))+0.05);
  return labels.map(label=>{
   const ancestors=[];for(let e=label;e;e=e.parentElement)ancestors.unshift(e);
   ctx.clearRect(0,0,1,1);ctx.fillStyle='#FFFFFF';ctx.fillRect(0,0,1,1);
   for(const e of ancestors){const css=getComputedStyle(e);if(css.backgroundImage!=='none'||Number(css.opacity)!==1)throw Error('Contrast fixture requires solid backgrounds and full element opacity');ctx.fillStyle=css.backgroundColor;ctx.fillRect(0,0,1,1);}
   const background=pixel();const foregroundCss=getComputedStyle(label).color;
   ctx.clearRect(0,0,1,1);ctx.fillStyle=foregroundCss;ctx.fillRect(0,0,1,1);const foreground=pixel();
   return {label:label.textContent.trim(),foregroundCss,foreground,background,ratio:ratio(foreground,background),previousRatio:ratio([139,16,32],background)};
  });
 });
 assert.ok(measurements.length>0,`No status labels measured in ${view}`);
 for(const m of measurements)assert.ok(m.ratio>=4.5,`${width}px ${view}: ${m.label} has ${m.ratio.toFixed(2)}:1 contrast`);
 contrastEvidence.push({width,view,measurements});
}
async function checkViewFocus(page) {
 const link=page.getByRole('link',{name:'Completed Games',exact:true});await page.keyboard.press('Tab');await link.focus();
 assert.ok(await link.evaluate(e=>{const css=getComputedStyle(e);return document.activeElement===e&&css.outlineStyle!=='none'&&parseFloat(css.outlineWidth)>=2;}),'View keyboard focus must remain visible');
 await page.keyboard.press('Tab');
}
try{
 writeFileSync(pagePath,execFileSync('git',['show','7418f075a8778b9b90e90420a906aba989f0a178:app/games/page.tsx']));start();await ready();browser=await chromium.launch({args:['--no-sandbox']});let c=await isolatedContext();let page=await c.newPage();
 for(const width of [390,400,430,1280]){await page.setViewportSize({width,height:900});await page.goto(origin+'/games');await page.screenshot({path:`${evidence}/before-${width}.png`,fullPage:true});}
 await c.close();await new Promise(resolve=>{app.once('exit',resolve);app.kill('SIGTERM');});writeFileSync(pagePath,after);rmSync('.next/dev',{recursive:true,force:true});start();await ready();c=await isolatedContext();page=await c.newPage();await page.goto(origin+'/games');await page.getByRole('navigation',{name:'Game views'}).waitFor();
 for(const width of [390,400,430,1280]){await page.setViewportSize({width,height:900});await page.goto(origin+'/games');assert.equal(await page.getByRole('link',{name:'Current Games',exact:true}).getAttribute('aria-current'),'page');assert.equal(await page.getByRole('heading',{name:'Verified finals',exact:true}).count(),0);assert.equal(await page.locator('#nearby-disclosure').getAttribute('open'),null);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await checkStatusContrast(page,width,'current');await checkViewFocus(page);await page.screenshot({path:`${evidence}/after-current-${width}.png`,fullPage:true});await page.getByRole('link',{name:'Completed Games',exact:true}).click();await page.waitForURL(/view=completed/);assert.ok((await page.locator('main').innerText()).includes('Cancelled matchups'));assert.ok((await page.locator('main').innerText()).includes('Forfeit'));assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await checkStatusContrast(page,width,'completed');await checkViewFocus(page);await page.screenshot({path:`${evidence}/after-completed-${width}.png`,fullPage:true});}pass('Four widths: current/completed, correct labels, scoreless forfeit, no horizontal overflow');
 const measuredLabels=contrastEvidence.flatMap(s=>s.measurements.map(m=>m.label));
 for(const prefix of ['Upcoming','FINAL · verified ·','LIVE · verified score','LIVE · verified status','Kickoff window · live score unavailable','Postponed','Cancelled','Result awaiting verification','FINAL · verified outcome'])assert.ok(measuredLabels.some(label=>label.startsWith(prefix)),`Missing contrast variant: ${prefix}`);
 writeFileSync(`${evidence}/contrast.json`,JSON.stringify(contrastEvidence,null,2));pass('Computed foreground/background contrast >= 4.5:1 for every matchup status and visible keyboard focus at all four widths');
 await page.goto(origin+'/games?q=fixture-no-match');assert.match(await page.locator('main').innerText(),/No matchups match these filters/);await page.getByRole('link',{name:'Completed Games',exact:true}).focus();assert.ok((await page.getByRole('link',{name:'Completed Games',exact:true}).boundingBox()).height>=44);await page.keyboard.press('Enter');await page.waitForURL(/view=completed/);assert.equal(await page.locator('#matchup-search').inputValue(),'fixture-no-match');pass('Empty state, keyboard view navigation, selected state and 44px view targets');
 await page.goto(origin+'/games?q=Albany');await page.getByRole('link',{name:/matching completed games/}).waitFor();await page.getByRole('link',{name:/matching completed games/}).click();await page.waitForURL(/view=completed/);assert.equal(await page.locator('#matchup-search').inputValue(),'Albany');await page.reload();assert.equal(await page.getByRole('link',{name:'Completed Games',exact:true}).getAttribute('aria-current'),'page');await page.goBack();await page.waitForURL(/q=Albany$/);await page.goForward();await page.waitForURL(/view=completed/);pass('Cross-view search, preserved query, refresh and browser history');
 await page.goto(origin+'/games?view=completed&week=11');assert.match(await page.locator('main').innerText(),/Week 11 has no games/);await page.goto(origin+'/games?status=final#all-matchups');assert.equal(await page.getByRole('link',{name:'Completed Games',exact:true}).getAttribute('aria-current'),'page');pass('Incompatible weeks explicit and legacy final/query/anchor links');
 await page.goto(origin+'/games#nearby-games');assert.equal(await page.locator('#nearby-disclosure').getAttribute('open'),'');assert.equal(await page.evaluate(()=>window.locationCalls),0);await page.waitForFunction(()=>document.getElementById('nearby-disclosure').getBoundingClientRect().top>=document.querySelector('header.sticky').getBoundingClientRect().bottom);assert.ok((await page.locator('#nearby-disclosure').boundingBox()).y>=80);for(const w of ['7','8','9','10','11']){await page.locator('#nearby-week').selectOption(w);assert.equal(await page.getByRole('button',{name:'Games Near Me',exact:true}).isEnabled(),Number(w)<10);}pass('Nearby direct anchor, sticky offset, no geolocation on expansion and exact week gates');
 await page.goto(origin+'/games');await page.locator('#nearby-disclosure summary').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#nearby-disclosure').getAttribute('open'),'');assert.equal(await page.evaluate(()=>window.locationCalls),0);assert.ok((await page.locator('#nearby-disclosure summary').boundingBox()).height>=44);pass('Keyboard disclosure and touch target');
 await c.addCookies([{name:'sb-127-auth-token',value:`base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`,url:origin,sameSite:'Lax'}]);await page.goto(origin+'/games');await page.getByRole('heading',{name:'Following',exact:true}).waitFor();assert.equal(await page.locator('article[data-game-id="de-leon-at-hawley-2026-week-7"]').count(),1);assert.match(await page.locator('article[data-game-id="de-leon-at-hawley-2026-week-7"]').innerText(),/0–0/);assert.ok(await page.getByRole('heading',{name:'Kickoff window · live score unavailable',exact:true}).count());assert.ok(await page.getByRole('heading',{name:'Results awaiting verification',exact:true}).count());pass('Authenticated fixture follows both schools once; verified LIVE 0–0, timing and awaiting distinct');
 mode='failure';await page.goto(origin+'/games');assert.match(await page.locator('main').innerText(),/Live score data could not be refreshed/);assert.match(await page.locator('main').innerText(),/followed matchups could not be loaded/);pass('Score and follow failures remain explicit');
 assert.equal(writes,0);writeFileSync(`${evidence}/results.json`,JSON.stringify(results,null,2));
}catch(error){console.error(log.slice(-12000));throw error;}finally{writeFileSync(pagePath,after);if(browser)await browser.close();app?.kill('SIGTERM');api.close();}
