// Run against an isolated local app. Requires Playwright; optional EVIDENCE_DIR captures screenshots.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true, executablePath:process.env.CHROMIUM_EXECUTABLE_PATH, args:["--no-sandbox", "--disable-dev-shm-usage"]});
 try {
 for(const width of [390,1440]) {
  const page=await browser.newPage({viewport:{width,height:900}});
  await page.route('**/*',r=>new URL(r.request().url()).origin===new URL(process.env.BASE_URL || 'http://127.0.0.1:3100').origin?r.continue():r.abort());
  for(const [game,slug] of [
   ['hico-at-de-leon-2026-week-8','hico-at-de-leon-week-8-2026'],
   ['albany-at-stamford-2026-week-7','albany-stamford-century-old-rivalry-week-7-2026'],
   ['de-leon-at-stamford-2026-week-2',null]
  ]) {
   const response=await page.goto((process.env.BASE_URL || 'http://127.0.0.1:3100')+'/games/'+game,{waitUntil:'networkidle'});
   assert.equal(response.status(),200);
   const link=page.getByRole('link',{name:'Read Game Preview →',exact:true});
   if(slug) {
    await assert.doesNotReject(()=>link.waitFor({state:'visible'}));
    assert.equal(await link.getAttribute('href'),'/coverage/'+slug);
    await link.scrollIntoViewIfNeeded();
    if (process.env.EVIDENCE_DIR) await page.screenshot({path:`${process.env.EVIDENCE_DIR}/${game}-${width}.png`});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await link.click(); await page.waitForURL('**/coverage/'+slug);
    await page.getByRole('heading',{level:1}).waitFor();
    assert.equal((await page.request.get(page.url())).status(),200);
   } else assert.equal(await link.count(),0);
   console.log(JSON.stringify({width,game,slug,status:'PASS'}));
  }
  await page.close();
 }
 } finally {await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
