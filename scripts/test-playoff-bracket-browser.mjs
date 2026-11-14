import assert from 'node:assert/strict';
import {getSchoolLogoImageStyle} from '../data/school-logos.ts';
import {getGames} from '../lib/games.ts';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,devices} from 'playwright';

// Entirely isolated acceptance: no production database or account writes.
const output='playoff-bracket-browser-evidence';mkdirSync(output,{recursive:true});
const ownerLogos=JSON.parse(readFileSync('docs/2a-d1-owner-logos-20261114/inventory.json','utf8'));
const baseline=JSON.parse(readFileSync('tests/fixtures/2adi-published-finals-20261114.json','utf8'));
let fixtureFailure=false;
const calls=[];const states=baseline.map(row=>({...row,period:null,clock:null,kickoff_override:null,result_type:null,official_winner_school_slug:null,attribution_type:'verified'}));
const fixture=createServer((req,res)=>{
 calls.push({method:req.method,path:req.url});
 res.setHeader('content-type','application/json');res.setHeader('access-control-allow-origin','*');
 if(fixtureFailure){res.statusCode=503;res.end(JSON.stringify({error:'isolated outage'}));return;}
 res.end(JSON.stringify(req.url?.includes('/rpc/public_score_states')?states:[]));
});
await new Promise(resolve=>fixture.listen(54329,'127.0.0.1',resolve));
const app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3107'],{env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54329',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'isolated-public'},stdio:['ignore','pipe','pipe']});
let serverLog='';for(const stream of [app.stdout,app.stderr])stream.on('data',data=>{serverLog+=data.toString();});
let browser,activePage;const results=[];const origin='http://127.0.0.1:3107';
const canvasLabel='Bracket canvas. Use zoom and fit buttons or drag to navigate.';
const selection='2A-D1|1|De Leon';
const scale=async canvas=>canvas.locator(':scope > div').evaluate(el=>new DOMMatrix(getComputedStyle(el).transform).a);
const checkContained=async(page,canvas)=>{
 const checks=await canvas.evaluate(el=>{
  const viewport=el.getBoundingClientRect();return [...el.querySelectorAll('article')].map(node=>{const b=node.getBoundingClientRect();return b.left>=viewport.left-1&&b.right<=viewport.right+1&&b.top>=viewport.top-1&&b.bottom<=viewport.bottom+1;});
 });assert.ok(checks.every(Boolean),'all displayed cards fit measured canvas bounds');
};
try{
 for(let i=0;i<100;i++){
  try{if((await fetch(origin+'/playoffs')).ok)break;}catch{}
  if(i===99)throw new Error('Application did not start');await new Promise(r=>setTimeout(r,200));
 }
 browser=await chromium.launch({args:['--no-sandbox']});
 for(const [name,options] of [['iphone',devices['iPhone 13']],['android',devices['Pixel 7']],['desktop',{viewport:{width:1280,height:900}}]]){
  const context=await browser.newContext({...options});
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(url.hostname)?route.continue():route.abort();
  });
  const page=await context.newPage();activePage=page;
  await page.goto(origin+'/playoffs?school='+encodeURIComponent(selection));
  const search=page.getByRole('searchbox',{name:'Search bracket schools',exact:true});
  await search.waitFor();await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).waitFor();
  await page.waitForFunction(()=>!document.querySelector('fieldset[disabled]'));
  const canvas=page.getByLabel(canvasLabel,{exact:true});const bracket=page.getByRole('region',{name:'Interactive Road to State bracket',exact:true});
  assert.equal(await page.getByRole('combobox',{name:'Choose bracket school',exact:true}).inputValue(),selection);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal page overflow');
  await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[aria-label="Bracket region"]').value==='all');
  assert.equal(await bracket.locator('article').count(),63);assert.equal(await bracket.locator('svg path').count(),62);
  await checkContained(page,canvas);
  for(const row of ownerLogos) assert.ok(await bracket.locator(`img[src="/logos/schools/${row.slug}.png"]`).count()>0, `${row.slug} statewide identity`);
  const fitted=await scale(canvas);await page.getByRole('button',{name:'Zoom in',exact:true}).click();assert.ok(await scale(canvas)>fitted);
  await page.getByRole('button',{name:'Reset view',exact:true}).click();assert.ok(Math.abs(await scale(canvas)-fitted)<.001);
  await page.getByRole('combobox',{name:'Bracket region',exact:true}).selectOption('1');
  await page.getByRole('button',{name:'Fit selected region',exact:true}).click();assert.equal(await bracket.locator('article').count(),15);await checkContained(page,canvas);
  await canvas.scrollIntoViewIfNeeded();let box=await canvas.boundingBox();assert.ok(box);
  const beforeDrag=await canvas.locator(':scope > div').getAttribute('style');
  await page.mouse.move(box.x+box.width-20,box.y+12);await page.mouse.down();await page.mouse.move(box.x+box.width-65,box.y+42,{steps:5});await page.mouse.up();
  assert.notEqual(await canvas.locator(':scope > div').getAttribute('style'),beforeDrag);
  assert.equal(await canvas.evaluate(el=>getComputedStyle(el).userSelect),'none','panning never selects card text');
  if(options.hasTouch){
   await page.getByRole('button',{name:'Find De Leon',exact:true}).click();await canvas.scrollIntoViewIfNeeded();box=await canvas.boundingBox();
   const cx=box.x+box.width/2,cy=box.y+box.height/2;const initial=await scale(canvas);const cdp=await context.newCDPSession(page);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx-25,y:cy,id:1},{x:cx+25,y:cy,id:2}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-45,y:cy+8,id:1},{x:cx+45,y:cy+8,id:2}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   assert.ok(await scale(canvas)>initial,'emulated two-finger pinch increases scale');await cdp.detach();
   assert.ok(page.url().includes('/playoffs'),'pinch does not activate a team link');
  }
  await page.getByRole('button',{name:'Find De Leon',exact:true}).click();await canvas.scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/${name}-school-path.png`});
  await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).click();await canvas.scrollIntoViewIfNeeded();await page.screenshot({path:`${output}/${name}-statewide.png`});
  for(const region of ['0','1','2','3']){
   await page.getByRole('combobox',{name:'Bracket region',exact:true}).selectOption(region);
   await page.getByRole('button',{name:'Fit selected region',exact:true}).click();
   const expected=await bracket.locator('img[src^="/logos/schools/"]').evaluateAll(images=>images.map(img=>({src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0})));
   await page.waitForFunction(()=>[...document.querySelectorAll('[aria-label="Interactive Road to State bracket"] img')].every(img=>img.complete&&img.naturalWidth>0));
   assert.ok(expected.length>0);await canvas.scrollIntoViewIfNeeded();
   await page.screenshot({path:`${output}/${name}-di-region-${Number(region)+1}-logos.png`});
  }
  for(const division of ['2A-D1','2A-D2','3A-D1','3A-D2','4A-D1','4A-D2']){
   await page.getByRole('combobox',{name:'Bracket division',exact:true}).selectOption(division);await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).click();assert.equal(await bracket.locator('article').count(),63);
  }
  await search.fill('Panhandle');await page.getByRole('combobox',{name:'Choose bracket school',exact:true}).selectOption('2A-D1|0|Panhandle');
  await page.waitForURL(/school=2A-D1%7C0%7CPanhandle/);await page.reload();await page.waitForFunction(()=>!document.querySelector('fieldset[disabled]'));
  assert.equal(await page.getByRole('combobox',{name:'Choose bracket school',exact:true}).inputValue(),'2A-D1|0|Panhandle');
  await page.getByRole('combobox',{name:'Choose bracket school',exact:true}).selectOption(selection);await page.goBack();
  assert.equal(await page.getByRole('combobox',{name:'Choose bracket school',exact:true}).inputValue(),'2A-D1|0|Panhandle');await page.goForward();
  assert.equal(await page.getByRole('combobox',{name:'Choose bracket school',exact:true}).inputValue(),selection);
  await page.getByRole('link',{name:'Game Center for Panhandle vs. Floydada',exact:true}).click();await page.getByRole('heading',{name:'Floydada vs. Panhandle',exact:true}).waitFor();
  assert.ok((await page.locator('main').innerText()).includes('62'));assert.ok((await page.locator('main').innerText()).includes('FINAL · VERIFIED'));
  await page.getByRole('link',{name:'View Panhandle Hub →',exact:true}).click();await page.getByRole('heading',{name:'Panhandle',exact:true}).waitFor();
  const record=page.getByText('2026 Record',{exact:true}).locator('..');assert.equal(await record.locator('p').first().innerText(),'—');
  await page.locator('a[href="/schools/panhandle/schedule"]').first().click();await page.locator('a[href="/games/2026-bi-district-2a-d1-i-1"]').first().waitFor();
  assert.equal(await page.getByText('Record',{exact:true}).locator('..').locator('p').last().innerText(),'—','schedule and hub withhold the same incomplete record');
  await page.goto(origin+'/playoffs?school='+encodeURIComponent('2A-D2|1|Stamford'));
  await page.waitForFunction(()=>!document.querySelector('fieldset[disabled]'));
  const d2=page.getByRole('region',{name:'Interactive Road to State bracket',exact:true});
  const d2canvas=page.getByLabel(canvasLabel,{exact:true});
  assert.equal(await page.getByRole('combobox',{name:'Bracket division',exact:true}).inputValue(),'2A-D2');
  assert.ok((await d2.innerText()).includes('W6'),'official DII seed labels render');
  assert.ok((await d2.innerText()).includes('Stamford'));
  await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).click();await checkContained(page,d2canvas);
  assert.equal(await d2.locator('article').count(),63);
  assert.equal(await d2.locator('article').filter({hasText:'Verified final'}).count(),31);
  for(const region of ['0','1','2','3']){
   await page.getByRole('combobox',{name:'Bracket region',exact:true}).selectOption(region);
   await page.getByRole('button',{name:'Fit selected region',exact:true}).click();await checkContained(page,d2canvas);
   assert.equal(await d2.locator('article').count(),15);
  }
  assert.ok((await d2.innerText()).includes('Winner pending'),'last Area opponent stays pending');
  await page.getByRole('combobox',{name:'Bracket region',exact:true}).selectOption('all');
  await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).click();await d2canvas.scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/${name}-d2-statewide.png`});
  await page.getByRole('button',{name:'Find Stamford',exact:true}).click();await d2canvas.scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/${name}-d2-stamford-path.png`});
  await page.goto(origin+'/games/2026-bi-district-2a-d2-i-1');
  const d2final=await page.locator('main').innerText();assert.ok(d2final.includes('FINAL · VERIFIED')&&d2final.includes('69')&&d2final.includes('14'));
  await page.goto(origin+'/games/2026-area-2a-d2-ii-2');
  const d2area=await page.locator('main').innerText();assert.ok(d2area.includes('Stamford')&&d2area.includes('Windthorst')&&d2area.includes('7:00 PM')&&d2area.includes('Breckenridge'));
  await page.goto(origin+'/admin/playoff-publishing/bracket-templates');await page.getByRole('heading',{name:'Welcome back.',exact:true}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'Bracket template review',exact:true}).count(),0);
  results.push({device:name,viewport:options.viewport,pass:true,pinch:options.hasTouch?'emulated native touch passed':'not applicable'});await context.close();
 }
 // Every supplied identity is checked in real school routes, not a synthetic component.
 const logoContext=await browser.newContext({viewport:{width:1280,height:900}});
 const logoPage=await logoContext.newPage();activePage=logoPage;
 const checkLogo=async(slug)=>{
  const img=logoPage.locator(`img[src="/logos/schools/${slug}.png"]:visible`).first();
  await img.waitFor();await img.scrollIntoViewIfNeeded();
  await img.evaluate(el=>el.decode());assert.ok(await img.evaluate(el=>el.naturalWidth>0),slug);
 };
 for(const row of ownerLogos){
  for(const suffix of ['', '/schedule']){
   await logoPage.goto(`${origin}/schools/${row.slug}${suffix}`);
   if(!suffix) await checkLogo(row.slug);
   else { await logoPage.locator('main h1').waitFor();assert.ok((await logoPage.locator('main').innerText()).includes(row.name)); }
   results.push({school:row.slug,surface:suffix?'schedule (text-only design)':'hub',pass:true});
  }
 }
 const logoGames=getGames().filter(game=>game.playoff?.division==='2A Division I'&&['Bi-District','Area'].includes(game.playoff.round));
 assert.equal(logoGames.length,48);
 for(const row of logoGames){
  await logoPage.goto(`${origin}/games/${row.id}`);
  for(const slug of [row.homeSchoolSlug,row.awaySchoolSlug].filter(slug=>ownerLogos.some(logo=>logo.slug===slug))) await checkLogo(slug);
  results.push({game:row.id,surface:'game-center',pass:true});
 }
 // Side-by-side alpha/contrast inspection at actual small bracket size and larger hub size.
 await logoPage.setContent(`<html><body style="margin:0;display:grid;grid-template-columns:repeat(6,1fr);font:12px Arial">${ownerLogos.map(row=>`<div style="padding:8px;border:1px solid #999"><p>${row.name}</p>${['#fff','#202127'].map(bg=>`<div style="background:${bg};padding:8px;display:flex;gap:14px;align-items:center"><img width="26" height="26" style="object-fit:contain;filter:${getSchoolLogoImageStyle(row.slug).filter??'none'}" src="${origin}/logos/schools/${row.slug}.png"><img width="64" height="64" style="object-fit:contain;filter:${getSchoolLogoImageStyle(row.slug).filter??'none'}" src="${origin}/logos/schools/${row.slug}.png"></div>`).join('')}</div>`).join('')}</body></html>`);
 await logoPage.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));
 await logoPage.screenshot({path:`${output}/owner-logos-light-dark.png`,fullPage:true});
 await logoContext.close();
 const fallbackContext=await browser.newContext();const fallbackPage=await fallbackContext.newPage();
 fixtureFailure=true;
 await fallbackPage.goto(origin+'/games/de-leon-vs-alvord-2026-bi-district');
 await fallbackPage.getByRole('heading',{name:'Alvord vs. De Leon',exact:true}).waitFor();
 const fallbackText=await fallbackPage.locator('main').innerText();
 assert.ok(fallbackText.includes('FINAL · VERIFIED')&&fallbackText.includes('40')&&fallbackText.includes('24'),'reviewed final renders on initial feed failure');
 await fallbackPage.screenshot({path:`${output}/repository-final-feed-failed.png`});
 fixtureFailure=false;const deLeon=states.find(row=>row.game_id==='de-leon-vs-alvord-2026-bi-district');
 deLeon.status='scheduled';deLeon.home_score=null;deLeon.away_score=null;
 await fallbackPage.reload();await fallbackPage.getByRole('heading',{name:'Alvord vs. De Leon',exact:true}).waitFor();
 assert.ok((await fallbackPage.locator('main').innerText()).includes('FINAL · VERIFIED'),'verified pregame metadata cannot regress a reviewed final');
 deLeon.status='final';deLeon.home_score=42;deLeon.away_score=24;
 await fallbackPage.reload();await fallbackPage.getByRole('heading',{name:'Alvord vs. De Leon',exact:true}).waitFor();
 assert.ok((await fallbackPage.locator('main').innerText()).includes('42'),'isolated authoritative correction overrides repository fallback');
 deLeon.home_score=40;await fallbackContext.close();
 assert.ok(calls.every(c=>c.method==='GET'||c.method==='HEAD'||c.method==='OPTIONS'||(c.method==='POST'&&c.path?.includes('/rpc/public_score_states'))),'only read requests reach fixture');
 writeFileSync(`${output}/results.json`,JSON.stringify({results,fixtureOnly:true},null,2));
 console.log(JSON.stringify(results,null,2));
}catch(error){await activePage?.screenshot({path:`${output}/failure.png`}).catch(()=>{});writeFileSync(`${output}/failure.txt`,String(error.stack??error));throw error;}
finally{writeFileSync(`${output}/server.log`,serverLog);await browser?.close();app.kill('SIGTERM');await new Promise(resolve=>fixture.close(resolve));}
