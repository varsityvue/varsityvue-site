// Actual components/CSS; isolated media, pagination and follow-action boundaries. No remote writes.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const { chromium } = require('playwright');
const postcss = require('postcss');
const tailwind = require('@tailwindcss/postcss');
const css = (await postcss([tailwind({ base: process.cwd() })]).process(await readFile('app/globals.css', 'utf8'), { from: process.cwd() + '/app/globals.css' })).css;
const fixture = `
import React from 'react';import {createRoot} from 'react-dom/client';
import List from './components/TeamFeedList';import Hero from './components/SchoolHero';import Card from './components/TeamFeedCard';
import {getSchoolBySlug} from './lib/schools';import {getGameById} from './lib/games';
const school=getSchoolBySlug('de-leon');const long={...school,name:'Canyon West Plains Long School Name',mascot:'Wolves'};
const base={id:'portrait',primary_school_id:school.id,secondary_school_id:getSchoolBySlug('hico').id,game_id:'hico-at-de-leon-2026-week-8',source_type:'varsityvue',status:'published',caption:'Bearcats football. Photo: Cleared fixture credit',published_at:'2026-10-18T07:02:00Z'};
const post=(id,w,h,caption)=>({...base,id,caption:caption??base.caption,team_feed_media:[{id,public_path:id,alt_text:id+' test graphic',width:w,height:h}]});
const posts=[post('portrait',1080,1350),post('square',1080,1080,'A'.repeat(2000)),post('landscape',1600,900,'Short update without photographer credit.')];
window.morePost=post('more',1080,1080);window.render=(mode='feed')=>createRoot(document.getElementById('root')).render(mode==='hero'?<Hero school={school} games={[]} isAuthenticated={true} isFollowing={false} enhanced/>:mode==='long'?<Hero school={long} games={[]} isAuthenticated={false} isFollowing={false} enhanced/>:mode==='ordinary'?<><Hero school={getSchoolBySlug('hico')} games={[]} isAuthenticated={false} isFollowing={false}/><Card post={posts[0]}/></>:<main className='mx-auto max-w-3xl px-4 py-8 text-white'><h1>De Leon Bearcats Team Feed</h1><List initial={mode==='empty'?[]:posts} hasMore={mode!=='empty'} slug='de-leon'/></main>);
window.render(new URLSearchParams(location.search).get('mode')||'feed');
`;
const bundle = await build({ stdin: { contents: fixture, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, platform: 'browser', jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'boundaries', setup(b) {
 b.onResolve({filter:/^next\/(link|image)$|^@vercel\/analytics$|^@\/app\/schools\/\[slug\]\/follow-actions$|^@\/lib\/supabase\/config$/},a=>({path:a.path,namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},a=>({resolveDir:process.cwd(),loader:'tsx',contents:a.path==='next/link'?"import React from 'react';export default function Link({children,...p}){return <a {...p}>{children}</a>}":a.path==='next/image'?"import React from 'react';export default function Image({fill,priority,...p}){return <img {...p}/>}":a.path==='@vercel/analytics'?"export function track(){}":a.path==='@/lib/supabase/config'?"export function getSupabaseConfig(){return {url:location.origin}}":"export async function beginSignedOutSchoolFollow(){window.followCalls++};export async function manageSchoolFollow(slug,surface,id,state,data){window.followCalls++;return {following:data.get('operation')==='follow',status:'success',message:'Fixture follow saved'}}"}));
 }}] });
