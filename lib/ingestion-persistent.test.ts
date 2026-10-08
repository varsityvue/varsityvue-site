import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePersistentDraft,bindActor,captureManualTarget,manualTargetRevision,type ReviewCatalog } from './ingestion-persistent-validation';
import { getSchools } from './schools';
import { getGames } from './games';
import { getAllGameStats } from './game-stats';
import { extendedGameStats } from '@/data/extended-game-stats';
import { playerProfiles } from '@/data/player-profiles';
import type { IngestionDraft } from './ingestion-contracts';
const c={schools:getSchools(),canonicalGames:getGames(),coreStats:getAllGameStats(),extendedStats:extendedGameStats,playerProfiles};
const known=<T>(value:T)=>({state:'known' as const,value}),missing={state:'omitted' as const};
function schedule():IngestionDraft{return {schemaVersion:1,draftId:'test',dataClass:'schedule',operation:'create',schoolSlug:'albany',season:2027,target:{match:{state:'unresolved',candidates:[]},expectedRevision:missing},sources:[{sourceId:'source',kind:'form',locator:missing}],evidence:[],identityMatches:[],availability:[],issues:[],disposition:'pending',values:{rows:[{rowId:'r',game:{state:'confirmed',id:'new:r',confirmedBy:'spoof'},opponent:{state:'confirmed',id:'stamford',confirmedBy:'spoof'},week:known(1),date:known('2027-09-03'),kickoffTime:missing,timeZone:known('America/Chicago'),site:known('away'),location:missing}]}};}
test('canonical source-backed schedule stays a draft preview and preserves TBD',()=>{const d=schedule(),before=JSON.stringify(c);const r=validatePersistentDraft(d,c);assert.equal(r.validation.reviewable,true);assert.ok(r.validation.warnings.some(w=>w.includes('TBD')));assert.equal(JSON.stringify(c),before);});
test('unknown/same opponent, missing confirmation and duplicate schedules block readiness',()=>{const d=schedule();if(d.dataClass!=='schedule')throw Error();d.values.rows[0].opponent={state:'confirmed',id:'invented-school',confirmedBy:'x'};assert.equal(validatePersistentDraft(d,c).validation.reviewable,false);d.values.rows[0].opponent={state:'confirmed',id:'albany',confirmedBy:'x'};assert.equal(validatePersistentDraft(d,c).validation.reviewable,false);});
test('review report binds source, fields and catalog; supplied actor is replaced',()=>{const d=schedule();const bound=bindActor(d,'authenticated-actor');if(bound.dataClass!=='schedule')throw Error();assert.equal(bound.values.rows[0].game.state==='confirmed'&&bound.values.rows[0].game.confirmedBy,'authenticated-actor');const a=validatePersistentDraft(bound,c);bound.values.rows[0].kickoffTime=known('19:00');assert.notEqual(a.validation.validationHash,validatePersistentDraft(bound,c).validation.validationHash);assert.notEqual(a.validation.validationHash,validatePersistentDraft(d,{...c,canonicalGames:[]}).validation.validationHash);});
test('empty source and incomplete identity remain blockers; unknown never becomes zero',()=>{const d=schedule();d.sources=[];assert.equal(validatePersistentDraft(d,c).validation.reviewable,false);});

test('decoded image validation preserves original, strips preview metadata and rejects disguised/oversized files',async()=>{
 const sharp=(await import('sharp')).default;const {validateIngestionImage}=await import('./ingestion-evidence');
 const bytes=await sharp({create:{width:8,height:8,channels:3,background:'#123456'}}).png().toBuffer();
 const output=await validateIngestionImage(new File([new Uint8Array(bytes)],'evidence.png',{type:'image/png'}));assert.deepEqual(output.original,bytes);assert.equal((await sharp(output.preview).metadata()).format,'webp');assert.equal(output.sha256.length,64);
 await assert.rejects(validateIngestionImage(new File([new Uint8Array(bytes)],'disguised.jpg',{type:'image/jpeg'})));
 await assert.rejects(validateIngestionImage(new File(['invalid'],'invalid.png',{type:'image/png'})));
 await assert.rejects(validateIngestionImage(new File([new Uint8Array(5242881)],'large.png',{type:'image/png'})));
 await assert.rejects(validateIngestionImage(new File(['<svg/>'],'vector.svg',{type:'image/svg+xml'})));
 const bomb=await sharp({create:{width:10001,height:1,channels:3,background:'#fff'}}).png().toBuffer();await assert.rejects(validateIngestionImage(new File([new Uint8Array(bomb)],'wide.png',{type:'image/png'})));
});

