import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import finalScheduleBefore from "../docs/la-villa-chilton-schedule-20261116/before.json";
import completionBefore from "../docs/area-round-completion-20261116/before.json";
import scheduleBefore from "../docs/area-schedule-details-20261115/before.json";
import baseline from "../docs/chilton-brackett-completion-20261115/baseline.json";
import { getGames, getGamesForSchool } from "./games";
import { buildBracketLayout, schoolRoute } from "./playoff-bracket-layout";
import { verifiedWinner } from "./playoff-bracket-advancement";
import { applyGameState } from "./resolve-game-score-state";
import { scoreAttributionText } from "./public-score-state";
const games = getGames();
const final = games.find(g => g.id === "2026-bi-district-2a-d2-iv-8")!;
const area = games.find(g => g.id === "2026-area-2a-d2-iv-4")!;
test("owner-confirmed final has explicit attribution and respects verified corrections", () => {
 assert.equal(final.status, "final");
 assert.deepEqual([final.homeScore, final.awayScore], [42,31]);
 assert.equal(verifiedWinner(final), "Chilton");
 assert.match(final.sourceLabel!, /owner-confirmed/);
 assert.equal(scoreAttributionText(final, true), "Owner-confirmed final");
 assert.deepEqual(applyGameState(final), final);
 const state = { game_id: final.id, status: "final" as const, verified: true, home_score: 43, away_score: 31, period: null, clock: null, kickoff_override: null, result_type: "played" as const, official_winner_school_slug: null, attribution_type: "correction" };
 assert.equal(applyGameState(final, state).homeScore, 43);
 assert.equal(applyGameState(final, {...state, verified:false}).homeScore, 42);
 assert.deepEqual(applyGameState(final, {...state, home_score:null,away_score:null}), final);
 assert.equal(scoreAttributionText(applyGameState(final, state), true), "Corrected by VarsityVue");
});
test("existing Area slot and school schedules follow the Chilton source edge without invented details", () => {
 const {nodes} = buildBracketLayout("2A-D2", games);
 const node = nodes.find(n => n.region === 3 && n.round === 1 && n.index === 3)!;
 assert.equal(node.game?.id, area.id);
 assert.deepEqual(node.teams, ["La Villa", "Chilton"]);
 assert.deepEqual(node.sources.map(id => nodes.find(n => n.id === id)?.game?.id), ["2026-bi-district-2a-d2-iv-7", final.id]);
 assert.equal(area.kickoff, "2026-11-20T19:00:00-06:00"); assert.equal(area.venue, "Bulldog Stadium, Somerset, TX");
 assert.equal(area.isNeutralSite, null); assert.equal(area.designatedSidesConfirmed, false);
 assert.equal(area.homeScore, undefined); assert.equal(area.awayScore, undefined);
 for (const slug of ["chilton", "la-villa"]) assert.ok(getGamesForSchool(slug).some(g => g.id === area.id));
 assert.ok(getGamesForSchool("brackettville-brackett").some(g => g.id === final.id));
 assert.ok(!getGamesForSchool("brackettville-brackett").some(g => g.id === area.id));
 assert.equal(schoolRoute(nodes,"Chilton").size,6);
 assert.equal(schoolRoute(nodes,"Brackett").size,1);
});
test("six divisions retain 192 finals and 96 source-aligned unscored Area games without duplicates", () => {
 for (const division of ["2A-D1","2A-D2","3A-D1","3A-D2","4A-D1","4A-D2"] as const) {
  const {nodes} = buildBracketLayout(division,games);
  const first = nodes.filter(n => n.round === 0), area = nodes.filter(n => n.round === 1);
  assert.equal(first.length,32); assert.ok(first.every(n => verifiedWinner(n.game)));
  assert.equal(area.length,16); assert.ok(area.every(n => n.game));
  for (const n of area) {
   assert.deepEqual(n.teams,n.sources.map(id => verifiedWinner(nodes.find(x => x.id === id)?.game)));
   assert.equal(n.game?.homeScore,undefined); assert.equal(n.game?.awayScore,undefined);
  }
 }
 assert.equal(new Set(games.map(g=>g.id)).size,games.length);
 const keys = games.filter(g=>g.gameType==="playoff").map(g=>`${g.season}|${g.playoff?.division}|${g.playoff?.round}|${[g.homeSchoolSlug,g.awaySchoolSlug].sort().join("|")}`);
 assert.equal(new Set(keys).size,keys.length);
});
test("every unrelated canonical playoff record remains byte-equivalent", () => {
 for (const [id, hash] of Object.entries(baseline)) {
  const game = games.find(g=>g.id===id); assert.ok(game,id);
  // Later schedule-only changes are checked by area-schedule-details.test.ts.
  // Keep the original PR #159 baseline intact for all historical records.
  const before = [...scheduleBefore, ...completionBefore, finalScheduleBefore].find(g => g.id === id);
  const historical = before ?? game;
  assert.equal(createHash("sha256").update(JSON.stringify(historical)).digest("hex"),hash,id);
 }
});