const server = createServer(async(req,res)=>{
 if(req.url.startsWith('/storage/')) { const id=req.url.split('/').at(-1);const [w,h]=id==='portrait'?[1080,1350]:id==='landscape'?[1600,900]:[1080,1080];res.setHeader('content-type','image/svg+xml');res.end(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#6a1120"/><rect x="8" y="8" width="${w-16}" height="${h-16}" fill="none" stroke="white" stroke-width="12"/><text x="50%" y="50%" fill="white" text-anchor="middle" font-size="60">${id} · TEST GRAPHIC</text></svg>`);return; }
 res.setHeader('content-type',req.url==='/fixture.js'?'text/javascript':req.url==='/style.css'?'text/css':'text/html');res.end(req.url==='/fixture.js'?bundle.outputFiles[0].text:req.url==='/style.css'?css:'<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><body style="background:#080808"><div id="root"></div><script src="/fixture.js"></script></body></html>');
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;let browser;
try {
 browser=await chromium.launch({headless:true,executablePath:process.env.FEED_CHROMIUM_EXECUTABLE || '/tmp/chromium',args:['--no-sandbox','--no-zygote','--single-process','--disable-gpu','--disable-software-rasterizer']});
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.followCalls=0;window.shares=[];window.copies=[];Object.defineProperty(navigator,'share',{configurable:true,value:async x=>window.shares.push(x)});Object.defineProperty(navigator,'clipboard',{value:{writeText:async x=>window.copies.push(x)},configurable:true});});
 await page.route('**/feed/more?**',async route=>route.fulfill({json:{posts:[await page.evaluate(()=>window.morePost)],hasMore:false}}));
 for(const width of [375,390,768,1280]) {
  await page.setViewportSize({width,height:900});await page.goto(origin);await page.locator('article').first().waitFor();
  for(const img of await page.locator('article img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.decode());const d=await img.evaluate(i=>({r:i.clientWidth/i.clientHeight,n:i.naturalWidth/i.naturalHeight,fit:getComputedStyle(i).objectFit}));assert.ok(Math.abs(d.r-d.n)<0.01);assert.equal(d.fit,'contain');}
  assert.equal(await page.locator('time').count(),3);assert.equal(await page.locator('article').first().getByRole('link',{name:/Game Center/}).getAttribute('href'),'/games/hico-at-de-leon-2026-week-8');assert.ok(await page.locator('body').evaluate(e=>e.scrollWidth<=innerWidth));
  assert.equal(await page.locator('article').nth(1).locator('p').filter({hasText:'A'.repeat(100)}).textContent(),'A'.repeat(2000));
  assert.ok(await page.locator('article').nth(2).textContent().then(t=>!t.includes('Photo:')));
  await page.getByRole('button',{name:'Load more'}).click();await page.waitForFunction(()=>document.querySelectorAll('article').length===4);
  await page.goto(origin+'?mode=empty');await page.getByText('Team Feed is just getting started.').waitFor();
  for(const mode of ['hero','long','ordinary']) {await page.goto(origin+'?mode='+mode);await page.getByRole('button',{name:/Follow /}).first().waitFor();assert.ok(await page.locator('body').evaluate(e=>e.scrollWidth<=innerWidth));}
  console.log('PASS',width,'graphics, long caption, empty, populated, long name, ordinary school, no overflow');
 }
 await page.goto(origin+'?mode=hero');await page.getByRole('button',{name:'Follow De Leon',exact:true}).focus();await page.keyboard.press('Enter');await page.getByRole('button',{name:'Unfollow De Leon'}).waitFor();assert.equal(await page.evaluate(()=>window.followCalls),1);await page.getByRole('button',{name:'Unfollow De Leon'}).click();await page.getByRole('button',{name:'Follow De Leon',exact:true}).waitFor();assert.equal(await page.evaluate(()=>window.followCalls),2);
 await page.goto(origin);const share=page.getByRole('button',{name:/Share De Leon Team Feed/}).first();await share.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>window.shares.length===1);assert.equal(await page.evaluate(()=>window.shares[0].url),'https://varsityvue.com/schools/de-leon/feed');
 await page.evaluate(()=>Object.defineProperty(navigator,'share',{value:undefined,configurable:true}));await share.click();await page.waitForFunction(()=>window.copies.length===1);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/de-leon-feed-after.png',fullPage:true});assert.deepEqual(errors,[]);console.log('PASS keyboard follow/unfollow, native share, clipboard fallback; no browser errors. Follow persistence is fixture-only.');
} finally {await browser?.close();await new Promise(r=>server.close(r));}