test('managed roster authority blocks conflicting new provisional identity',()=>{
 const d=schedule();const roster={...d,dataClass:'roster',values:{rows:[{rowId:'r',name:'Local Player',player:{state:'confirmed',id:'new:albany-local-player-2027',confirmedBy:'x'},jerseyNumber:missing,grade:missing,positions:missing,height:missing,weight:missing}]}};
 const managedRoster=[{internalId:'managed-id',schoolSlug:'albany',season:2027,name:'Local Player',active:true,updatedAt:'2026-10-07'}];
 assert.equal(validatePersistentDraft(roster,{...c,managedRoster}).validation.reviewable,false);
 roster.values.rows[0].player.id='managed:managed-id';assert.equal(validatePersistentDraft(roster,{...c,managedRoster}).validation.reviewable,true);
});

test('schedule correction binds captured values and current canonical revision',()=>{
 const base=schedule();const target='cross-plains-at-albany-2026-week-6';const current=captureManualTarget('schedule',target,'albany',2026,'reviewer',c);
 const d={...base,season:2026,dataClass:'correction',operation:'correct',reason:'Source correction',target:{match:{state:'confirmed',id:target,confirmedBy:'reviewer'},expectedRevision:known(manualTargetRevision('schedule',target,'albany',2026,c))},values:{dataClass:'schedule',current,proposed:structuredClone(current)}};
 assert.equal(validatePersistentDraft(d,c).validation.reviewable,true);
 const changed={...c,canonicalGames:c.canonicalGames.map(g=>g.id===target?{...g,venue:'Changed authoritative venue'}:g)};assert.equal(validatePersistentDraft(d,changed).validation.reviewable,false);
});


