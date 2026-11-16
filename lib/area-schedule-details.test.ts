import test from "node:test";
import assert from "node:assert/strict";
import before from "../docs/area-schedule-details-20261115/before.json";
import { getGames, getGamesForSchool } from "./games";
import { getAreaRoundReadiness } from "./area-round-readiness";
const games = getGames();
const withoutSchedule = (game: Record<string, unknown>) => Object.fromEntries(Object.entries(game).filter(([key]) => !["kickoff", "venue", "sourceLabel"].includes(key)));
test("two sourced Area schedule updates preserve identities, results and school schedules", () => {
 for (const old of before) {
  const game = games.find(g => g.id === old.id)!;
  assert.deepEqual(withoutSchedule({...game}), withoutSchedule({...old}));
  for (const slug of [old.homeSchoolSlug, old.awaySchoolSlug]) assert.ok(getGamesForSchool(slug).some(g => g.id === old.id));
 }
 const tulia = games.find(g => g.id === "2026-area-2a-d1-i-2")!;
 assert.equal(tulia.kickoff, "2026-11-20T19:00:00-06:00");
 assert.equal(tulia.venue, "J. M. King Memorial Stadium, Midland, TX");
 assert.match(tulia.sourceLabel!, /presspass.news/);
 const diboll = games.find(g => g.id === "2026-area-3a-d1-iii-1")!;
 assert.equal(diboll.kickoff, "2026-11-20T19:30:00-06:00");
 assert.equal(diboll.venue, "Mustang Stadium, Madisonville, TX");
 assert.match(diboll.sourceLabel!, /lorenaisd.net/);
 const queue = getAreaRoundReadiness(games);
 assert.equal(queue.filter(g => g.status === "scheduled").length, 95);
 assert.deepEqual(queue.filter(g => g.status !== "scheduled").map(g=>g.gameId), ["2026-area-2a-d2-iv-4"]);
});
