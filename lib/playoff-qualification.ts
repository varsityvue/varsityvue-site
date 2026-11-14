import type { Game } from "@/types/platform";
import { verifiedWinner } from "@/lib/playoff-bracket-advancement";

export type QualificationState = "projected" | "confirmed" | "published";
export type Evidence = { source: string; reviewedBy: string; reviewedAt: string };
export type SeedSlot = { id: string; region: number; district: number; finish: 1|2|3|4; firstRoundGame: number; side: 0|1 };
export type BracketTemplate = { schemaVersion: 1; version: number; season: number; division: string; slots: SeedSlot[]; evidence: Evidence | null };
export type Qualifier = { slotId: string; schoolSlug: string; state: QualificationState; tiebreaker: "resolved" | "review-required"; history: {state:QualificationState;evidence:Evidence}[] };
const validEvidence=(e:Evidence|null)=>Boolean(e?.source.trim() && e.reviewedBy.trim() && Number.isFinite(Date.parse(e.reviewedAt)));
export function validateTemplate(template:BracketTemplate) {
 const errors:string[]=[];
 if(template.schemaVersion!==1 || !Number.isInteger(template.version) || template.version<1 || !Number.isInteger(template.season) || !template.division.trim())errors.push("Invalid template version, season or division");
 if(template.slots.length!==64)errors.push("64 participant slots required");
 if(!validEvidence(template.evidence))errors.push("Official source and human review required");
 const ids=new Set<string>(),seeds=new Set<string>(),positions=new Set<string>();
 for(const slot of template.slots){
  const seed=`${slot.district}-${slot.finish}`,position=`${slot.region}-${slot.firstRoundGame}-${slot.side}`;
  if(ids.has(slot.id)||seeds.has(seed)||positions.has(position))errors.push(`Duplicate slot: ${slot.id}`);
  ids.add(slot.id);seeds.add(seed);positions.add(position);
  if(!slot.id || !Number.isInteger(slot.region)||slot.region<0||slot.region>3||!Number.isInteger(slot.district)||slot.district<slot.region*4+1||slot.district>slot.region*4+4||![1,2,3,4].includes(slot.finish)||!Number.isInteger(slot.firstRoundGame)||slot.firstRoundGame<0||slot.firstRoundGame>7||![0,1].includes(slot.side))errors.push(`Invalid slot: ${slot.id}`);
 }
 return errors;
}
export function transitionQualifier(qualifier:Qualifier,next:QualificationState,evidence:Evidence,template:BracketTemplate):Qualifier {
 if(validateTemplate(template).length || !template.slots.some(s=>s.id===qualifier.slotId))throw new Error("Validated reviewed template required");
 const allowed=qualifier.state==="projected"?"confirmed":qualifier.state==="confirmed"?"published":null;
 if(next!==allowed||qualifier.tiebreaker!=="resolved"||!validEvidence(evidence)||!qualifier.schoolSlug.trim())throw new Error("Explicit sequential review required");
 return {...qualifier,state:next,history:[...qualifier.history,{state:next,evidence}]};
}
/** Schedule is scoped by season-specific membership. No display ranking becomes an official seed. */
export function projectDistrictQualifiers(season:number,members:readonly string[],games:Game[]) {
 const memberSet=new Set(members);
 const districtGames=games.filter(g=>g.season===season&&g.districtGame&&g.gameType!=="playoff"&&g.homeSchoolSlug&&g.awaySchoolSlug&&memberSet.has(g.homeSchoolSlug)&&memberSet.has(g.awaySchoolSlug));
 const exceptions:string[]=[];
 for(let a=0;a<members.length;a++)for(let b=a+1;b<members.length;b++){
  const matches=districtGames.filter(g=>[g.homeSchoolSlug,g.awaySchoolSlug].includes(members[a])&&[g.homeSchoolSlug,g.awaySchoolSlug].includes(members[b]));
  if(matches.length!==1 || !verifiedWinner(matches[0]))exceptions.push(`Review result: ${members[a]} / ${members[b]}`);
 }
 const rows=members.map(schoolSlug=>({schoolSlug,wins:0,losses:0,projectedFinish:null as number|null,tiebreaker:"review-required" as "resolved"|"review-required"}));
 for(const game of districtGames){const winner=verifiedWinner(game);if(!winner)continue;for(const row of rows){if(row.schoolSlug===game.homeSchoolSlug||row.schoolSlug===game.awaySchoolSlug){if((row.schoolSlug===game.homeSchoolSlug?game.homeTeam:game.awayTeam)===winner)row.wins++;else row.losses++;}}}
 rows.sort((a,b)=>b.wins-a.wins||a.losses-b.losses||a.schoolSlug.localeCompare(b.schoolSlug));
 if(!exceptions.length)for(let i=0;i<rows.length;i++){
  const tied=rows.filter(r=>r.wins===rows[i].wins&&r.losses===rows[i].losses);
  if(tied.length===1){rows[i].projectedFinish=i+1;rows[i].tiebreaker="resolved";}else exceptions.push(`District procedure review: ${tied.map(t=>t.schoolSlug).join(", ")}`);
 }
 return {rows,exceptions:[...new Set(exceptions)],ready:exceptions.length===0,state:"projected" as const};
}
export function seedLabel(slot:Pick<SeedSlot,"district"|"finish">){return `${["W","R","T","F"][slot.finish-1]}${slot.district}`;}