const scheduleDraft=()=>schedule() as Extract<IngestionDraft,{dataClass:'schedule'}>;
function rosterDraft():Extract<IngestionDraft,{dataClass:'roster'}> {
 const base=schedule();return {...base,dataClass:'roster',operation:'create',values:{rows:['Alpha Person','Beta Person'].map((name,i)=>({rowId:`roster-${i}`,name,player:{state:'confirmed',id:`new:albany-${name.toLowerCase().replaceAll(' ','-')}-2027`,confirmedBy:'reviewer'},jerseyNumber:known('12'),grade:missing,positions:missing,height:missing,weight:missing}))}};
}
test('F1 football dates belong to August–December of the selected season; TBD stays unknown',()=>{
 for(const date of ['2028-09-03','2026-09-03','2027-07-31','2027-01-01']){const d=scheduleDraft();d.values.rows[0].date=known(date);assert.ok(validatePersistentDraft(d,c).validation.blocking.some(b=>b.includes('football season')));}
 for(const date of ['2027-08-01','2027-09-03','2027-12-31']){const d=scheduleDraft();d.values.rows[0].date=known(date);const r=validatePersistentDraft(d,c);assert.equal(r.validation.reviewable,true);assert.deepEqual(r.draft.dataClass==='schedule'&&r.draft.values.rows[0].kickoffTime,missing);assert.ok(r.validation.warnings.some(w=>w.includes('TBD')));}
});
test('F2 different-opponent draft rows conflict independently on date or week',()=>{
 for(const [date,week] of [['2027-09-03',2],['2027-09-10',1],['2027-09-03',1]] as const){const d=scheduleDraft();d.values.rows.push({...structuredClone(d.values.rows[0]),rowId:'other',game:{state:'confirmed',id:'new:other',confirmedBy:'reviewer'},opponent:{state:'confirmed',id:'cisco',confirmedBy:'reviewer'},date:known(date),week:known(week)});assert.ok(validatePersistentDraft(d,c).validation.blocking.some(b=>b.includes('between draft rows')));}
 const d=scheduleDraft();d.values.rows.push({...structuredClone(d.values.rows[0]),rowId:'later',game:{state:'confirmed',id:'new:later',confirmedBy:'reviewer'},date:known('2027-09-10'),week:known(2)});assert.equal(validatePersistentDraft(d,c).validation.reviewable,true);
 // Unknown week does not manufacture week zero, but known zero still collides.
 d.values.rows[0].week={state:'unknown'};d.values.rows[1].week=known(0);assert.equal(validatePersistentDraft(d,c).validation.reviewable,true);d.values.rows[0].week=known(0);assert.equal(validatePersistentDraft(d,c).validation.reviewable,false);
});
test('F2 canonical commitments use local kickoff dates and week, without opponent matching',()=>{
 const d=scheduleDraft();const game={id:'canonical-other-opponent',season:2027,week:2,gameType:'regular' as const,status:'scheduled' as const,homeSchoolSlug:'albany',awaySchoolSlug:'cisco',districtGame:false,kickoff:'2027-09-04T00:30:00Z'};
 for(const g of [game,{...game,kickoff:'2027-09-03'},{...game,kickoff:'2027-09-10',week:1}]) assert.ok(validatePersistentDraft(d,{...c,canonicalGames:[g]}).validation.blocking.some(b=>b.includes('canonical-other-opponent')));
 assert.equal(validatePersistentDraft(d,{...c,canonicalGames:[{...game,kickoff:'2027-09-10'},{...game,season:2026},{...game,homeSchoolSlug:'stamford'},{...game,gameType:'bye'}]}).validation.reviewable,true);
});
test('F2 correction excludes its own commitment but not another game in the week',()=>{
 const base=schedule(),target='cross-plains-at-albany-2026-week-6',current=captureManualTarget('schedule',target,'albany',2026,'reviewer',c);
 const d={...base,season:2026,dataClass:'correction',operation:'correct',reason:'Source correction',target:{match:{state:'confirmed',id:target,confirmedBy:'reviewer'},expectedRevision:known(manualTargetRevision('schedule',target,'albany',2026,c))},values:{dataClass:'schedule',current,proposed:structuredClone(current)}};
 assert.equal(validatePersistentDraft(d,c).validation.reviewable,true);
 const own=c.canonicalGames.find(g=>g.id===target)!;assert.ok(validatePersistentDraft(d,{...c,canonicalGames:[...c.canonicalGames,{...own,id:'other-commitment',awaySchoolSlug:'cisco'}]}).validation.blocking.some(b=>b.includes('other-commitment')));
});
test('F3 normalized jersey sharing is visible, reviewable and preserves strings/unknown/zero',()=>{
 const d=rosterDraft();d.values.rows[0].jerseyNumber=known('00');d.values.rows[1].jerseyNumber=known('0');let r=validatePersistentDraft(d,c);assert.equal(r.validation.reviewable,true);assert.ok(r.validation.warnings.some(w=>w.includes('number 0 within this draft')));assert.deepEqual(r.draft.dataClass==='roster'&&r.draft.values.rows[0].jerseyNumber,known('00'));
 for(const field of [missing,{state:'unknown' as const},{state:'unavailable' as const}]){d.values.rows[1].jerseyNumber=field;r=validatePersistentDraft(d,c);assert.equal(r.validation.warnings.length,0);assert.deepEqual(r.draft.dataClass==='roster'&&r.draft.values.rows[1].jerseyNumber,field);}
});
test('F3 active scoped roster conflicts exclude linked self and inactive/other scopes',()=>{
 const d=rosterDraft();d.values.rows=d.values.rows.slice(0,1);
 const managed={internalId:'m',schoolSlug:'albany',season:2027,name:'Existing Player',active:true,jerseyNumber:'12',updatedAt:'2026-10-07'};
 const profile={playerId:'p',schoolSlug:'albany',season:2027,name:'Existing Player',jerseyNumber:'12',verificationStatus:'verified' as const};
 let catalog:ReviewCatalog={...c,managedRoster:[managed],playerProfiles:[profile]};let r=validatePersistentDraft(d,catalog);assert.equal(r.validation.reviewable,true);assert.ok(r.validation.warnings.some(w=>w.includes('active scoped managed')));assert.ok(r.validation.warnings.some(w=>w.includes('scoped public')));
 assert.equal(validatePersistentDraft(d,{...c,managedRoster:[{...managed,active:false},{...managed,schoolSlug:'cisco'},{...managed,season:2026}],playerProfiles:[]}).validation.warnings.length,0);
 const target='managed:m';catalog={...catalog,managedRoster:[{...managed,publicPlayerId:'p'}]};const current=captureManualTarget('roster',target,'albany',2027,'reviewer',catalog);
 const correction={...d,dataClass:'correction',operation:'correct',reason:'Confirm existing shared number',target:{match:{state:'confirmed',id:target,confirmedBy:'reviewer'},expectedRevision:known(manualTargetRevision('roster',target,'albany',2027,catalog))},values:{dataClass:'roster',current,proposed:structuredClone(current)}};
 assert.equal(validatePersistentDraft(correction,catalog).validation.reviewable,true);assert.equal(validatePersistentDraft(correction,catalog).validation.warnings.length,0);
 const other={...managed,internalId:'another',name:'Legitimate Number Sharer'};r=validatePersistentDraft(correction,{...catalog,managedRoster:[...catalog.managedRoster!,other]});assert.equal(r.validation.reviewable,true);assert.ok(r.validation.warnings.some(w=>w.includes('Legitimate Number Sharer')));
});
