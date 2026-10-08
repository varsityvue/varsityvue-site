import { normalizeIngestionDraft, type IngestionDraft, type Field } from '@/lib/ingestion-contracts';
import { canonicalRevisionHash, draftReviewHash, correctionDifferences } from '@/lib/ingestion-review-identity';
import { reviewStatsDraft, type EffectiveStatCatalog } from '@/lib/ingestion-stats-review';
import { matchPlayerIdentity,type ManagedPlayerIdentity } from '@/lib/ingestion-matching';
import { getPlayerId } from '@/lib/player-identity';

export type ReviewCatalog = EffectiveStatCatalog & { schools: {slug:string;name:string}[]; managedRosterVersion?:string; managedRoster?: (ManagedPlayerIdentity & {jerseyNumber?:string;positions?:string[];grade?:'Freshman'|'Sophomore'|'Junior'|'Senior';updatedAt:string})[] };
const value = <T>(field:Field<T>) => field.state==='known' ? field.value : undefined;
const jerseyKey = (jersey:string|undefined) => jersey===undefined ? undefined : String(Number(jersey));
function scheduleDate(game:ReviewCatalog['canonicalGames'][number]) {
 if(game.date)return game.date;
 if(!game.kickoff)return undefined;
 if(/^\d{4}-\d{2}-\d{2}$/.test(game.kickoff))return game.kickoff;
 const instant=new Date(game.kickoff);if(!Number.isFinite(instant.getTime()))return undefined;
 return new Intl.DateTimeFormat('en-CA',{timeZone:'America/Chicago',year:'numeric',month:'2-digit',day:'2-digit'}).format(instant);
}

