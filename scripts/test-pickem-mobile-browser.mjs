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
const baselineRef=process.env.PICKEM_BASE_REF || '3cef8fb2c2af5b47548e22f0526074ecb52c3b36';
if(process.env.PICKEM_SCREENSHOT_DIR)await mkdir(process.env.PICKEM_SCREENSHOT_DIR,{recursive:true});
const css = (await postcss([tailwind({base:process.cwd()})]).process(process.argv.includes('--baseline') ? execFileSync('git',['show',baselineRef+':app/globals.css'],{encoding:'utf8'})+'\n@source inline("bottom-[calc(env(safe-area-inset-bottom)+0.75rem)]");' : await readFile('app/globals.css','utf8'), {from:process.cwd()+'/app/globals.css'})).css;
const previousV2=process.argv.includes('--previous-v2');
const fixture = `
import React from 'react'; import {createRoot} from 'react-dom/client';
import Form from './components/PickemSlateForm'; import Guest from './components/PickemGuestSlate';
import MobileNavigation from './components/MobileNavigation';
import LocalNavigation from './components/PickemLocalNavigation';
import EntryStatus from './components/PickemEntryStatus';
import Header from './components/PickemContestHeader';
import Prize from './components/PickemPrizeCounter';
const previousV2=${previousV2};
const baseline=${process.argv.includes('--baseline')};
import {orderPickemSlateRows} from './lib/pickem-display-order';
import {PickemHistory,PickemStandings} from './components/PickemOptionalSections';
const state=new URLSearchParams(location.search).get('state')||'draft';
window.writes=0;window.reconciliations=0;window.refreshes=0;window.prizeReads=0;
window.prizeData=state==='zero'?{valid_entries:0,prize_dollars:0}:state==='cap'?{valid_entries:143,prize_dollars:100}:{valid_entries:80,prize_dollars:80};
const locked=['locked','graded','finalized','closed-draft','sections-error'].includes(state);
const entered=['valid','locked','graded','finalized','disqualified'].includes(state);
window.fixtureHistory={memberPickRows:[{pickem_game_id:'g0',picked_school_slug:'away',is_correct:true}],rawMemberTotal:{correct_picks:8,incorrect_picks:2,graded_picks:10,season_rank:42},memberGameRows:[{id:'g0',game_id:'game0',week_id:'fixture'}],memberWeekRows:[{id:'fixture',season:2026,week:9,title:'Week 9',status:'graded'}],memberWeekGameRows:[{id:'g0',week_id:'fixture',result_winner_school_slug:'away',graded_at:'2026-10-18'}]};
window.fixtureStandings={leaderboardRows:[{ordinal:1,rank:1,display_name:'Fixture fan',graded_picks:10,correct_picks:8,accuracy_pct:80}],weeklyStandings:locked?[{ordinal:1,weekly_rank:1,display_name:'Fixture fan',graded_picks:10,correct_picks:8,distance:2}]:[]};
window.failSections=['sections-error','optional-error'].includes(state);
const games=orderPickemSlateRows(Array.from({length:10},(_,i)=>({id:'g'+i,gameId:'game'+i,isTiebreaker:i===8,awaySlug:'away',homeSlug:'home',awayName:i===8?'Stephenville':'Canyon West Plains',homeName:i===8?'Jarrell':'Stephenville',awayMark:'CWP',homeMark:'STV',awayColor:'#800000',homeColor:'#0055aa',kickoffLabel:'Fri 7:00 PM',locked,selectedSlug:['draft','guest'].includes(state)?undefined:'away',savedSlug:['draft','error'].includes(state)?undefined:'away'})), 'g8');
const action=async()=>{window.writes++;await new Promise(r=>setTimeout(r,30));return state==='error'?{status:'unknown',message:'Interrupted'}:{status:'success',message:'Fixture save accepted'};};
const week={id:'fixture',season:2026,week:9,title:'Week 9',status:['graded','finalized'].includes(state)?'graded':'open',tiebreaker_game_id:'g8'};
async function render(){
 const dataPromise=Promise.resolve(window.failSections?null:window.fixtureHistory);
 const history=await PickemHistory({scope:{},userId:'fixture-member',week,games,voidGameIds:new Set(),weekClosed:locked,entryAvailable:!locked,dataPromise});
 const standings=await PickemStandings({scope:{},week,weekClosed:locked,entryAvailable:!locked});
 const picks=state==='closed-draft'?<EntryStatus title="Entry closed — not entered" detail="Saved drafts do not qualify as accepted entries."/>:state==='guest'?<Guest games={games}/>:<Form weekId="fixture" weekNumber={9} games={games} entryClosed={locked} contest={{entered,status:state==='disqualified'?'disqualified':'valid',completedAt:'2026-10-18T18:00:00Z'}} tiebreaker={{matchup:'Stephenville at Jarrell',locked,savedPrediction:state==='draft'?undefined:42}} saveAction={action} saveDraftAction={action}/>;
 const prize=<Prize weekId="fixture" initialPrize={window.prizeData} entryClosed={locked}/>;
 const disclosure=<details><summary className="min-h-11 cursor-pointer">Contest rules &amp; prize details</summary>{previousV2?prize:null}<p>$1 per valid accepted entry · up to $100 this week</p><a href="/pickem/rules">Official Rules</a></details>;
 const pickView=<>{!previousV2?prize:null}{picks}{disclosure}</>;
 const header=<Header season={2026} week={9} deadline="2026-10-24T00:00:00Z" sponsorName="Gilder Storage" sponsorLogo={null}/>;
 createRoot(document.getElementById('root')).render(<><main className="px-4 py-4 text-white"><h1 className="sr-only">Pick ’Em fixture</h1>{header}{baseline?<><LocalNavigation member={state!=='guest'}/>{picks}{history}{standings}</>:<LocalNavigation defaultView={locked?'standings':'picks'} picks={pickView} results={state==='guest'?<section id="my-picks"><h2>My Results</h2><p>Sign in to see your picks and results.</p></section>:history} standings={standings}/>}</main><MobileNavigation/></>);
}render();
`;
const bundle=await build({stdin:{contents:fixture,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,platform:'browser',jsx:'automatic',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'isolated-boundaries',setup(b){
 if(previousV2)b.onLoad({filter:/components\/PickemPrizeCounter\.tsx$/},()=>({contents:execFileSync('git',['show','10a0a832bb0055186512cd8d359a5bffd2b97453:components/PickemPrizeCounter.tsx'],{encoding:'utf8'}),loader:'tsx',resolveDir:process.cwd()+'/components'}));
 b.onResolve({filter:/^@\/lib\/supabase\/client$/},a=>({path:a.path,namespace:'prize-fixture'}));
 b.onLoad({filter:/.*/,namespace:'prize-fixture'},()=>({contents:"export function createClient(){return {from(){window.prizeReads++;const q={select(){return q},eq(){return q},abortSignal(){return q},maybeSingle(){return q},retry(){return Promise.resolve({data:window.prizeData,error:null})}};return q}}}",loader:'js'}));
 if(process.argv.includes('--baseline'))b.onLoad({filter:/components\/(PickemSlateForm|PickemGuestSlate|PickemLocalNavigation|PickemContestHeader|PickemEntryStatus|PickemSelectionCard)\.tsx$/},a=>({contents:execFileSync('git',['show',baselineRef+':components/'+a.path.split('/').at(-1)],{encoding:'utf8'}),loader:'tsx',resolveDir:process.cwd()+'/components'}));
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
 const lockedState=state=>['locked','graded','finalized','closed-draft','sections-error'].includes(state);
 const load=async(state,width=375,height=844)=>{await page.setViewportSize({width,height});await page.goto(origin+'/?state='+state);await page.getByRole('heading',{name:'Pick ’Em fixture'}).waitFor();if(!process.argv.includes('--baseline'))await page.getByRole('tab',{name:'Picks',exact:true}).click()};
 for(const width of [375,390]){
  await load('draft',width);
  await page.locator('fieldset label').first().click();
  const bar=await page.getByRole('button',{name:'Enter',exact:true}).boundingBox();const nav=await page.getByRole('navigation',{name:'Mobile navigation'}).boundingBox();
  const overlaps=bar.y < nav.y+nav.height && bar.y+bar.height>nav.y;
  console.log(JSON.stringify({width,bar,nav,overlaps}));
  assert.equal(overlaps,false);
 }
 await load('valid',375);
 const metrics=await page.evaluate(()=>({height:document.documentElement.scrollHeight,firstCardHeight:document.querySelector('fieldset')?.getBoundingClientRect().height,firstCardTop:document.querySelector('fieldset')?.getBoundingClientRect().top,visiblePanels:[...document.querySelectorAll('[role=tabpanel]')].filter(e=>!e.hidden).length}));
 console.log('MOBILE_COMPARISON '+JSON.stringify({baseline:process.argv.includes('--baseline'),previousV2,...metrics}));
 if(process.env.PICKEM_SCREENSHOT_DIR)await page.screenshot({path:process.env.PICKEM_SCREENSHOT_DIR+'/comparison-'+(process.argv.includes('--baseline')?'before':'after')+'.png'});
 if(!process.argv.includes('--baseline')&&!previousV2){
  for(const width of [375,390,768,1280]){
   for(const state of ['guest','draft','valid','locked','graded','finalized','disqualified','closed-draft','sections-error','optional-error','zero','cap']){
    await load(state,width);
    const stats=page.locator('dl[aria-label="Contest participation and prize"]');
    assert.equal(await stats.isVisible(),true);
    assert.match(await stats.innerText(),new RegExp(lockedState(state)?'Provisional prize':'Current prize'));
    assert.match(await stats.innerText(),state==='zero'?/0\s+Current prize\s+\$0/:state==='cap'?/143\s+Current prize\s+\$100/:/80\s+(Current|Provisional) prize\s+\$80/);
    assert.equal(await page.evaluate(()=>window.prizeReads),1,'only one existing refresh');
    const details=page.locator('details').filter({has:page.getByText('Contest rules & prize details',{exact:true})});
    assert.equal(await details.getAttribute('open'),null);
    const toggle=details.locator('summary');await toggle.focus();await page.keyboard.press('Enter');
    assert.equal(await details.evaluate(e=>e.open),true);
    await page.keyboard.press('Space');assert.equal(await details.evaluate(e=>e.open),false);
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
     await page.getByRole('tab',{name:'Standings',exact:true}).click();
     assert.match(await page.locator('#weekly-standings').innerText(),/New entries are closed/);
     await page.getByRole('button',{name:'Try loading again'}).first().click();assert.equal(await page.evaluate(()=>window.refreshes),1);
    }
    if(state==='valid'&&process.env.PICKEM_SCREENSHOT_DIR)await page.screenshot({path:process.env.PICKEM_SCREENSHOT_DIR+'/pickem-'+width+'.png'});
    if(['guest','draft','valid'].includes(state)){
     const first=page.locator('fieldset input[type=radio]').first();
     await page.locator('fieldset label').first().click();
     const formNode=await page.locator('fieldset').first().evaluate(el=>{el.dataset.identity='kept';return true});
     assert.equal(formNode,true);
     await page.getByRole('tab',{name:'My Results',exact:true}).click();
     assert.equal(await page.locator('fieldset').first().isVisible(),false);
     assert.equal(await page.locator('.pickem-mobile-actions:visible').count(),0);
     await page.getByRole('tab',{name:'Standings',exact:true}).click();
     await page.getByRole('tab',{name:'Picks',exact:true}).click();
     assert.equal(await first.isChecked(),true);
     assert.equal(await page.locator('fieldset').first().getAttribute('data-identity'),'kept');
     await page.goBack();
     assert.equal(await page.getByRole('tab',{name:'Standings',exact:true}).getAttribute('aria-selected'),'true');
     await page.getByRole('tab',{name:'Picks',exact:true}).click();
     await page.getByRole('tab',{name:'Picks',exact:true}).focus();await page.keyboard.press('End');
     assert.equal(await page.getByRole('tab',{name:'Standings',exact:true}).getAttribute('aria-selected'),'true');
     await page.keyboard.press('Home');
     await page.keyboard.press('ArrowRight');
     assert.equal(await page.getByRole('tab',{name:'My Results',exact:true}).getAttribute('aria-selected'),'true');
     await page.keyboard.press('ArrowLeft');
     assert.equal(await page.getByRole('tab',{name:'Picks',exact:true}).getAttribute('aria-selected'),'true');
    }
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
   await page.locator('#predicted_total').fill('44');
   await page.getByRole('tab',{name:'My Results',exact:true}).click();
   await page.getByRole('tab',{name:'Picks',exact:true}).click();
   assert.equal(await page.getByLabel('Mobile phone number required to enter',{exact:true}).inputValue(),'2545551234');
   assert.equal(await page.locator('#predicted_total').inputValue(),'44');
   assert.equal(await page.locator('input[name=eligibility_attested]').isChecked(),true);
   await page.getByRole('button',{name:'Enter',exact:true}).click();
   await page.getByText('Save outcome uncertain',{exact:true}).waitFor();
   await page.getByRole('tab',{name:'Standings',exact:true}).click();
   await page.getByRole('tab',{name:'Picks',exact:true}).click();
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
   await page.getByRole('tab',{name:'My Results',exact:true}).click();
   await page.getByRole('button',{name:'View picks',exact:true}).click();assert.equal(await page.getByRole('button',{name:'Hide picks',exact:true}).getAttribute('aria-expanded'),'true');
  }
  await page.goto(origin+'/?state=locked');
  await page.waitForFunction(()=>document.querySelector('[role=tab][aria-selected=true]')?.textContent==='Standings');
  for(const hash of ['#my-picks','#weekly-standings','#season-leaderboard']){
   await load('valid',375);
   await page.evaluate(hash=>{location.hash=hash},hash);
   const view=hash==='#my-picks'?'My Results':'Standings';
   await page.getByRole('tab',{name:view,exact:true}).waitFor();
   await page.waitForFunction(view=>document.querySelector('[role=tab][aria-selected=true]')?.textContent===view,view);
   assert.equal(await page.locator(hash).isVisible(),true);
   await page.waitForFunction(hash=>document.querySelector(hash).getBoundingClientRect().top>=0 && document.querySelector(hash).getBoundingClientRect().top<innerHeight,hash);
   await page.reload();
   await page.waitForFunction(view=>document.querySelector('[role=tab][aria-selected=true]')?.textContent===view,view);
   assert.equal(await page.locator(hash).isVisible(),true);
  }
  console.log('PASS legacy hashes, initial deep links and scroll restoration');
  if(process.env.PICKEM_AXE_MODULE){
   const axe=require(process.env.PICKEM_AXE_MODULE);
   for(const state of ['guest','draft','valid','locked','graded','sections-error','optional-error']){
    await load(state,375);await page.addScriptTag({content:axe.source});
    for(const view of ['Picks','My Results','Standings']){
    await page.getByRole('tab',{name:view,exact:true}).click();
    const results=await page.evaluate(()=>axe.run(document.querySelector('main'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
    if(results.violations.length)console.log(JSON.stringify({state,violations:results.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({html:n.html,summary:n.failureSummary}))}))}));
    assert.deepEqual(results.violations.map(v=>({id:v.id,impact:v.impact})),[],state+' accessibility '+view);
    }
   }
   console.log('PASS axe WCAG A/AA fixtures');
  }
  assert.deepEqual(errors,[]);console.log('PASS keyboard, reduced-height viewport, history disclosure and unknown-write recovery without replay');
 }
}finally{await browser?.close();await new Promise(r=>server.close(r));}
