import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import AreaLeaders from "@/components/AreaLeaders";
import { ownerWeek7GameStats } from "@/data/owner-week7-game-stats";
import { playerProfiles } from "@/data/player-profiles";
import { getCategoryCompleteness } from "@/data/stat-completeness";
import { gameStats } from "@/lib/all-game-stats";
import { getGames } from "@/lib/games";
import { validateGameStats } from "@/lib/game-stats-validation";
import { getPlayerGameLog } from "@/lib/player-game-log";
import { getPlayerId } from "@/lib/player-identity";
import { getPlayerSeasonStat, getPassingLeaders, getRushingLeaders, getReceivingLeaders } from "@/lib/player-stats";
import { reconcileStatCatalogs } from "@/lib/stat-reconciliation";

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([,v]) => v !== undefined).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => [k,stable(v)]));
  return value;
}
const suppliedSchools = new Set(["goldthwaite", "comanche", "de-leon", "albany", "stamford", "stephenville", "cisco"]);

test("exact owner payload preserved; six canonical matchups integrate once without opponent statistics", () => {
  assert.equal(ownerWeek7GameStats.length, 6);
  const payload = ownerWeek7GameStats.map(({gameId,season,quarterScores,scoringPlays,teamStats,passing,rushing,receiving}) => ({gameId,season,quarterScores,scoringPlays,teamStats,passing,rushing,receiving}));
  assert.equal(createHash("sha256").update(JSON.stringify(stable(payload))).digest("hex"), "8fd417c42f7453acc8cfc7425ca724d2142735c7453e4ffadf52e417240e411d");
  assert.equal(payload.reduce((n,g) => n+g.passing.length+g.rushing.length+g.receiving.length,0),68);
  for (const stats of ownerWeek7GameStats) {
    const canonical = getGames().find(g => g.id === stats.gameId);
    assert.ok(canonical); assert.equal(canonical.week,7); assert.equal(canonical.season,2026);
    assert.equal(gameStats.filter(g => g.gameId === stats.gameId).length,1);
    const participants = new Set([canonical.homeSchoolSlug,canonical.awaySchoolSlug]);
    assert.ok([...stats.passing,...stats.rushing,...stats.receiving,...stats.teamStats].every(l => participants.has(l.schoolSlug) && suppliedSchools.has(l.schoolSlug)));
    const pair = [...participants].sort().join("|");
    assert.equal(gameStats.filter(g => g.season === 2026 && /-week-7(?:$|-)/.test(g.gameId) && g.quarterScores.map(q => q.schoolSlug).sort().join("|") === pair).length,1);
    assert.deepEqual(validateGameStats(stats).filter(i => i.level === "error"),[]);
  }
  const targetIds = new Set(ownerWeek7GameStats.map(g => g.gameId));
  assert.deepEqual(reconcileStatCatalogs({coreStats:gameStats.filter(g => targetIds.has(g.gameId)),extendedStats:[],canonicalGames:getGames(),playerProfiles}).errors,[]);
  const aggregator = readFileSync("lib/all-game-stats.ts","utf8");
  assert.equal(aggregator.match(/\.\.\.ownerWeek7GameStats/g)?.length,1);
});

test("canonical Millsap home identity and independent supplied discrepancies remain explicit", () => {
  assert.equal(getGames().find(g => g.id === "comanche-at-millsap-2026-week-7")?.homeSchoolSlug,"millsap");
  for (const [id,school,passing,receiving] of [
    ["comanche-at-millsap-2026-week-7","comanche",141,128],
    ["de-leon-at-hawley-2026-week-7","de-leon",101,105],
    ["albany-at-stamford-2026-week-7","stamford",305,303],
  ] as const) {
    const g=ownerWeek7GameStats.find(g=>g.gameId===id)!;
    assert.equal(g.passing.filter(l=>l.schoolSlug===school).reduce((n,l)=>n+l.yards,0),passing);
    assert.equal(g.receiving.filter(l=>l.schoolSlug===school).reduce((n,l)=>n+l.yards,0),receiving);
    assert.equal(getCategoryCompleteness(g,school,"receiving").status,"partial");
  }
});

