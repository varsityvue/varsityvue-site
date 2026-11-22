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
// Both Area fixtures must be upcoming for the existing school-hub assertions.
const fixtureClock = "import { mock } from 'node:test'; mock.timers.enable({ apis: ['Date'], now: Date.parse('2026-11-19T18:00:00Z') });";
const clockImport = `--import=data:text/javascript,${encodeURIComponent(fixtureClock)}`;
const app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3107'],{env:{...process.env,NODE_OPTIONS:[process.env.NODE_OPTIONS,clockImport].filter(Boolean).join(' '),NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54329',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'isolated-public'},stdio:['ignore','pipe','pipe']});
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
 const sharingHtml=await (await fetch(origin+'/playoffs',{headers:{'User-Agent':'facebookexternalhit/1.1'}})).text();
 for (const tag of [
  '<title>2026 Texas High School Football Playoff Central | VarsityVue</title>',
  '<link rel="canonical" href="https://varsityvue.com/playoffs"',
  '<meta property="og:title" content="2026 Texas High School Football Playoff Central | VarsityVue"',
  '<meta property="og:url" content="https://varsityvue.com/playoffs"',
  '<meta property="og:image" content="https://varsityvue.com/playoff-central-2026.png"',
 ]) assert.ok(sharingHtml.includes(tag),tag);
 browser=await chromium.launch({args:['--no-sandbox']});
 for(const [name,options] of [['iphone',devices['iPhone 13']],['android',devices['Pixel 7']],['desktop',{viewport:{width:1280,height:900}}]]){
  const context=await browser.newContext({...options});
  await context.route('**/*',route=>{
   const url=new URL(route.request().url());return ['127.0.0.1','localhost'].includes(url.hostname)?route.continue():route.abort();
  });
  const page=await context.newPage();activePage=page;
  await page.goto(origin+'/playoffs?school='+encodeURIComponent(selection));
  const myTeam = page.getByRole('link', {name:'My Team',exact:true});
  const brackets = page.getByRole('link', {name:'Brackets',exact:true});
  const gamesAndScores = page.getByRole('link', {name:'Games & Scores',exact:true});
  const teamSearch = page.getByRole('searchbox', {name:'Search schools',exact:true});
  await teamSearch.waitFor();
  assert.equal(await myTeam.getAttribute('aria-current'),'location');
  assert.equal(await page.getByLabel(canvasLabel,{exact:true}).count(),0);
  assert.ok(await teamSearch.evaluate(el=>el.getBoundingClientRect().bottom <= innerHeight),'school search appears in the first viewport');
  await page.screenshot({path:`${output}/${name}-my-team.png`});
  await teamSearch.fill('Stephenville');
  await teamSearch.press('Enter');
  await page.waitForURL(/school=4A-D1%7C2%7CStephenville/);
  await page.locator('#team-path').getByText('Latest verified result',{exact:false}).waitFor();
  const teamGame = page.locator('#team-path').getByRole('link',{name:'View Game Center',exact:true}).first();
  await teamGame.click();
  await page.waitForURL(/\/games\//);
  await page.goBack();
  await page.locator('#playoff-team-select').selectOption(selection);
  await brackets.focus();
  await brackets.press('Enter');
  const search=page.getByRole('searchbox',{name:'Search bracket schools',exact:true});
  await search.waitFor();await page.getByText('View options',{exact:true}).click();await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).waitFor();
  await page.waitForFunction(()=>!document.querySelector('fieldset[disabled]'));
  const canvas=page.getByLabel(canvasLabel,{exact:true});const bracket=page.getByRole('region',{name:'Interactive Road to State bracket',exact:true});
  assert.ok(await page.getByRole('searchbox',{name:'Search bracket schools',exact:true}).isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal page overflow');
  await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[aria-label="Bracket region"]').value==='all');
  assert.equal(await bracket.locator('article').count(),63);assert.equal(await bracket.locator('svg path').count(),62);
  await checkContained(page,canvas);
  for(const row of ownerLogos) assert.ok(await bracket.locator(`img[src="/logos/schools/${row.slug}.png"]`).count()>0, `${row.slug} statewide identity`);
  const fitted=await scale(canvas);await page.getByRole('button',{name:'Zoom in',exact:true}).click();assert.ok(await scale(canvas)>fitted);
  await page.getByRole('button',{name:'Reset View',exact:true}).click();assert.ok(Math.abs(await scale(canvas)-fitted)<.001);
  await page.getByRole('combobox',{name:'Bracket region',exact:true}).selectOption('1');
  await page.getByRole('button',{name:'Reset View',exact:true}).click();assert.equal(await bracket.locator('article').count(),15);await checkContained(page,canvas);
  // At fit scale the bracket may have no legal pan range; zoom in before testing drag.
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
  await page.getByRole('button',{name:'Zoom in',exact:true}).click();
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
   await page.getByRole('button',{name:'Reset View',exact:true}).click();
   const expected=await bracket.locator('img[src^="/logos/schools/"]').evaluateAll(images=>images.map(img=>({src:img.getAttribute('src'),loaded:img.complete&&img.naturalWidth>0})));
   await page.waitForFunction(()=>[...document.querySelectorAll('[aria-label="Interactive Road to State bracket"] img')].every(img=>img.complete&&img.naturalWidth>0));
   assert.ok(expected.length>0);await canvas.scrollIntoViewIfNeeded();
   await page.screenshot({path:`${output}/${name}-di-region-${Number(region)+1}-logos.png`});
  }
  const deLeonReturn=page.url();
  await gamesAndScores.click();
  const gameStatus=page.getByRole('combobox',{name:'Game status'});
  const gamesDivision=page.getByRole('combobox',{name:'Division',exact:true});
  assert.equal(await gameStatus.inputValue(),'today');
  await gameStatus.selectOption('finals');
  await gamesDivision.selectOption('2A Division I');
  assert.equal(await page.locator('#games-scores ul li').count(),12);
  await page.getByRole('button',{name:'Show more games'}).click();
  assert.equal(await page.locator('#games-scores ul li').count(),24);
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.screenshot({path:`${output}/${name}-games-scores.png`});
  await gameStatus.selectOption('all');
  await gamesDivision.selectOption('2A Division I');
  // Find the owner-supplied logo in the compact Games & Scores rows.
  const leon=page.locator('#games-scores li').filter({has:page.getByRole('img',{name:'Leon logo',exact:true})}).filter({hasText:'Ganado'});
  for(let i=0;i<4 && !(await leon.count());i++) await page.getByRole('button',{name:'Show more games'}).click();
  const leonLogo=leon.getByRole('img',{name:'Leon logo',exact:true});
  await leonLogo.scrollIntoViewIfNeeded();
  await leonLogo.evaluate(img=>img.decode());
  assert.ok((await leonLogo.evaluate(img=>getComputedStyle(img).filter)).includes('drop-shadow'),'dark owner artwork retains its contrast filter on Playoff Central rows');
  await page.goto(origin+'/games/2026-area-2a-d1-ii-4');
  for(const [label,team] of [['Designated home','De Leon'],['Designated away','Axtell']]){
   const designations=page.getByText(label,{exact:true});assert.ok(await designations.count()>0);
   for(const designation of await designations.all()) assert.ok((await designation.evaluate(el=>el.closest('a')?.textContent??'')).includes(team),label+' belongs to '+team);
  }
  const deLeonCenter=await page.locator('main').innerText();assert.ok(deLeonCenter.includes('November 19, 2026')&&deLeonCenter.includes('7:00 PM')&&deLeonCenter.includes('Cervetto Stadium, Dublin'));
  await page.screenshot({path:`${output}/${name}-de-leon-designated-home.png`});
  await page.goto(deLeonReturn);await page.waitForFunction(()=>!document.querySelector('fieldset[disabled]'));
  for(const division of ['2A-D1','2A-D2','3A-D1','3A-D2','4A-D1','4A-D2']){
   await page.getByRole('combobox',{name:'Bracket division',exact:true}).selectOption(division);if(!(await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).isVisible()))await page.getByText('View options',{exact:true}).click();await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).click();assert.equal(await bracket.locator('article').count(),63);
  }
  await search.fill('Panhandle');await page.getByRole('button',{name:/Panhandle · 2A Division I/}).first().click();
  await page.waitForURL(/school=2A-D1%7C0%7CPanhandle/);await page.reload();await page.waitForFunction(()=>!document.querySelector('fieldset[disabled]'));
  assert.ok(await page.getByRole('searchbox',{name:'Search bracket schools',exact:true}).isVisible());
  await search.fill('De Leon');await page.getByRole('button',{name:/De Leon · 2A Division I/}).first().click();await page.goBack();
  assert.ok(await page.getByRole('searchbox',{name:'Search bracket schools',exact:true}).isVisible());await page.goForward();
  assert.ok(await page.getByRole('searchbox',{name:'Search bracket schools',exact:true}).isVisible());
  await search.fill('Panhandle');await page.getByRole('button',{name:/Panhandle · 2A Division I/}).first().click();
  await myTeam.click();
  await page.locator('#team-path a[href="/games/2026-bi-district-2a-d1-i-1"]').click();await page.getByRole('heading',{name:'Floydada vs. Panhandle',exact:true}).waitFor();
  await page.locator('img[src="/logos/schools/panhandle.png"]:visible').first().evaluate(img=>img.decode());
  await page.screenshot({path:`${output}/${name}-game-center-logos.png`});
  assert.ok((await page.locator('main').innerText()).includes('62'));assert.ok((await page.locator('main').innerText()).includes('FINAL · VERIFIED'));
  await page.getByRole('link',{name:'View Panhandle Hub →',exact:true}).click();await page.getByRole('heading',{name:'Panhandle',exact:true}).waitFor();
  await page.locator('img[src="/logos/schools/panhandle.png"]:visible').first().evaluate(img=>img.decode());
  await page.screenshot({path:`${output}/${name}-hub-logo.png`});
  const record=page.getByText('2026 Record',{exact:true}).locator('..');assert.equal(await record.locator('p').first().innerText(),'—');
  await page.locator('a[href="/schools/panhandle/schedule"]').first().click();await page.locator('a[href="/games/2026-bi-district-2a-d1-i-1"]').first().waitFor();
  assert.equal(await page.getByText('Record',{exact:true}).locator('..').locator('p').last().innerText(),'—','schedule and hub withhold the same incomplete record');
  await page.goto(origin+'/playoffs?school='+encodeURIComponent('2A-D2|1|Stamford')+'#brackets');
  await page.waitForFunction(()=>!document.querySelector('fieldset[disabled]'));
  const d2=page.getByRole('region',{name:'Interactive Road to State bracket',exact:true});
  const d2canvas=page.getByLabel(canvasLabel,{exact:true});
  assert.equal(await page.getByRole('combobox',{name:'Bracket division',exact:true}).inputValue(),'2A-D2');
  assert.ok((await d2.innerText()).includes('W6'),'official DII seed labels render');
  assert.ok((await d2.innerText()).includes('Stamford'));
  await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).click();await checkContained(page,d2canvas);
  assert.equal(await d2.locator('article').count(),63);
  assert.equal(await d2.locator('article').filter({hasText:'Verified final'}).count(),32);
  for(const region of ['0','1','2','3']){
   await page.getByRole('combobox',{name:'Bracket region',exact:true}).selectOption(region);
   await page.getByRole('button',{name:'Reset View',exact:true}).click();await checkContained(page,d2canvas);
   assert.equal(await d2.locator('article').count(),15);
  }
  assert.ok((await d2.innerText()).includes('Winner pending'),'later rounds stay pending');
  assert.ok((await d2.innerText()).includes('La Villa') && (await d2.innerText()).includes('Chilton'),'Region IV Area participants are complete');
  await page.getByRole('combobox',{name:'Bracket region',exact:true}).selectOption('all');
  await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).click();await d2canvas.scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/${name}-d2-statewide.png`});
  await page.getByRole('button',{name:'Find Stamford',exact:true}).click();await d2canvas.scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/${name}-d2-stamford-path.png`});
  await page.goto(origin+'/games/2026-bi-district-2a-d2-iv-8');
  const chiltonFinal=await page.locator('main').innerText();
  assert.ok(chiltonFinal.includes('42') && chiltonFinal.includes('31') && chiltonFinal.includes('FINAL') && chiltonFinal.includes('Owner-confirmed final'));
  await page.screenshot({path:`${output}/${name}-chilton-owner-confirmed-final.png`});
  await page.goto(origin+'/games/2026-area-2a-d2-iv-4');
  const chiltonArea=await page.locator('main').innerText();
  assert.ok(chiltonArea.includes('Chilton') && chiltonArea.includes('La Villa') && chiltonArea.includes('November 20, 2026') && chiltonArea.includes('7:00 PM') && chiltonArea.includes('Bulldog Stadium, Somerset, TX'));
  await page.screenshot({path:`${output}/${name}-chilton-la-villa-area.png`});
  await page.goto(origin+'/games/2026-bi-district-2a-d2-i-1');
  const d2final=await page.locator('main').innerText();assert.ok(d2final.includes('FINAL · VERIFIED')&&d2final.includes('69')&&d2final.includes('14'));
  await page.goto(origin+'/games/2026-area-2a-d2-ii-2');
  const d2area=await page.locator('main').innerText();assert.ok(d2area.includes('Stamford')&&d2area.includes('Windthorst')&&d2area.includes('7:00 PM')&&d2area.includes('Breckenridge'));
  await page.goto(origin+'/playoffs?school='+encodeURIComponent('3A-D1|0|Clyde')+'#brackets');
  await page.waitForFunction(()=>!document.querySelector('fieldset[disabled]'));
  await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).click();
  assert.equal(await bracket.locator('article').count(),63);
  assert.equal(await bracket.locator('article').filter({hasText:'Verified final'}).count(),32);
  assert.ok((await bracket.innerText()).includes('W2'),'reviewed 3A seed labels render');
  await checkContained(page,canvas);
  for(const region of ['0','1','2','3']){
   await page.getByRole('combobox',{name:'Bracket region',exact:true}).selectOption(region);
   await page.getByRole('button',{name:'Reset View',exact:true}).click();
   assert.equal(await bracket.locator('article').count(),15);await checkContained(page,canvas);
  }
  await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).click();await canvas.scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/${name}-3ad1-statewide.png`});
  await page.getByRole('button',{name:'Find Clyde',exact:true}).click();await canvas.scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/${name}-3ad1-clyde-path.png`});
  for(const [id,words] of [
   ['2026-bi-district-3a-d1-i-3',['FINAL · VERIFIED','56','23','Clyde','Denver City']],
   ['2026-bi-district-3a-d1-i-8',['FINAL · VERIFIED','50','35']],
   ['2026-bi-district-3a-d1-iii-1',['FINAL · VERIFIED','42','7']],
   ['2026-area-3a-d1-i-3',['Wall','Sweetwater','6:00 PM','Colorado City']],
   ['2026-area-3a-d1-iii-2',['Orangefield','7:30 PM','Houston']],
   ['2026-area-3a-d1-iii-1',['Diboll','Lorena','7:30 PM','Madisonville']]
  ]){
   await page.goto(origin+'/games/'+id);const text=await page.locator('main').innerText();
   for(const word of words)assert.ok(text.includes(word),`${id} contains ${word}`);
  }
  await page.goto(origin+'/schools/clyde');
  await page.locator('a[href="/games/2026-bi-district-3a-d1-i-3"]').first().waitFor();
  assert.ok((await page.locator('main').innerText()).includes('56-23'),'undated verified playoff final appears in hub latest scores');
  await page.goto(origin+'/schools/clyde/schedule');
  await page.locator('a[href="/games/2026-bi-district-3a-d1-i-3"]').first().waitFor();
  await page.goto(origin+'/playoffs?school='+encodeURIComponent('3A-D2|0|Jacksboro')+'#brackets');
  await page.waitForFunction(()=>!document.querySelector('fieldset[disabled]'));
  await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).click();
  assert.equal(await bracket.locator('article').count(),63);
  assert.equal(await bracket.locator('article').filter({hasText:'Verified final'}).count(),32);
  await checkContained(page,canvas);
  for(const region of ['0','1','2','3']){
   await page.getByRole('combobox',{name:'Bracket region',exact:true}).selectOption(region);
   await page.getByRole('button',{name:'Reset View',exact:true}).click();
   assert.equal(await bracket.locator('article').count(),15);await checkContained(page,canvas);
  }
  await page.getByRole('button',{name:'Find Jacksboro',exact:true}).click();await canvas.scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/${name}-3ad2-jacksboro.png`});
  await page.goto(origin+'/games/2026-bi-district-3a-d2-ii-3');
  assert.ok((await page.locator('main').innerText()).includes('FINAL · VERIFIED'));
  await page.goto(origin+'/games/2026-area-3a-d2-i-2');
  assert.ok((await page.locator('main').innerText()).includes('6:00 PM'));
  await page.goto(origin+'/playoffs?school='+encodeURIComponent('4A-D1|2|Stephenville')+'#brackets');
  await page.waitForFunction(()=>!document.querySelector('fieldset[disabled]'));
  await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).click();
  assert.equal(await bracket.locator('article').count(),63);
  assert.equal(await bracket.locator('article').filter({hasText:'Verified final'}).count(),32);
  await checkContained(page,canvas);
  for(const region of ['0','1','2','3']){
   await page.getByRole('combobox',{name:'Bracket region',exact:true}).selectOption(region);
   await page.getByRole('button',{name:'Reset View',exact:true}).click();
   assert.equal(await bracket.locator('article').count(),15);await checkContained(page,canvas);
  }
  await page.getByRole('button',{name:'Find Stephenville',exact:true}).click();await canvas.scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/${name}-4ad1-stephenville.png`});
  await page.goto(origin+'/games/2026-bi-district-4a-d1-iii-8');
  assert.ok((await page.locator('main').innerText()).includes('FINAL · VERIFIED'));
  await page.locator('a[href="/schools/houston-sterling"]:visible').first().click();
  await page.locator('a[href="/games/2026-bi-district-4a-d1-iii-8"]').first().waitFor();
  await page.goto(origin+'/games/2026-area-4a-d1-iii-4');
  const stephArea=await page.locator('main').innerText();
  for(const word of ['Stephenville','Vidor','7:00 PM','Bryan'])assert.ok(stephArea.includes(word),word);
  await page.goto(origin+'/schools/stephenville');
  assert.ok((await page.locator('main').innerText()).includes('Vidor vs. Stephenville'),'unconfirmed Area sides remain a matchup, not a home game');
  await page.goto(origin+'/playoffs?school='+encodeURIComponent('4A-D1|2|Austin')+'#brackets');
  await page.getByRole('button',{name:'Find Austin',exact:true}).click();
  const selectedAustin=bracket.locator('article').filter({hasText:'Your team'});
  assert.equal(await selectedAustin.count(),1);
  assert.ok((await selectedAustin.innerText()).includes('F10'));
  assert.equal(await selectedAustin.locator('a[href="/schools/houston-austin"]').count(),1);
  await page.screenshot({path:`${output}/${name}-4ad1-houston-austin.png`});
  await page.goto(origin+'/playoffs?school='+encodeURIComponent('4A-D2|1|Glen Rose')+'#brackets');
  await page.waitForFunction(()=>!document.querySelector('fieldset[disabled]'));
  await page.getByRole('button',{name:'Fit Entire Bracket',exact:true}).click();
  assert.equal(await bracket.locator('article').count(),63);
  assert.equal(await bracket.locator('article').filter({hasText:'Verified final'}).count(),32);
  await checkContained(page,canvas);
  for(const region of ['0','1','2','3']){
   await page.getByRole('combobox',{name:'Bracket region',exact:true}).selectOption(region);
   await page.getByRole('button',{name:'Reset View',exact:true}).click();
   assert.equal(await bracket.locator('article').count(),15);await checkContained(page,canvas);
  }
  await page.getByRole('button',{name:'Find Glen Rose',exact:true}).click();await canvas.scrollIntoViewIfNeeded();
  await page.screenshot({path:`${output}/${name}-4ad2-glen-rose.png`});
  await page.goto(origin+'/games/2026-bi-district-4a-d2-iii-1');
  assert.ok((await page.locator('main').innerText()).includes('FINAL · VERIFIED'));
  await page.goto(origin+'/games/2026-area-4a-d2-ii-1');
  const glenArea=await page.locator('main').innerText();
  for(const word of ['Glen Rose','Carthage','7:00 PM','Forney'])assert.ok(glenArea.includes(word),word);
  await page.goto(origin+'/schools/glen-rose');
  assert.ok(await page.locator('a[href="/games/2026-area-4a-d2-ii-1"]').count()>0);
  await page.goto(origin+'/schools/millsap');
  assert.ok(await page.locator('a[href="/games/2026-area-3a-d2-ii-1"]').count()>0,'published scheduled Area game is the school hero next matchup');
  if(name==='desktop')await page.locator('a[href="/games/2026-area-3a-d2-ii-1"]:visible').first().waitFor();
  await page.screenshot({path:`${output}/${name}-millsap-area-next.png`});
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
 const supplied3adi=JSON.parse(readFileSync('docs/3a-d1-owner-logos-20261115/inventory.json','utf8'));
 for(const [device,options] of [['desktop',{viewport:{width:1280,height:900}}],['iphone',devices['iPhone 13']],['android',devices['Pixel 7']]]){
  const ctx=await browser.newContext(options);const p=await ctx.newPage();activePage=p;
  await p.goto(origin+'/playoffs#brackets');await p.getByRole('combobox',{name:'Bracket division',exact:true}).selectOption('3A-D1');
  await p.getByRole('button',{name:'Fit Entire Bracket',exact:true}).click();
  const b=p.getByRole('region',{name:'Interactive Road to State bracket',exact:true});
  assert.equal(await b.locator('article').count(),63);
  for(const row of supplied3adi){const img=b.locator(`img[src="/logos/schools/${row.slug}.png"]`).first();assert.ok(await img.count(),row.slug);await img.evaluate(el=>el.decode());}
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:`${output}/${device}-3a-d1-statewide.png`});
  for(const region of ['0','1','2','3']){
   await p.getByRole('combobox',{name:'Bracket region',exact:true}).selectOption(region);await p.getByRole('button',{name:'Fit selected region',exact:true}).click();assert.equal(await b.locator('article').count(),15);
   for(const img of await b.locator('img').all())await img.evaluate(el=>el.decode());
   await p.screenshot({path:`${output}/${device}-3a-d1-region-${region}.png`});
  }
  await ctx.close();results.push({device,classification:'3A Division I',surface:'owner statewide and four regions',pass:true});
 }
 for(const row of supplied3adi){await logoPage.goto(`${origin}/schools/${row.slug}`);await checkLogo(row.slug);results.push({school:row.slug,surface:'3a-d1 hub',pass:true});}
 const supplied3adiGames=getGames().filter(g=>g.playoff?.division==='3A Division I'&&['Bi-District','Area'].includes(g.playoff.round));
 for(const game of supplied3adiGames){await logoPage.goto(`${origin}/games/${game.id}`);for(const slug of [game.homeSchoolSlug,game.awaySchoolSlug].filter(slug=>supplied3adi.some(r=>r.slug===slug)))await checkLogo(slug);results.push({game:game.id,surface:'3a-d1 Game Center',pass:true});}
 await logoPage.setContent(`<body style="display:grid;grid-template-columns:repeat(6,1fr)">${supplied3adi.map(row=>`<div>${row.name}${['white','#202127'].map(bg=>`<div style="background:${bg};padding:12px"><img src="${origin}/logos/schools/${row.slug}.png" style="width:64px;height:64px;object-fit:contain;filter:${getSchoolLogoImageStyle(row.slug).filter??'none'}"></div>`).join('')}</div>`).join('')}</body>`);
 await logoPage.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));await logoPage.screenshot({path:`${output}/3a-d1-light-dark.png`,fullPage:true});

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

 const supplied=JSON.parse(readFileSync('docs/2a-d2-owner-logos-20261115/inventory.json','utf8'));
 for(const [device,options] of [['desktop',{viewport:{width:1280,height:900}}],['iphone',devices['iPhone 13']],['android',devices['Pixel 7']]]){
  const ctx=await browser.newContext(options);const p=await ctx.newPage();activePage=p;
  await p.goto(origin+'/playoffs#brackets');await p.getByRole('combobox',{name:'Bracket division',exact:true}).selectOption('2A-D2');
  await p.getByRole('button',{name:'Fit Entire Bracket',exact:true}).click();
  const b=p.getByRole('region',{name:'Interactive Road to State bracket',exact:true});
  assert.equal(await b.locator('article').count(),63);
  for(const row of supplied){const img=b.locator(`img[src="/logos/schools/${row.slug}.png"]`).first();assert.ok(await img.count(),row.slug);await img.evaluate(el=>el.decode());}
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:`${output}/${device}-2a-d2-statewide.png`});
  for(const region of ['0','1','2','3']){
   await p.getByRole('combobox',{name:'Bracket region',exact:true}).selectOption(region);await p.getByRole('button',{name:'Fit selected region',exact:true}).click();assert.equal(await b.locator('article').count(),15);
   for(const img of await b.locator('img').all())await img.evaluate(el=>el.decode());
   await p.screenshot({path:`${output}/${device}-2a-d2-region-${region}.png`});
  }
  await ctx.close();results.push({device,classification:'2A Division II',surface:'owner statewide and four regions',pass:true});
 }
 for(const row of supplied){await logoPage.goto(`${origin}/schools/${row.slug}`);await checkLogo(row.slug);results.push({school:row.slug,surface:'2a-d2 hub',pass:true});}
 const suppliedGames=getGames().filter(g=>g.playoff?.division==='2A Division II'&&['Bi-District','Area'].includes(g.playoff.round));
 for(const game of suppliedGames){await logoPage.goto(`${origin}/games/${game.id}`);for(const slug of [game.homeSchoolSlug,game.awaySchoolSlug].filter(slug=>supplied.some(r=>r.slug===slug)))await checkLogo(slug);results.push({game:game.id,surface:'2a-d2 Game Center',pass:true});}
 await logoPage.setContent(`<body style="display:grid;grid-template-columns:repeat(6,1fr)">${supplied.map(row=>`<div>${row.name}${['white','#202127'].map(bg=>`<div style="background:${bg};padding:12px"><img src="${origin}/logos/schools/${row.slug}.png" style="width:64px;height:64px;object-fit:contain;filter:${getSchoolLogoImageStyle(row.slug).filter??'none'}"></div>`).join('')}</div>`).join('')}</body>`);
 await logoPage.locator('img').evaluateAll(images=>Promise.all(images.map(img=>img.decode())));await logoPage.screenshot({path:`${output}/2a-d2-light-dark.png`,fullPage:true});

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
