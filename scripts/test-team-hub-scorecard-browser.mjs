// Actual scorecard and CSS; static game fixtures and a Next Link boundary. No remote writes.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const { chromium } = require('playwright');
const css = (await require('postcss')([require('@tailwindcss/postcss')({base:process.cwd()})]).process(await readFile('app/globals.css','utf8'),{from:process.cwd()+'/app/globals.css'})).css;
const fixture = `import React from 'react';import {createRoot} from 'react-dom/client';import Card from './components/SchoolGameNight';import {getSchoolBySlug} from './lib/schools';
const params=new URLSearchParams(location.search);const slug=params.get('slug')||'de-leon';const school=getSchoolBySlug(slug);
const base={id:'test-final',status:'final',gameType:'regular',homeSchoolSlug:slug,awaySchoolSlug:'hico',homeTeam:school.name,awayTeam:'Hico',homeScore:49,awayScore:7,kickoff:'2026-10-16T00:00:00Z',publicScoreVerified:true,scoreAttribution:{type:'verified'}};
const mode=params.get('mode')||'home';const changes={away:{homeSchoolSlug:'hico',awaySchoolSlug:slug,homeTeam:'Hico',awayTeam:school.name,homeScore:7,awayScore:49},loss:{homeScore:7,awayScore:49},tie:{homeScore:7,awayScore:7,resultType:'tie'},missing:{homeScore:undefined},unverified:{publicScoreVerified:false},long:{homeTeam:school.name+' Very Long School Name',awayTeam:'Canyon West Plains Long School Name'}};const game={...base,...changes[mode]};const history=[1,2,3,4,5,6].reverse().map(n=>({...base,id:'form-'+n,kickoff:'2026-09-0'+n+'T00:00:00Z',homeScore:n===3?7:n%2?7:49,awayScore:n===3?7:n%2?49:7}));
createRoot(document.getElementById('root')).render(<main className='mx-auto max-w-6xl p-4 text-white'><Card school={school} focus={{featured:game}} games={mode==='few'?[base]:mode==='empty'?[]:history}/></main>);`;
const bundle=await build({stdin:{contents:fixture,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'link-boundary',setup(b){b.onResolve({filter:/^next\/link$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},()=>({resolveDir:process.cwd(),loader:'tsx',contents:"import React from 'react';export default function Link({children,...p}){return <a {...p}>{children}</a>}"}));}}]});
const server=createServer((req,res)=>{res.setHeader('content-type',req.url==='/fixture.js'?'text/javascript':req.url==='/style.css'?'text/css':'text/html');res.end(req.url==='/fixture.js'?bundle.outputFiles[0].text:req.url==='/style.css'?css:'<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body style="background:black"><div id="root"></div><script src="/fixture.js"></script></body></html>')});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,executablePath:process.env.FEED_CHROMIUM_EXECUTABLE||'/tmp/chromium',args:['--no-sandbox','--no-zygote','--single-process','--disable-gpu','--disable-software-rasterizer']});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const origin='http://127.0.0.1:'+server.address().port;
 for(const width of [375,390,768,1280]){
  await page.setViewportSize({width,height:844});
  for(const slug of ['de-leon','cisco','goldthwaite','albany','stephenville','hico','hamilton']) {
   const pilot=!['hico','hamilton'].includes(slug);
   for(const mode of (pilot?['home','away','loss','tie','missing','unverified','few','empty','long']:['home'])){
    await page.goto(origin+'?slug='+slug+'&mode='+mode);await page.locator('section').waitFor();assert.ok(await page.locator('body').evaluate(e=>e.scrollWidth<=innerWidth));
    if(!pilot||['missing','unverified'].includes(mode))assert.equal(await page.locator('dl').count(),0);else{
     const rows=page.locator('dl > div');assert.equal(await rows.count(),2);assert.match(await rows.nth(0).locator('dt').textContent(),/Away/);assert.match(await rows.nth(1).locator('dt').textContent(),/Home/);
     if(mode==='home'){assert.match(await rows.nth(0).textContent(),/Hico.*7/);assert.match(await rows.nth(1).textContent(),/49/);assert.match(await rows.nth(1).textContent(),/Winner/);}
     if(mode==='away'){assert.match(await rows.nth(0).textContent(),/49/);assert.match(await rows.nth(0).textContent(),/Winner/);}
     if(mode==='loss')assert.match(await rows.nth(0).textContent(),/Winner/);
     if(mode==='tie')assert.equal(await page.getByText('Winner',{exact:true}).count(),0);
    }
    if(!pilot){assert.equal(await page.locator('ol').count(),0);await page.getByText('Verified by VarsityVue',{exact:true}).waitFor();}else{
     assert.equal(await page.getByText('Verified by VarsityVue',{exact:true}).count(),0);
     const items=page.locator('ol li');assert.equal(await items.count(),mode==='few'?1:mode==='empty'?0:5);
     if(!['few','empty'].includes(mode)){assert.deepEqual(await items.locator('span').allTextContents(),['W','T','W','L','W']);for(const item of await items.all())assert.match(await item.getAttribute('aria-label'),/^(Win|Loss|Tie) against Hico, \d+ to \d+,/);}
    }
    const link=page.getByRole('link',{name:'Game Center →',exact:true});await link.focus();assert.ok(await link.evaluate(e=>e===document.activeElement));assert.equal(await link.getAttribute('href'),'/games/test-final');
    if(width===390&&mode==='home'&&slug==='de-leon')await page.screenshot({path:'/tmp/scorecard-after-390.png',fullPage:true});
   }
  }
  console.log('PASS',width,'all five pilots: home/away wins, loss, tie, missing/unverified scores, fewer/empty history, labels, ordering, long names, keyboard link; Hico/Hamilton unchanged; no overflow');
 }
 assert.deepEqual(errors,[]);
}finally{await browser?.close();await new Promise(r=>server.close(r));}
