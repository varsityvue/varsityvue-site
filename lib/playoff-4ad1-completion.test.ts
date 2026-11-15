import test from "node:test";
import assert from "node:assert/strict";
import { getGames, getGamesForSchool } from "./games";
import { buildBracketLayout, schoolRoute } from "./playoff-bracket-layout";
import { verifiedWinner } from "./playoff-bracket-advancement";
import { resolveBracketSchool } from "./playoff-school-catalog";
import { template4AD12026 } from "../data/playoff-template-4ad1-2026";
import { validateTemplate, seedLabel } from "./playoff-qualification";
import { playoff4AD1FirstRound, playoff4AD1Area } from "../data/playoff-4ad1-completion-20261115";
const games=getGames();const {nodes}=buildBracketLayout("4A-D1",games);

test("all 64 4A DI participants have canonical school schedules and 32 unique verified finals",()=>{
 const first=nodes.filter(n=>n.round===0);assert.equal(first.length,32);
 assert.equal(new Set(first.map(n=>n.game?.id)).size,32);
 assert.equal(first.filter(n=>verifiedWinner(n.game)).length,32);
 for(const n of first)for(const name of n.teams){
  const school=resolveBracketSchool(name!,"4A-D1",["I","II","III","IV"][n.region]);assert.ok(school,`${n.region}|${name}`);
  assert.ok(getGamesForSchool(school.slug).some(g=>g.id===n.game!.id));
 }
 assert.equal(resolveBracketSchool("Sterling","4A-D1","III")?.slug,"houston-sterling");
 assert.notEqual(resolveBracketSchool("Austin","4A-D1","I")?.slug,resolveBracketSchool("Austin","4A-D1","III")?.slug);
});
test("all sixteen Area opponents follow verified UIL source edges with no speculative scores",()=>{
 const area=nodes.filter(n=>n.round===1);assert.equal(area.filter(n=>n.game).length,16);
 for(const n of area){assert.deepEqual(n.teams,n.sources.map(id=>verifiedWinner(nodes.find(x=>x.id===id)?.game)));assert.equal(verifiedWinner(n.game),null);}
 assert.equal(schoolRoute(nodes,"Stephenville").size,6);assert.equal(schoolRoute(nodes,"Navasota").size,1);
 assert.equal(nodes.filter(n=>n.round>1).flatMap(n=>n.teams).filter(Boolean).length,0);
 assert.ok(playoff4AD1Area.every(g=>!g.publicScoreVerified&&g.homeScore===undefined&&g.awayScore===undefined&&g.kickoff&&g.venue&&g.isNeutralSite===null&&!g.designatedSidesConfirmed));
});
test("reviewed seeds preserve T16 Zapata above R15 Miller in UIL G28",()=>{
 assert.deepEqual(validateTemplate(template4AD12026),[]);assert.equal(template4AD12026.slots.length,64);
 const g28=template4AD12026.slots.filter(s=>s.region===3&&s.firstRoundGame===3).sort((a,b)=>a.side-b.side);
 assert.deepEqual(g28.map(seedLabel),["T16","R15"]);
 assert.deepEqual(nodes.find(n=>n.region===3&&n.round===0&&n.index===3)?.teams,["Zapata","Miller"]);
});
test("existing canonical IDs and all completed divisions remain available without duplicate matchups",()=>{
 assert.equal(nodes.find(n=>n.region===2&&n.round===0&&n.index===6)?.game?.id,"stephenville-vs-navasota-2026-bi-district");
 for(const division of ["2A-D1","2A-D2","3A-D1","3A-D2","4A-D1"]){
  const layout=buildBracketLayout(division,games);const first=layout.nodes.filter(n=>n.round===0);
  assert.equal(first.filter(n=>verifiedWinner(n.game)).length,division==="2A-D2"?31:32);
  const matches=layout.nodes.flatMap(n=>n.game?[n.game]:[]);const keys=matches.map(g=>`${g.season}|${g.playoff?.round}|${[g.homeSchoolSlug,g.awaySchoolSlug].sort().join("|")}`);
  assert.equal(new Set(keys).size,keys.length,division);
 }
 assert.equal(playoff4AD1FirstRound.length,32);assert.equal(playoff4AD1Area.length,16);
 assert.equal(playoff4AD1FirstRound.find(g=>g.id==="2026-bi-district-4a-d1-iii-2")?.awayScore,31);
});
