// Actual production components and CSS. Network/server boundaries are isolated fixtures.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { build } = require('esbuild');
const { chromium } = require('playwright');
const postcss = require('postcss');
const tailwind = require('@tailwindcss/postcss');
const baselineRef=process.env.PICKEM_BASE_REF || '88f58a712f8657cacc7021d26768eee3d375da72';
if(process.env.PICKEM_SCREENSHOT_DIR)await mkdir(process.env.PICKEM_SCREENSHOT_DIR,{recursive:true});
const css = (await postcss([tailwind({base:process.cwd()})]).process(process.argv.includes('--baseline') ? execFileSync('git',['show',baselineRef+':app/globals.css'],{encoding:'utf8'})+'\n@source inline("bottom-[calc(env(safe-area-inset-bottom)+0.75rem)]");' : await readFile('app/globals.css','utf8'), {from:process.cwd()+'/app/globals.css'})).css;
const fixture = `
import React from 'react'; import {createRoot} from 'react-dom/client';
import Form from './components/PickemSlateForm'; import Guest from './components/PickemGuestSlate';
import MobileNavigation from './components/MobileNavigation';
import LocalNavigation from './components/PickemLocalNavigation';
import EntryStatus from './components/PickemEntryStatus';
import {orderPickemSlateRows} from './lib/pickem-display-order';
import {PickemHistory,PickemStandings,PickemMemberOverview} from './components/PickemOptionalSections';
const state=new URLSearchParams(location.search).get('state')||'draft';
window.writes=0;window.reconciliations=0;window.refreshes=0;
const locked=['locked','graded','finalized','closed-draft','sections-error'].includes(state);
const entered=['valid','locked','graded','finalized','disqualified'].includes(state);
window.fixtureHistory={memberPickRows:[{pickem_game_id:'g0',picked_school_slug:'away',is_correct:true}],rawMemberTotal:{correct_picks:8,incorrect_picks:2,graded_picks:10,season_rank:42},memberGameRows:[{id:'g0',game_id:'game0',week_id:'fixture'}],memberWeekRows:[{id:'fixture',season:2026,week:9,title:'Week 9',status:'graded'}],memberWeekGameRows:[{id:'g0',week_id:'fixture',result_winner_school_slug:'away',graded_at:'2026-10-18'}]};
window.fixtureStandings={leaderboardRows:[{ordinal:1,rank:1,display_name:'Fixture fan',graded_picks:10,correct_picks:8,accuracy_pct:80}],weeklyStandings:locked?[{ordinal:1,weekly_rank:1,display_name:'Fixture fan',graded_picks:10,correct_picks:8,distance:2}]:[]};
window.failSections=state==='sections-error';
const games=orderPickemSlateRows(Array.from({length:10},(_,i)=>({id:'g'+i,gameId:'game'+i,isTiebreaker:i===8,awaySlug:'away',homeSlug:'home',awayName:i===8?'Stephenville':'Canyon West Plains',homeName:i===8?'Jarrell':'Stephenville',awayMark:'CWP',homeMark:'STV',awayColor:'#800000',homeColor:'#0055aa',kickoffLabel:'Fri 7:00 PM',locked,selectedSlug:state==='draft'?undefined:'away',savedSlug:['draft','error'].includes(state)?undefined:'away'})), 'g8');
const action=async()=>{window.writes++;await new Promise(r=>setTimeout(r,30));return state==='error'?{status:'unknown',message:'Interrupted'}:{status:'success',message:'Fixture save accepted'};};
const week={id:'fixture',season:2026,week:9,title:'Week 9',status:['graded','finalized'].includes(state)?'graded':'open',tiebreaker_game_id:'g8'};
async function render(){
 const dataPromise=Promise.resolve(window.failSections?null:window.fixtureHistory);
 const history=await PickemHistory({scope:{},userId:'fixture-member',week,games,voidGameIds:new Set(),weekClosed:locked,entryAvailable:!locked,dataPromise});
 const standings=await PickemStandings({scope:{},week,weekClosed:locked,entryAvailable:!locked});
 const overview=await PickemMemberOverview({dataPromise});
 createRoot(document.getElementById('root')).render(<><main className="px-4 py-4 text-white"><h1>Pick ’Em fixture</h1><LocalNavigation member={state!=='guest'}/>{state!=='guest'&&overview}{state==='closed-draft'?<EntryStatus title="Entry closed — not entered" detail="Saved drafts do not qualify as accepted entries."/>:state==='guest'?<Guest games={games}/>:<Form weekId="fixture" weekNumber={9} games={games} entryClosed={locked} contest={{entered,status:state==='disqualified'?'disqualified':'valid',completedAt:'2026-10-18T18:00:00Z'}} tiebreaker={{matchup:'Stephenville at Jarrell',locked,savedPrediction:state==='draft'?undefined:42}} saveAction={action} saveDraftAction={action}/>} {state!=='guest'&&history}{standings}</main><MobileNavigation/></>);
}render();
`;
const bundle=await build({stdin:{contents:fixture,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'isolated-boundaries',setup(b){
 if(process.argv.includes('--baseline'))b.onLoad({filter:/components\/PickemSlateForm\.tsx$/},a=>({contents:execFileSync('git',['show',baselineRef+':components/PickemSlateForm.tsx'],{encoding:'utf8'}),loader:'tsx',resolveDir:process.cwd()+'/components'}));
 b.onResolve({filter:/^next\/(link|image|navigation)$|^@vercel\/analytics$|^@\/app\/pickem\/(actions|recovery)$|^@\/lib\/(pickem-page-loader|games)$/},a=>({path:a.path,namespace:'fixture'}));
 b.onLoad({filter:/.*/,namespace:'fixture'},a=>({resolveDir:process.cwd(),loader:'tsx',contents:a.path==='@/lib/pickem-page-loader'?"export async function loadPickemHistory(){if(window.failSections)throw Error('read failure');return window.fixtureHistory};export async function loadPickemStandings(){if(window.failSections)throw Error('read failure');return window.fixtureStandings}":a.path==='@/lib/games'?"export function getGameById(){return {awaySchoolSlug:'away',homeSchoolSlug:'home',awayTeam:'Canyon West Plains',homeTeam:'Stephenville'}}":a.path==='next/link'?"import React from 'react';export default function Link({children,...p}){return <a {...p}>{children}</a>};export function useLinkStatus(){return {pending:false}}":a.path==='next/image'?"import React from 'react';export default function Image({fill,sizes,...p}){return <img {...p}/>}" : a.path==='next/navigation'?"export function usePathname(){return '/pickem'};export function useRouter(){return {refresh(){window.refreshes++}}}":a.path==='@vercel/analytics'?"export function track(){}":a.path.endsWith('/recovery')?"export async function reconcilePickemWrite(){window.reconciliations++;return 'unresolved'}":"export async function savePickemDraft(){};export async function savePickemSlate(){}"}));
}}]});
const server=createServer((req,res)=>{res.setHeader('content-type',req.url==='/fixture.js'?'text/javascript':req.url==='/style.css'?'text/css':'text/html');res.end(req.url==='/fixture.js'?bundle.outputFiles[0].text:req.url==='/style.css'?css:'<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Isolated Pick Em</title><link rel="stylesheet" href="/style.css"><body><div id="root"></div><script src="/fixture.js"></script></body></html>')});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
try{
 browser=await chromium.launch({headless:true,...(process.env.PICKEM_CHROMIUM_EXECUTABLE?{executablePath:process.env.PICKEM_CHROMIUM_EXECUTABLE}:{}),args:['--no-sandbox','--no-zygote','--single-process','--disable-gpu','--disable-software-rasterizer']});
 const page=await browser.newPage();page.on('dialog',dialog=>dialog.accept());
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const origin='http://127.0.0.1:'+server.address().port;
 const load=async(state,width=375,height=844)=>{await page.setViewportSize({width,height});await page.goto(origin+'/?state='+state);await page.getByRole('heading',{name:'Pick ’Em fixture'}).waitFor()};
 for(const width of [375,390]){
  await load('draft',width);
  await page.locator('fieldset label').first().click();
  const bar=await page.getByRole('button',{name:'Enter',exact:true}).boundingBox();const nav=await page.getByRole('navigation',{name:'Mobile navigation'}).boundingBox();
  const overlaps=bar.y < nav.y+nav.height && bar.y+bar.height>nav.y;
  console.log(JSON.stringify({width,bar,nav,overlaps}));
  assert.equal(overlaps,process.argv.includes('--baseline'));
 }
 if(!process.argv.includes('--baseline')){
  for(const width of [375,390,768,1280]){
   for(const state of ['guest','draft','valid','locked','graded','finalized','disqualified','closed-draft','sections-error']){
    await load(state,width);
    if(state!=='closed-draft'){
     const cards=page.locator('fieldset');
     await cards.first().waitFor();
     assert.equal(await cards.count(),10);
     assert.match(await cards.first().innerText(),/Game 1/i);
     assert.match(await cards.first().innerText(),/Tiebreaker/i);
     assert.equal(await cards.first().locator('legend').textContent(),'Stephenville at Jarrell');
     const radioNames=await cards.evaluateAll(nodes=>nodes.map(n=>n.querySelector('input[type=radio]')?.name));
     assert.deepEqual(radioNames,['8','0','1','2','3','4','5','6','7','9'].map(i=>state==='guest'?'guest_game'+i:'pick_g'+i));
     if(state==='valid')assert.equal(await cards.first().locator('input[value=away]').isChecked(),true);
    }
    const status=page.getByRole('region',{name:'Contest entry status'});
    if(state==='guest')await status.getByText('Guest selections — not entered',{exact:true}).waitFor();
    if(state==='draft')await status.getByText('Draft — not entered',{exact:true}).waitFor();
    if(['valid','locked','graded','finalized'].includes(state))await status.getByText('Valid entry accepted',{exact:true}).waitFor();
    if(state==='disqualified')await status.getByText('Entry ineligible or under review',{exact:true}).waitFor();
    if(state==='closed-draft')await status.getByText('Entry closed — not entered',{exact:true}).waitFor();
    for(const id of ['weekly-standings','season-leaderboard'])assert.equal(await page.locator('#'+id).count(),1);
    if(state!=='guest')assert.equal(await page.locator('#my-picks').count(),1);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,state+': overflow at '+width);
    if(['locked','graded','finalized'].includes(state))assert.equal(await page.locator('fieldset:not(:disabled)').count(),0);
    if(state==='sections-error'){
     assert.match(await page.locator('#weekly-standings').innerText(),/New entries are closed/);
     await page.getByRole('button',{name:'Try loading again'}).first().click();assert.equal(await page.evaluate(()=>window.refreshes),1);
    }
    if(state==='valid'&&process.env.PICKEM_SCREENSHOT_DIR)await page.screenshot({path:process.env.PICKEM_SCREENSHOT_DIR+'/pickem-'+width+'.png'});
    if(state==='guest'&&width<1024){
     await page.getByRole('link',{name:/With Free Account|Create Free Account/}).scrollIntoViewIfNeeded();
     const cta=await page.getByRole('link',{name:/With Free Account|Create Free Account/}).boundingBox();const nav=await page.getByRole('navigation',{name:'Mobile navigation'}).boundingBox();assert.ok(cta.y+cta.height<=nav.y,'guest CTA overlaps navigation');
    }
   }
   console.log('PASS state matrix width '+width);
  }
  for(const width of [375,390]){
   await load('error',width,400);
   await page.getByLabel('Mobile phone number required to enter',{exact:true}).fill('2545551234');
   await page.locator('input[name=eligibility_attested]').check();
   await page.getByRole('button',{name:'Enter',exact:true}).click();
   await page.getByText('Save outcome uncertain',{exact:true}).waitFor();
   assert.equal(await page.evaluate(()=>window.writes),1);
   await page.getByRole('button',{name:'Check saved state',exact:true}).click();
   assert.equal(await page.evaluate(()=>window.reconciliations),1);assert.equal(await page.evaluate(()=>window.writes),1);
   assert.equal(await page.getByRole('button',{name:'Enter',exact:true}).isDisabled(),true);
   await load('draft',width);
   // Keyboard selects a radio and reaches an action without pointer-only input.
   await page.locator('input[type=radio]').first().focus();await page.keyboard.press('Space');
   assert.equal(await page.locator('input[type=radio]').first().isChecked(),true);
   await page.getByRole('button',{name:'Save Draft',exact:true}).first().focus();await page.keyboard.press('Enter');
   await page.getByRole('status').filter({hasText:'Fixture save accepted'}).waitFor();assert.equal(await page.evaluate(()=>window.writes),1);
   await page.getByRole('button',{name:'View picks',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Hide picks',exact:true}).getAttribute('aria-expanded'),'true');
  }
  if(process.env.PICKEM_AXE_MODULE){
   const axe=require(process.env.PICKEM_AXE_MODULE);
   for(const state of ['guest','draft','valid','locked','graded','sections-error']){
    await load(state,375);await page.addScriptTag({content:axe.source});
    const results=await page.evaluate(()=>axe.run(document.querySelector('main'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
    if(results.violations.length)console.log(JSON.stringify({state,violations:results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))}))}));
    assert.deepEqual(results.violations.map(v=>({id:v.id,impact:v.impact})),[],state+' accessibility');
   }
   console.log('PASS axe WCAG A/AA fixtures');
  }
  assert.deepEqual(errors,[]);console.log('PASS keyboard, reduced-height viewport, history disclosure and unknown-write recovery without replay');
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));}
