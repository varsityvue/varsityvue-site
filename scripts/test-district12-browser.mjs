import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.DISTRICT12_PLAYWRIGHT_MODULE || 'playwright');
const evidence=process.env.DISTRICT12_EVIDENCE || 'district12-browser-evidence';fs.mkdirSync(evidence,{recursive:true});
const expected={burnet:[1,6,1,1,150,270],jarrell:[7,0,2,0,298,111],stephenville:[7,0,2,0,287,127],'china-spring':[1,6,0,2,217,254],lampasas:[2,5,0,2,176,215],'marble-falls':[3,4,1,1,184,194]};
const position={stephenville:'T-1',jarrell:'T-1','marble-falls':'T-3',burnet:'T-3',lampasas:'T-5','china-spring':'T-5'};
// Independent six-team results; scores are team-centric and immutable fixture evidence.
const history={
 stephenville:[['midlothian-heritage-at-stephenville',44,21],['stephenville-at-brownwood',28,24],['lubbock-cooper-at-stephenville',48,7],['stephenville-at-abilene-wylie',42,23],['stephenville-vs-canyon-west-plains',35,17],['lampasas-at-stephenville',35,14]],
 burnet:[['burnet-at-llano',31,38],['taylor-at-burnet',30,49],['lago-vista-at-burnet',26,48],['burnet-at-blanco',7,28],['gatesville-at-burnet',7,42],['burnet-at-china-spring',33,31]],
 'china-spring':[['china-spring-at-waco-connally',45,12],['china-spring-at-waco-university',23,29],['gatesville-at-china-spring',37,41],['china-spring-at-glen-rose',39,42],['brownwood-at-china-spring',21,42],['burnet-at-china-spring',31,33]],
 jarrell:[['austin-navarro-at-jarrell',57,0],['midland-christian-at-jarrell',36,31],['austin-at-jarrell',32,13],['austin-eastside-memorial-at-jarrell',49,6],['jarrell-at-madisonville',34,31],['marble-falls-at-jarrell',49,7]],
 'marble-falls':[['lockhart-at-marble-falls',29,45],['little-river-academy-at-marble-falls',39,36],['marble-falls-at-fredericksburg',3,14],['austin-lasa-at-marble-falls',55,0],['marble-falls-at-geronimo-navarro',17,34],['marble-falls-at-jarrell',7,49]],
 lampasas:[['lampasas-at-gatesville',21,0],['pflugerville-connally-at-lampasas',32,33],['lampasas-at-central-catholic',30,28],['wimberley-at-lampasas',14,35],['lago-vista-at-lampasas',42,43],['lampasas-at-stephenville',14,35]],
};
const currentFinals={stephenville:['china-spring-at-stephenville',55,21],jarrell:['jarrell-at-lampasas',41,23],burnet:['burnet-at-marble-falls',16,34],'china-spring':['china-spring-at-stephenville',21,55],lampasas:['jarrell-at-lampasas',23,41],'marble-falls':['burnet-at-marble-falls',34,16]};
for(const [slug,row] of Object.entries(currentFinals))history[slug].push(row);
const states=[
 {game_id:'china-spring-at-stephenville-2026-week-8',status:'final',home_score:55,away_score:21,verified:true,result_type:'played',attribution_type:'verified'},
 {game_id:'stephenville-at-abilene-wylie-2026-week-4',status:'final',home_score:23,away_score:42,verified:true,result_type:'played',attribution_type:'none'},
 {game_id:'stephenville-vs-canyon-west-plains-2026-week-5',status:'final',home_score:35,away_score:17,verified:true,result_type:'played',attribution_type:'none'},
 {game_id:'lampasas-at-stephenville-2026-week-7',status:'final',home_score:35,away_score:14,verified:true,result_type:'played',attribution_type:'verified'},
];
let api,app,browser;const results=[];let base=process.env.DISTRICT12_BASE_URL;
if(base){const u=new URL(base);assert.equal(u.protocol,'https:');assert.ok(u.hostname==='varsityvue.com'||u.hostname==='www.varsityvue.com'||u.hostname.endsWith('.vercel.app'));}
try{
 if(!base){
  api=http.createServer((req,res)=>{res.setHeader('content-type','application/json');if(!['GET','HEAD'].includes(req.method)&&req.url!=='/rest/v1/rpc/public_score_states'){res.writeHead(405);res.end('{}');return;}res.end(JSON.stringify(req.url.startsWith('/rest/v1/rpc/public_score_states')?states:[]));});
  await new Promise(r=>api.listen(54329,'127.0.0.1',r));
  const fd=fs.openSync(evidence+'/app.log','w');
  app=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3020'],{detached:true,env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:54329',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'isolated-public',NEXT_TELEMETRY_DISABLED:'1'},stdio:['ignore',fd,fd]});base='http://127.0.0.1:3020';
  for(let i=0;i<60;i++){try{if((await fetch(base+'/districts/4a-d1-district-12')).ok)break;}catch{}assert.notEqual(i,59);await new Promise(r=>setTimeout(r,500));}
 }
 browser=await chromium.launch({...(process.env.DISTRICT12_CHROMIUM_PATH?{executablePath:process.env.DISTRICT12_CHROMIUM_PATH}:{}),args:['--no-sandbox']});
 for(const width of [1280,390]){
  const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await context.route('**/*',route=>['GET','HEAD'].includes(route.request().method())?route.continue():route.abort());
  let response=await page.goto(base+'/districts/4a-d1-district-12');assert.equal(response.status(),200);
  await page.getByRole('heading',{name:'Standings',exact:true}).waitFor();
  const section=page.locator('section').filter({has:page.getByRole('heading',{name:'Standings',exact:true})});
  if(width===1280){const rows=section.locator('tbody tr');assert.equal(await rows.count(),6);for(const slug of Object.keys(expected)){const row=rows.filter({has:page.locator(`a[href="/schools/${slug}"]`)});assert.equal(await row.count(),1);const cells=await row.locator('td').allTextContents();const [w,l,dw,dl,pf,pa]=expected[slug];assert.equal(cells[0].trim(),position[slug]);assert.equal(cells[2].trim(),`${dw}-${dl}`);assert.equal(cells[3].trim(),`${w}-${l}`);assert.equal(cells[4].trim(),String(pf));assert.equal(cells[5].trim(),String(pa));}}
  else{for(const slug of Object.keys(expected)){const mobile=section.locator('div[class~="md:hidden"]');assert.equal(await mobile.isVisible(),true);const link=mobile.locator(`a[href="/schools/${slug}"]`);assert.equal(await link.count(),1);const text=await link.innerText();const [w,l,dw,dl]=expected[slug];assert.ok(text.includes(`${w}-${l}`));assert.ok(text.includes(`${dw}-${dl}`));assert.ok(text.includes(position[slug]));}}
  await page.screenshot({path:`${evidence}/district-${width}.png`,fullPage:true});
  results.push(`PASS ${width}px district: six exact records, points totals where displayed, tied positions`);
  for(const [slug,rows] of Object.entries(history)){
   response=await page.goto(base+`/schools/${slug}/schedule`);assert.equal(response.status(),200);await page.getByRole('heading',{name:new RegExp('Schedule$')}).waitFor();
   for(let i=0;i<rows.length;i++){const [id,pf,pa]=rows[i];const week=[1,2,3,4,5,7,8][i];const link=page.locator(`a[href="/games/${id}-2026-week-${week}"]`);assert.equal(await link.count(),1);const card=link.locator('xpath=ancestor::div[contains(@class,"group")][1]');const text=await card.innerText();assert.ok(text.includes(`${pf}-${pa}`),`${slug} ${id} ${text}`);assert.match(text,/\bfinal\b/i);assert.equal(await card.getByRole('link',{name:/Report.*Score/}).count(),0);if(slug==='jarrell'&&week===3)assert.match(text,/\baway\b/i);if(slug==='stephenville'&&week===5)assert.match(text,/neutral site/i);}
   const futureIds=await page.locator('a[href^="/games/"]').evaluateAll(links=>links.map(a=>new URL(a.href).pathname).filter(h=>/-2026-week-(9|10|11)$/.test(h)));
   assert.equal(futureIds.length,3,slug+' remaining schedule');assert.equal(new Set(futureIds).size,3);
   await page.screenshot({path:`${evidence}/${slug}-schedule-${width}.png`,fullPage:true});results.push(`PASS ${width}px ${slug}: seven historical results, unique original routes and final-report controls closed`);
  }
  for(const [week,total] of [[7,19],[8,19],[9,19]]){
   response=await page.goto(base+`/games?season=2026&week=${week}&mode=all&filter=all`);assert.equal(response.status(),200);
   const hrefs=await page.locator('a.weekly-row-link').evaluateAll(links=>links.map(a=>new URL(a.href).pathname));
   const matchups=hrefs.filter(h=>h.endsWith(`-2026-week-${week}`));assert.equal(matchups.length,total);assert.equal(new Set(matchups).size,total);
   response=await page.goto(base+`/games?season=2026&week=${week}&mode=nearby&filter=all`);assert.equal(response.status(),200);
   await page.getByLabel('Or choose a school',{exact:false}).waitFor();
   await page.getByLabel('Or choose a school',{exact:false}).selectOption('china-spring');
   await page.getByText('Near China Spring · nearest first',{exact:true}).waitFor();assert.equal(await page.getByText('Near Me is unavailable for',{exact:false}).count(),0);
   results.push(`PASS ${width}px Week ${week} Nearby: exact ${total} unique matchups and available verified-location controls`);
  }
  assert.deepEqual(errors,[]);await context.close();
 }
 fs.writeFileSync(evidence+'/results.json',JSON.stringify({base,results},null,2));console.log(results.join('\n'));
}finally{await browser?.close();if(app?.pid){try{process.kill(-app.pid,'SIGTERM');}catch{}}api?.closeAllConnections();await new Promise(r=>api?api.close(r):r());}