test("blank TD/INT stays unknown and De Leon's five TDs belong only to Lane Couch rushing", () => {
  const rows=ownerWeek7GameStats.flatMap(g=>[...g.passing,...g.rushing,...g.receiving]);
  assert.equal(rows.filter(l=>l.touchdowns===undefined).length,19);
  assert.equal(ownerWeek7GameStats.flatMap(g=>g.passing).filter(l=>l.interceptions===undefined).length,3);
  const g=ownerWeek7GameStats.find(g=>g.gameId==="de-leon-at-hawley-2026-week-7")!;
  assert.equal(g.rushing.find(l=>l.player==="Lane Couch")?.touchdowns,5);
  assert.ok([...g.passing,...g.receiving,...g.rushing.filter(l=>l.player!=="Lane Couch")].every(l=>l.touchdowns===0));
  assert.equal(g.receiving.find(l=>l.player==="Lane Couch")?.touchdowns,0);
  assert.equal(getPlayerSeasonStat(getPlayerId("comanche","Cooper Welch",2026))?.passing.interceptions,undefined);
});

test("Goldthwaite touchdown-only plays are partial and preserve nine PATs as evidence", () => {
  const g=ownerWeek7GameStats.find(g=>g.gameId==="hamlin-at-goldthwaite-2026-week-7")!;
  assert.equal(g.scoringPlays.length,9);assert.ok(g.scoringPlays.every(p=>p.clock===undefined));
  const detail=getCategoryCompleteness(g,"goldthwaite","scoringPlays");
  assert.equal(detail.status,"partial");assert.match(detail.note??"",/nine Blake Howard PATs/);
  assert.equal(g.quarterScores.find(q=>q.schoolSlug==="goldthwaite")?.total,63);
});

test("season leaders incorporate weekly additions and retain existing player IDs", async () => {
  assert.deepEqual(getPassingLeaders({minAttempts:1}).slice(0,3).map(p=>[p.player,p.passing.yards]),[["Miles Follis",2388],["Trot Jordan",1926],["Colby McIlroy",1124]]);
  assert.deepEqual(getRushingLeaders({minAttempts:1}).slice(0,3).map(p=>[p.player,p.rushing.yards]),[["Lane Couch",1440],["Landry Sanderson",923],["Zyler McClendon",682]]);
  assert.deepEqual(getReceivingLeaders({minReceptions:1}).slice(0,3).map(p=>[p.player,p.receiving.yards]),[["Caden Monk",940],["Levi Vahlenkamp",868],["Slayden Young",704]]);
  const id=getPlayerId("de-leon","Lane Couch",2026),player=getPlayerSeasonStat(id)!;
  assert.equal(player.rushing.yards+player.receiving.yards,1447);
  const log=await getPlayerGameLog(id,2026,getGames());
  const week7=log.filter(g=>g.gameId==="de-leon-at-hawley-2026-week-7");assert.equal(week7.length,1);
  assert.equal(week7[0].rushing?.yards,291);assert.equal(week7[0].rushing?.touchdowns,5);
  const slayden=getPlayerSeasonStat(getPlayerId("stamford","Slayden Young",2026))!;
  assert.equal(slayden.receiving.touchdowns,undefined);assert.equal(slayden.rushing.touchdowns,undefined);
});

test("homepage Area Leaders renders calculated all-purpose and partial total TD values", () => {
  const html=renderToStaticMarkup(AreaLeaders());
  for(const value of ["Area Leaders","All-Purpose","Total TDs","Hayes Greenway","Miles Follis","Trot Jordan","1,447","1,018","1,048","29+"]) assert.ok(html.includes(value),value);
  assert.match(html,/Partial coverage/);
});

test("owner-confirmed Tomas Ferrera receiving zero remains explicit without roster changes", () => {
  const g = ownerWeek7GameStats.find(g => g.gameId === "hamlin-at-goldthwaite-2026-week-7")!;
  const rows = g.receiving.filter(l => l.schoolSlug === "goldthwaite" && l.player === "Tomas Ferrera");
  assert.equal(rows.length, 1);
  assert.equal(rows[0].receptions, 1);
  assert.equal(rows[0].yards, 0);
  assert.equal(rows[0].touchdowns, 0);
});
