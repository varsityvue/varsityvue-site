import test from "node:test";
import assert from "node:assert/strict";
import { getGames, getGamesForSchool } from "./games";
import { buildBracketLayout, schoolRoute } from "./playoff-bracket-layout";
import { verifiedWinner } from "./playoff-bracket-advancement";
import { applyGameState } from "./resolve-game-score-state";
import { resolveBracketSchool } from "./playoff-school-catalog";
import { template3AD12026 } from "../data/playoff-template-3ad1-2026";
import { validateTemplate, seedLabel } from "./playoff-qualification";
import { playoff3AD1FirstRound, playoff3AD1Area } from "../data/playoff-3ad1-completion-20261114";
import { compareGameChronology, orderPlayedFinals } from "./recent-results";
const games = getGames();
const { nodes } = buildBracketLayout("3A-D1", games);

test("3A DI publishes all 32 unique first-round finals through the canonical school catalog", () => {
 const first = nodes.filter(n => n.round === 0);
 assert.equal(first.length,32);
 assert.equal(new Set(first.map(n=>n.game?.id)).size,32);
 assert.equal(first.filter(n=>verifiedWinner(n.game)).length,32);
 for(const node of first) for(const name of node.teams){
  const school=resolveBracketSchool(name!,"3A-D1",["I","II","III","IV"][node.region]);
  assert.ok(school,`${name} resolves in its region`);
  assert.ok(getGamesForSchool(school.slug).some(g=>g.id===node.game!.id));
 }
});
test("all sixteen Area opponents follow verified UIL topology and have no speculative scores",()=>{
 const area=nodes.filter(n=>n.round===1);
 assert.equal(area.filter(n=>n.game).length,16);
 for(const node of area){
  assert.deepEqual(node.teams,node.sources.map(id=>verifiedWinner(nodes.find(n=>n.id===id)?.game)));
  assert.equal(verifiedWinner(node.game),null);
 }
 assert.equal(schoolRoute(nodes,"Clyde").size,6);
 assert.equal(schoolRoute(nodes,"Denver City").size,1);
 assert.equal(nodes.filter(n=>n.round>1).flatMap(n=>n.teams).filter(Boolean).length,0);
 assert.ok(playoff3AD1Area.every(g=>!g.publicScoreVerified&&g.homeScore===undefined&&g.awayScore===undefined));
});
test("reviewed score conflicts are explicit and authoritative corrections retain precedence",()=>{
 for(const [id,home,away] of [["2026-bi-district-3a-d1-i-8",50,35],["2026-bi-district-3a-d1-iii-1",42,7]] as const){
  const game=games.find(g=>g.id===id)!;
  assert.deepEqual([game.homeScore,game.awayScore],[home,away]);
  const corrected=applyGameState(game,{game_id:id,status:"final",verified:true,home_score:home+1,away_score:away,period:null,clock:null,kickoff_override:null,result_type:"played",official_winner_school_slug:null});
  assert.equal(corrected.homeScore,home+1);
 }
 assert.equal(playoff3AD1Area.find(g=>g.homeTeam==="Diboll")?.kickoff,"2026-11-20");
});
test("reviewed 3A DI seeds cover every district finishing position exactly once",()=>{
 assert.deepEqual(validateTemplate(template3AD12026),[]);
 assert.equal(template3AD12026.slots.length,64);
 for(let region=0;region<4;region++){
  const seeds=template3AD12026.slots.filter(s=>s.region===region).map(seedLabel);
  assert.equal(new Set(seeds).size,16);
  assert.ok(seeds.includes(`W${region*4+1}`));
 }
});
test("canonical expansion does not duplicate games or regress either completed 2A division",()=>{
 const all=games.filter(g=>g.playoff?.division==="3A Division I");
 const keys=all.map(g=>`${g.season}|${g.playoff?.round}|${[g.homeSchoolSlug,g.awaySchoolSlug].sort().join("|")}`);
 assert.equal(new Set(keys).size,keys.length);
 assert.equal(playoff3AD1FirstRound.length,32);assert.equal(playoff3AD1Area.length,16);
 for(const [division,finals,areas] of [["2A-D1",32,16],["2A-D2",32,16]] as const){
  const layout=buildBracketLayout(division,games);
  assert.equal(layout.nodes.filter(n=>n.round===0&&verifiedWinner(n.game)).length,finals);
  assert.equal(layout.nodes.filter(n=>n.round===1&&n.game).length,areas);
 }
});

test("unknown playoff kickoff cannot hide Clyde’s newest verified result behind September",()=>{
 const clyde=getGamesForSchool("clyde").filter(g=>g.status==="final");
 const recent=[...clyde].sort((a,b)=>compareGameChronology(b,a));
 assert.equal(recent[0].id,"2026-bi-district-3a-d1-i-3");
 assert.equal(recent[0].kickoff,undefined);
 assert.equal(orderPlayedFinals(clyde).at(-1)?.id,recent[0].id);
});
