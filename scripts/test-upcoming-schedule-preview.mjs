// Render the actual async component with canonical games and isolated read/Link boundaries.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const require=createRequire(import.meta.url);
const {build}=require('esbuild');
const {renderToStaticMarkup}=require('react-dom/server');
const {chromium}=require('playwright');
const bundle=await build({stdin:{contents:`export {default} from './components/UpcomingSchedulePreview';export {getGames} from './lib/games';export {getSchoolBySlug} from './lib/schools';`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'node',format:'cjs',jsx:'automatic',external:['react','react-dom'],plugins:[{name:'boundaries',setup(b){b.onResolve({filter:/^@\/lib\/dynamic-games$|^next\/link$/},a=>({path:a.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},a=>({resolveDir:process.cwd(),loader:'tsx',contents:a.path==='next/link'?"import React from 'react';export default function Link({children,...p}){return <a {...p}>{children}</a>}":"export async function getDynamicGamesForSchool(){return globalThis.fixtureGames}"}));}}]});
const compiledModule={exports:{}};new Function('module','exports','require',bundle.outputFiles[0].text)(compiledModule,compiledModule.exports,require);
const {default:Preview,getGames,getSchoolBySlug}=compiledModule.exports;
const RealDate=Date;globalThis.Date=class extends RealDate{constructor(...args){super(...(args.length?args:['2026-10-19T12:00:00Z']));}};
const documents={};
try{
 for(const slug of ['de-leon','cisco','goldthwaite','albany','stephenville','hico','hamilton']){
  const school=getSchoolBySlug(slug);const all=getGames().filter(g=>g.homeSchoolSlug===slug||g.awaySchoolSlug===slug);globalThis.fixtureGames=[...all].reverse();
  const element=await Preview({schoolSlug:slug,theme:school.colors});const html=renderToStaticMarkup(element);documents[slug]=html;
  if(slug==='de-leon'){
   const ids=['de-leon-at-anson-2026-week-9','abilene-tlca-at-de-leon-2026-week-10','de-leon-at-cisco-2026-week-11'];
   assert.deepEqual([...html.matchAll(/href="\/games\/([^"]+)"/g)].map(x=>x[1]),ids);
   assert.ok(html.indexOf('Anson')<html.indexOf('Abilene TLCA'));assert.ok(html.indexOf('Abilene TLCA')<html.indexOf('Cisco'));
   for(const value of ['23','30','6','7:00 PM','Tiger Stadium','Bearcat Stadium','Chesley Field','Week 9 · Away','Week 10 · Home','Week 11 · Away'])assert.ok(html.includes(value),value);
   globalThis.fixtureGames=all.filter(g=>g.id===ids[0]);assert.ok(renderToStaticMarkup(await Preview({schoolSlug:slug,theme:school.colors})).includes('Anson'));
   globalThis.fixtureGames=[];assert.equal(await Preview({schoolSlug:slug,theme:school.colors}),null);
  }else{
   const upcoming=all.filter(g=>g.status==='upcoming'&&g.gameType!=='bye'&&(!g.kickoff||g.kickoff.slice(0,10)>='2026-10-19')).sort((a,b)=>(a.kickoff??'').localeCompare(b.kickoff??''));
   assert.deepEqual([...html.matchAll(/href="\/games\/([^"]+)"/g)].map(x=>x[1]),(['cisco','goldthwaite','albany','stephenville'].includes(slug)?upcoming.slice(0,3):upcoming.slice(1,4)).map(g=>g.id));
  }
  const firstUpcoming=all.find(g=>g.status==='upcoming'&&g.kickoff?.slice(0,10)>='2026-10-19');globalThis.fixtureGames=all.map(g=>g.id===firstUpcoming?.id?{...g,status:'live'}:g);
  const liveHtml=renderToStaticMarkup(await Preview({schoolSlug:slug,theme:school.colors}));assert.ok(liveHtml.includes('Next on the schedule'));
 }
}finally{globalThis.Date=RealDate;delete globalThis.fixtureGames;}
console.log('PASS actual async schedule renders: canonical order/links/dates/times/venues/home-away, one/zero games, live state, unchanged Hico/Cisco selection');
const css=(await require('postcss')([require('@tailwindcss/postcss')({base:process.cwd()})]).process(await readFile('app/globals.css','utf8'),{from:process.cwd()+'/app/globals.css'})).css;
const server=createServer((req,res)=>{res.setHeader('content-type','text/html');const slug=req.url.slice(1)||'de-leon';res.end(`<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style><body style="background:black"><main class="mx-auto max-w-6xl p-4">${documents[slug]||''}</main></body></html>`)});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{browser=await chromium.launch({headless:true,executablePath:process.env.FEED_CHROMIUM_EXECUTABLE||'/tmp/chromium',args:['--no-sandbox','--no-zygote','--single-process','--disable-gpu','--disable-software-rasterizer']});const page=await browser.newPage();for(const width of [375,390,768,1280]){await page.setViewportSize({width,height:844});for(const slug of ['de-leon','cisco','goldthwaite','albany','stephenville','hico','hamilton']){await page.goto('http://127.0.0.1:'+server.address().port+'/'+slug);assert.ok(await page.locator('body').evaluate(e=>e.scrollWidth<=innerWidth));const links=page.locator('a[href^="/games/"]');for(const link of await links.all()){await link.focus();assert.ok(await link.evaluate(e=>e===document.activeElement));}if(slug==='de-leon')assert.deepEqual(await page.locator('h3').allTextContents(),['Anson','Abilene TLCA','Cisco']);}console.log('PASS',width,'schedule rows, no overflow and keyboard links; De Leon/Hico/Cisco');}}finally{await browser?.close();await new Promise(r=>server.close(r));}