/** Captured canonical baseline; no writes or inferred publication authority. */
export function captureManualTarget(dataClass:'schedule'|'roster',target:string,school:string,season:number,actor:string,catalog:ReviewCatalog) {
 const omitted={state:'omitted'} as const;const known=<T>(v:T|undefined)=>v===undefined?omitted:{state:'known' as const,value:v};
 const confirmed=(id:string)=>({state:'confirmed' as const,id,confirmedBy:actor});
 if(dataClass==='roster') {
  const managed=target.startsWith('managed:')?catalog.managedRoster?.find(p=>`managed:${p.internalId}`===target&&p.schoolSlug===school&&p.season===season&&p.active):undefined;
  const p=managed?{...managed,playerId:target,height:undefined,weight:undefined}:catalog.playerProfiles.find(p=>p.playerId===target&&p.schoolSlug===school&&p.season===season);if(!p)throw new Error('Choose an existing scoped roster identity.');
  return {rows:[{rowId:p.playerId,name:p.name,player:confirmed(managed?target:`public:${p.playerId}`),jerseyNumber:known(p.jerseyNumber),grade:known(p.grade),positions:known(p.positions),height:known(p.height),weight:known(p.weight)}]};
 }
 const g=catalog.canonicalGames.find(g=>g.id===target&&g.season===season&&[g.homeSchoolSlug,g.awaySchoolSlug].includes(school));if(!g)throw new Error('Choose an existing scoped game.');
 const opponent=g.homeSchoolSlug===school?g.awaySchoolSlug:g.homeSchoolSlug;if(!opponent)throw new Error('Canonical opponent is unresolved.');
 let time: string|undefined;
 if(g.kickoff?.includes('T'))time=new Intl.DateTimeFormat('en-GB',{timeZone:'America/Chicago',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(g.kickoff));
 else if(g.time && /^\d{2}:\d{2}$/.test(g.time))time=g.time;
 return {rows:[{rowId:g.id,game:confirmed(g.id),opponent:confirmed(opponent),week:known(g.week),date:known(g.date??g.kickoff?.slice(0,10)),kickoffTime:known(time),timeZone:known('America/Chicago'),site:known(g.isNeutralSite?'neutral':g.homeSchoolSlug===school?'home':'away'),location:known(g.location??g.venue)}]};
}
export function manualTargetRevision(dataClass:'schedule'|'roster',target:string,school:string,season:number,catalog:ReviewCatalog) {
 const row=dataClass==='schedule'?catalog.canonicalGames.find(g=>g.id===target&&g.season===season&&[g.homeSchoolSlug,g.awaySchoolSlug].includes(school)):target.startsWith('managed:')?catalog.managedRoster?.find(p=>`managed:${p.internalId}`===target&&p.schoolSlug===school&&p.season===season&&p.active):catalog.playerProfiles.find(p=>p.playerId===target&&p.schoolSlug===school&&p.season===season);
 return row?canonicalRevisionHash(row):'unresolved';
}
export function validatePersistentDraft(input:unknown,catalog:ReviewCatalog) {
 const parsed=normalizeIngestionDraft(input);
 if(!parsed.ok) throw new Error(parsed.errors.join('\n'));
 const draft=parsed.draft;
 if(new TextEncoder().encode(JSON.stringify(draft)).byteLength>262144)throw new Error('Draft exceeds bounded review size.');
 const values=draft.dataClass==='correction'?draft.values.proposed:draft.values;
 const count='rows' in values?values.rows.length:values.quarterScores.length+values.scoringPlays.length+values.teamStats.length+values.rushing.length+values.passing.length+values.receiving.length;
 if(count>150)throw new Error('At most 150 normalized rows per submission.');
 const blocking:string[]=[]; const warnings:string[]=[];
 if(!catalog.schools.some(s=>s.slug===draft.schoolSlug)) blocking.push('Choose an existing canonical school.');
 if(!draft.sources.length) blocking.push('Retained source required.');
 if(draft.dataClass==='game_stats' || (draft.dataClass==='correction' && draft.values.dataClass==='game_stats')) {
  const report=reviewStatsDraft(draft as Parameters<typeof reviewStatsDraft>[0],catalog);
  blocking.push(...report.blocking,...report.reconciliationConflicts.map(i=>i.message));
  const stats=draft.dataClass==='game_stats'?draft.values:draft.values.dataClass==='game_stats'?draft.values.proposed:null;
  if(stats)for(const row of [...stats.rushing,...stats.passing,...stats.receiving]){const managed=(catalog.managedRoster??[]).filter(p=>p.active&&p.schoolSlug===row.schoolSlug&&p.season===draft.season&&p.name.trim().toLowerCase()===row.player.trim().toLowerCase());if(managed.some(p=>!p.publicPlayerId||p.publicPlayerId!==row.playerId))blocking.push(`Managed roster identity requires an explicit compatible public link: ${row.player}.`);}
  warnings.push(...report.completenessLimitations.map(i=>i.message),...report.sourceInconsistencies.map(i=>i.message),...report.notices.map(i=>i.message));
 } else {
  const values=draft.dataClass==='correction'?draft.values.proposed:draft.values;
  if(!('rows' in values) || !values.rows.length) blocking.push('At least one typed record required.');
  if('rows' in values) for(const row of values.rows) {
   if('game' in row) {
    const opponent=row.opponent.state==='confirmed'?row.opponent.id:null;
    if(!opponent || !catalog.schools.some(s=>s.slug===opponent) || opponent===draft.schoolSlug) blocking.push('Confirm a distinct canonical opponent.');
    if(!value(row.date)||!value(row.site)||value(row.timeZone)!=='America/Chicago') blocking.push('Confirm date, side and America/Chicago time zone.');
    const date=value(row.date),week=value(row.week);
    if(date && (date<`${draft.season}-08-01` || date>`${draft.season}-12-31`)) blocking.push(`Schedule date ${date} is outside the August–December football season ${draft.season}.`);
    const gameId=row.game.state==='confirmed'?row.game.id:null;
    const conflicts=catalog.canonicalGames.filter(g=>g.season===draft.season && g.gameType!=='bye' && [g.homeSchoolSlug,g.awaySchoolSlug].includes(draft.schoolSlug) && g.id!==gameId && ((date!==undefined && scheduleDate(g)===date) || (week!==undefined && g.week===week)));
    for(const g of conflicts) blocking.push(`School schedule conflict with canonical game ${g.id}: same date or week, regardless of opponent.`);
    if(row.game.state!=='confirmed') blocking.push('Explicit game/new-game confirmation required.');
    else if(!row.game.id.startsWith('new:')) {
     const gameId=row.game.id;
     const g=catalog.canonicalGames.find(g=>g.id===gameId && g.season===draft.season);
     if(!g || ![g.homeSchoolSlug,g.awaySchoolSlug].includes(draft.schoolSlug) || ![g.homeSchoolSlug,g.awaySchoolSlug].includes(opponent??'')) blocking.push('Selected game does not agree with school, opponent and season.');
     if(g && draft.operation==='create') blocking.push('Existing schedule target requires a correction/update.');
    } else {
     if(draft.operation!=='create') blocking.push('New schedule candidate cannot correct an existing game.');
    }
    if(row.kickoffTime.state!=='known') warnings.push('Kickoff time remains TBD; interim export must preserve it.');
   } else {
    const match=matchPlayerIdentity({schoolSlug:draft.schoolSlug,season:draft.season,name:row.name},catalog.playerProfiles,catalog.managedRoster);
    const baseline=draft.dataClass==='correction'&&draft.values.dataClass==='roster'?draft.values.current.rows.find(r=>r.rowId===row.rowId):undefined;
    if(baseline?.player.state==='confirmed') {
     if(row.player.state!=='confirmed'||row.player.id!==baseline.player.id)blocking.push('Correction cannot retarget a captured roster identity.');
     const original=matchPlayerIdentity({schoolSlug:draft.schoolSlug,season:draft.season,name:baseline.name},catalog.playerProfiles,catalog.managedRoster);
     if(match.identities.some(i=>!original.identities.some(o=>o.publicPlayerId&&o.publicPlayerId===i.publicPlayerId||o.managedRecordId&&o.managedRecordId===i.managedRecordId)))blocking.push('Proposed roster name conflicts with another existing identity.');
    } else if(row.player.state!=='confirmed') blocking.push(`Confirm identity for ${row.name}.`);
    else if(row.player.id.startsWith('new:')) {
     if(match.identities.length)blocking.push(`New identity conflicts with existing candidates: ${row.name}.`);
     else if(row.player.id!==`new:${getPlayerId(draft.schoolSlug,row.name,draft.season)}`)blocking.push('Edited player name requires explicit provisional identity reconfirmation.');
    } else if(match.match.state==='confirmed' || !match.match.candidates.some(c=>c.id===(row.player as {id:string}).id)) blocking.push(`Identity does not match scoped player: ${row.name}.`);
    if(value(row.weight)!==undefined && (value(row.weight)!<50 || value(row.weight)!>500)) blocking.push('Weight must be 50–500 pounds when provided.');
   }
  }
  if('rows' in values) {
   const rows=values.rows;
   for(let i=0;i<rows.length;i++) {
    const row=rows[i];
    if('game' in row) {
     for(const other of rows.slice(i+1)) if('game' in other && ((value(row.date)!==undefined && value(row.date)===value(other.date)) || (value(row.week)!==undefined && value(row.week)===value(other.week)))) blocking.push(`School schedule conflict between draft rows ${row.rowId} and ${other.rowId}: same date or week, regardless of opponent.`);
    } else {
     const jersey=jerseyKey(value(row.jerseyNumber));if(jersey===undefined)continue;
     for(const other of rows.slice(i+1)) if('player' in other && jersey===jerseyKey(value(other.jerseyNumber))) warnings.push(`Jersey-number conflict: ${row.name} and ${other.name} share normalized number ${jersey} within this draft. Confirm legitimate sharing in the review disposition reason.`);
     const identity=row.player.state==='confirmed'?row.player.id:null;
     const scopedManaged=(catalog.managedRoster??[]).filter(p=>p.active&&p.schoolSlug===draft.schoolSlug&&p.season===draft.season);
     const selfManaged=scopedManaged.find(p=>identity===`managed:${p.internalId}`);
     const publicId=selfManaged?.publicPlayerId??(identity?.startsWith('public:')?identity.slice(7):undefined);
     for(const p of catalog.playerProfiles.filter(p=>p.schoolSlug===draft.schoolSlug&&p.season===draft.season&&p.playerId!==publicId)) if(jersey===jerseyKey(p.jerseyNumber)) warnings.push(`Jersey-number conflict: ${row.name} shares normalized number ${jersey} with scoped public roster player ${p.name} (${p.playerId}). Confirm legitimate sharing in the review disposition reason.`);
     for(const p of scopedManaged) if(identity!==`managed:${p.internalId}` && !(publicId&&p.publicPlayerId===publicId) && jersey===jerseyKey(p.jerseyNumber)) warnings.push(`Jersey-number conflict: ${row.name} shares normalized number ${jersey} with active scoped managed roster player ${p.name} (${p.internalId}). Confirm legitimate sharing in the review disposition reason.`);
    }
   }
   const identities=values.rows.map(r=>'game' in r?JSON.stringify([r.opponent,value(r.date),value(r.week)]):r.player.state==='confirmed'?r.player.id:r.name);
   if(new Set(identities).size!==identities.length) blocking.push('Duplicate row identities within submission.');
  }
  if(draft.dataClass==='correction') {
   try {
    const target=draft.target.match.state==='confirmed'?draft.target.match.id:'';
    if(draft.values.dataClass==='game_stats')throw new Error('Wrong correction class');
    const first=draft.values.current.rows[0];
    const identity='game' in first?first.game:first.player;
    const actor=identity.state==='confirmed'?identity.confirmedBy:'';
    const current=captureManualTarget(draft.values.dataClass,target,draft.schoolSlug,draft.season,actor,catalog);
    if(canonicalRevisionHash(current)!==canonicalRevisionHash(draft.values.current)) blocking.push('Correction target differs from the captured canonical baseline.');
   } catch {blocking.push('Correction target no longer resolves in scope.');}
   if(manualTargetRevision(draft.values.dataClass as 'schedule'|'roster',draft.target.match.state==='confirmed'?draft.target.match.id:'',draft.schoolSlug,draft.season,catalog)!==(draft.target.expectedRevision.state==='known'?draft.target.expectedRevision.value:'')) blocking.push('Correction baseline revision mismatch.');
  }
 }
 const result={validatorVersion:'vv-manual-review-2',managedRosterVersion:catalog.managedRosterVersion??null,draftHash:draftReviewHash(draft),catalogHash:canonicalRevisionHash(catalog),blocking,warnings:[...new Set(warnings)],reviewable:!blocking.length,
  differences:draft.dataClass==='correction'?correctionDifferences(draft):[]};
 return {draft,validation:{...result,validationHash:canonicalRevisionHash(result)}};
}
export function bindActor(draft:IngestionDraft,actor:string):IngestionDraft {
 const copy=structuredClone(draft);
 function visit(v:unknown) { if(!v || typeof v!=='object') return; if('state' in v && v.state==='confirmed' && 'confirmedBy' in v) (v as {confirmedBy:string}).confirmedBy=actor; Object.values(v).forEach(visit); }
 const baseline=copy.dataClass==='correction'?structuredClone(copy.values.current):null;
 visit(copy);if(copy.dataClass==='correction'&&baseline)copy.values.current=baseline as never;copy.disposition='pending';return copy;
}
