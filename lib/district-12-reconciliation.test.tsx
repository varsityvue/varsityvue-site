import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import StandingsTable from "@/components/StandingsTable";
import { getGames } from "./games";
import { getStandingsForDistrictIdFromGames } from "./standings";
import { historicalCatalogBeforeDistrict12, retrospectiveDistrict12Results } from "./district-12-test-fixture";
import { pilotGate } from "./game-discovery";
import { resolveGameLocation, toDiscoveryGame } from "./game-location";
import { venues } from "@/data/venues";
import { schoolFootballVenues } from "@/data/school-football-venues";
import { gameVenueOverrides } from "@/data/game-venue-overrides";

const expected = {
  burnet: [1, 5, 1, 0, 134, 236], jarrell: [6, 0, 1, 0, 257, 88],
  stephenville: [6, 0, 1, 0, 232, 106], "china-spring": [1, 5, 0, 1, 196, 199],
  lampasas: [2, 4, 0, 1, 153, 174], "marble-falls": [2, 4, 0, 1, 150, 178],
};
const base = getGames();
// Read-only captured finals; the mounted browser test exercises the real public RPC overlay.
const captured = new Map([
  ["stephenville-at-abilene-wylie-2026-week-4", {home:23,away:42}],
  ["stephenville-vs-canyon-west-plains-2026-week-5", {home:35,away:17}],
  ["lampasas-at-stephenville-2026-week-7", {home:35,away:14}],
]);
const games = base.map(g => { const s = captured.get(g.id); return s ? {...g,status:"final" as const,homeScore:s.home,awayScore:s.away,score:{...s,period:"Final"}} : g; });

test("District 12 has six independently reconciled records, PF/PA and six completed historical games each", () => {
  historicalCatalogBeforeDistrict12(base);
  assert.equal(retrospectiveDistrict12Results.length, 12);
  const standings = getStandingsForDistrictIdFromGames("4a-d1-district-12", games.filter(g => (g.week ?? 0) <= 7));
  assert.equal(standings.length, 6);
  for (const s of standings) {
    assert.deepEqual([s.overallWins,s.overallLosses,s.districtWins,s.districtLosses,s.pointsFor,s.pointsAgainst], expected[s.schoolSlug as keyof typeof expected]);
    const finals = games.filter(g => g.season===2026 && g.gameType!=="bye" && g.gameType!=="scrimmage" && g.status==="final" && g.week!==undefined && g.week<=7 && (g.homeSchoolSlug===s.schoolSlug || g.awaySchoolSlug===s.schoolSlug));
    assert.equal(finals.length, 6, s.schoolSlug);
    assert.equal(finals.filter(g=>g.districtGame).length, 1, s.schoolSlug);
  }
  const keys = games.filter(g=>g.gameType!=="bye"&&g.gameType!=="scrimmage").map(g=>`${g.season}|${g.kickoff?.slice(0,10)}|${[g.homeSchoolSlug,g.awaySchoolSlug].sort().join("|")}`);
  assert.equal(new Set(keys).size, keys.length);
});

test("mounted standings renderer emits tied positions and precise district/overall/PF/PA values", () => {
  const standings=getStandingsForDistrictIdFromGames("4a-d1-district-12",games.filter(g => (g.week ?? 0) <= 7));
  const html=renderToStaticMarkup(<StandingsTable standings={standings} theme={{primary:"#6c122d",secondary:"#ffffff",accent:"#000000"}}/>);
  assert.equal((html.match(/>T-1</g)??[]).length,6);
  assert.equal((html.match(/>T-4</g)??[]).length,6);
  for(const s of standings){assert.ok(html.includes(`${s.overallWins}-${s.overallLosses}`));assert.ok(html.includes(`>${s.pointsFor}<`));assert.ok(html.includes(`>${s.pointsAgainst}<`));}
  assert.match(html,/does not apply unofficial district tiebreakers/);
});

test("Week 7 exact 19-game gate and expanded Week 8/9 exact gates reject omissions, duplicates and unverifiable locations", () => {
  const dto=base.map(g=>toDiscoveryGame(g,resolveGameLocation(g,venues,schoolFootballVenues,gameVenueOverrides)));
  for(const [week,total] of [[7,19],[8,19],[9,19]]){
    assert.deepEqual(pilotGate(dto,week),{enabled:true,total,unresolved:0});
    const g=dto.find(g=>g.week===week)!;
    assert.equal(pilotGate(dto.filter(x=>x.gameId!==g.gameId),week).enabled,false);
    assert.equal(pilotGate([...dto,g],week).enabled,false);
    assert.equal(pilotGate(dto.map(x=>x.gameId===g.gameId?{...x,location:{locationQuality:"unavailable" as const,reason:"missing_venue" as const}}:x),week).enabled,false);
  }
  const china=dto.find(g=>g.gameId==="burnet-at-china-spring-2026-week-7")!;
  assert.equal(china.location.locationQuality,"verified");
  assert.ok(schoolFootballVenues["china-spring"]);
  assert.equal(base.filter(g=>g.week===8&&["china-spring","burnet","jarrell","marble-falls","lampasas","stephenville"].includes(g.homeSchoolSlug??"")&&["china-spring","burnet","jarrell","marble-falls","lampasas","stephenville"].includes(g.awaySchoolSlug??"")).length,3,"all Week 8 district matchups are present");
});
