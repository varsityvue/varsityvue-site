import assert from "node:assert/strict";
import test from "node:test";
import { getGames, normalizeGameStatus } from "./games";
import { getStandingsForDistrictIdFromGames } from "./standings";
import { getGamePreview } from "@/data/game-previews";
const slugs = ["stephenville", "jarrell", "burnet", "china-spring", "lampasas", "marble-falls"];
// Read-only production snapshot taken Oct. 17. Existing authoritative rows are preserved.
const captured = new Map([
  ["stephenville-vs-canyon-west-plains-2026-week-5", [35,17]],
  ["lampasas-at-stephenville-2026-week-7", [35,14]],
  ["china-spring-at-stephenville-2026-week-8", [55,21]],
]);
const games = getGames().map(g => { const s=captured.get(g.id);return s?{...g,status:"final" as const,homeScore:s[0],awayScore:s[1],score:{home:s[0],away:s[1],period:"Final"}}:g; });
test("six complete ten-game schedules, seven finals and three future district games per team",()=>{
  for(const slug of slugs){
    const rows=games.filter(g=>g.season===2026&&g.gameType!=="bye"&&g.gameType!=="scrimmage"&&(g.homeSchoolSlug===slug||g.awaySchoolSlug===slug));
    assert.equal(rows.length,10,slug);assert.equal(rows.filter(g=>g.status==="final").length,7,slug);
    assert.deepEqual(rows.filter(g=>(g.week??0)>=9).map(g=>g.week).sort((a,b)=>a!-b!),[9,10,11],slug);
    assert.equal(rows.filter(g=>g.districtGame).length,5,slug);
  }
  for(const week of [8,9,10,11])assert.equal(games.filter(g=>g.week===week&&slugs.includes(g.homeSchoolSlug??"")&&slugs.includes(g.awaySchoolSlug??"")).length,3);
  const keys=games.filter(g=>g.gameType!=="bye"&&g.gameType!=="scrimmage").map(g=>`${g.season}|${g.kickoff?.slice(0,10)}|${[g.homeSchoolSlug,g.awaySchoolSlug].sort().join("|")}`);
  assert.equal(new Set(keys).size,keys.length);
});
test("Oct 16 results produce independently reconciled district standings and points",()=>{
  const expected:Record<string,number[]>={stephenville:[7,0,2,0,287,127],jarrell:[7,0,2,0,298,111],burnet:[1,6,1,1,150,270],"china-spring":[1,6,0,2,217,254],lampasas:[2,5,0,2,176,215],"marble-falls":[3,4,1,1,184,194]};
  for(const s of getStandingsForDistrictIdFromGames("4a-d1-district-12",games))assert.deepEqual([s.overallWins,s.overallLosses,s.districtWins,s.districtLosses,s.pointsFor,s.pointsAgainst],expected[s.schoolSlug],s.schoolSlug);
});
test("all remaining district games enter the game-night window, with CST after DST ends",()=>{
  for(const g of games.filter(g=>(g.week??0)>=9&&slugs.includes(g.homeSchoolSlug??"")&&slugs.includes(g.awaySchoolSlug??""))){
    assert.equal(new Intl.DateTimeFormat("en-US",{timeZone:"America/Chicago",hour:"numeric",minute:"2-digit"}).format(new Date(g.kickoff!)),"7:00 PM");
    assert.equal(normalizeGameStatus(g,new Date(Date.parse(g.kickoff!)+60000)).status,"live",g.id);
    if(g.week===11)assert.ok(g.kickoff?.endsWith("-06:00"));
  }
});
test("owner designated GOTW has a factual summary and does not claim a published article",()=>{
 const game=games.find(g=>g.id==="stephenville-at-jarrell-2026-week-9")!;
 assert.equal(game.specialEvent,"Game of the Week");assert.equal(game.coverageStatus,"planned");
 assert.equal(game.kickoff,"2026-10-23T19:00:00-05:00");
 const p=getGamePreview(game.id)!;assert.match(p.excerpt,/7-0 overall and 2-0/);assert.equal(p.coverageHref,undefined);
});
