import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {chromium,devices} from 'playwright';

// Entirely isolated acceptance: no production database or account writes.
const output='playoff-bracket-browser-evidence';mkdirSync(output,{recursive:true});
const baseline=JSON.parse(readFileSync('tests/fixtures/2adi-published-finals-20261114.json','utf8'));
const calls=[];const states=baseline.map(row=>({...row,period:null,clock:null,kickoff_override:null,result_type:null,official_winner_school_slug:null,attribution_type:'verified'}));
const fixture=createServer((req,res)=>{
 calls.push({method:req.method,path:req.url});
 res.setHeader('content-type','application/json');res.setHeader('access-control-allow-origin','*');
 res.end(JSON.stringify(req.url?.includes('/rpc/public_score_states')?states:[]));
});
await new Promise(resolve=>fixture.listen(54329,'127.0.0.1',resolve));
const app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3107'],{env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54329',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'isolated-public'},stdio:['ignore','pipe','pipe']});
let serverLog='';for(const stream of [app.stdout,app.stderr])stream.on('data',data=>{serverLog+=data.toString();});
let browser;const results=[];const origin='http://127.0.0.1:3107';
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
  const page=await context.newPage();
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
  const fitted=await scale(canvas);await page.getByRole('button',{name:'Zoom in',exact:true}).click();assert.ok(await scale(canvas)>fitted);
  await page.getByRole('button',{name:'Reset view',exact:true}).click();assert.ok(Math.abs(await scale(canvas)-fitted)<.001);
  await page.getByRole('combobox',{name:'Bracket region',exact:true}).selectOption('1');
  await page.getByRole('button',{name:'Fit selected region',exact:true}).click();assert.equal(await bracket.locator('article').count(),15);await checkContained(page,canvas);
  await canvas.scrollIntoViewIfNeeded();let box=await canvas.boundingBox();assert.ok(box);
  const beforeDrag=await canvas.locator(':scope > div').getAttribute('style');
  await page.mouse.move(box.x+box.width-20,box.y+box.height-20);await page.mouse.down();await page.mouse.move(box.x+box.width-65,box.y+box.height-45,{steps:5});await page.mouse.up();
  assert.notEqual(await canvas.locator(':scope > div').getAttribute('style'),beforeDrag);
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
  await page.goto(origin+'/admin/playoff-publishing/bracket-templates');await page.getByRole('heading',{name:'Welcome back.',exact:true}).waitFor();
  assert.equal(await page.getByRole('heading',{name:'Bracket template review',exact:true}).count(),0);
  results.push({device:name,viewport:options.viewport,pass:true,pinch:options.hasTouch?'emulated native touch passed':'not applicable'});await context.close();
 }
 assert.ok(calls.every(c=>c.method==='GET'||c.method==='HEAD'||c.method==='OPTIONS'||(c.method==='POST'&&c.path?.includes('/rpc/public_score_states'))),'only read requests reach fixture');
 writeFileSync(`${output}/results.json`,JSON.stringify({results,fixtureOnly:true},null,2));
 console.log(JSON.stringify(results,null,2));
}catch(error){writeFileSync(`${output}/failure.txt`,String(error.stack??error));throw error;}
finally{writeFileSync(`${output}/server.log`,serverLog);await browser?.close();app.kill('SIGTERM');await new Promise(resolve=>fixture.close(resolve));}
