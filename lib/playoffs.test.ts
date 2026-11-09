import assert from "node:assert/strict";
import test from "node:test";
import { getGames, getGamesForSchool } from "@/lib/games";
import { formatPlayoffKickoff, getPlayoffSchedule } from "@/lib/playoffs";

const beforeKickoff = new Date("2026-11-09T00:00:00Z");
const games = getGames();
const playoffs = getPlayoffSchedule(games, beforeKickoff);
const stephenville = playoffs.find(({ game }) => game.homeSchoolSlug === "stephenville")!.game;

test("postseason catalog has unique neutral-site games shared by the school schedule", () => {
  assert.equal(playoffs.length, 7);
  assert.equal(new Set(playoffs.map(({ game }) => [game.homeSchoolSlug, game.awaySchoolSlug].sort().join("|"))).size, playoffs.length);
  assert.ok(playoffs.every(({ game }) => game.isNeutralSite && !game.districtGame && game.playoff?.round === "Bi-District"));
  assert.equal(stephenville.venue, "Wildcat Stadium, Temple");
  assert.ok(getGamesForSchool("stephenville", beforeKickoff).some(({ id }) => id === stephenville.id));
  assert.equal(playoffs[0].game.kickoff?.slice(0, 10), "2026-11-12");
});

test("playoff presentation separates verified scores from scheduled and unresolved games", () => {
  const [pending] = getPlayoffSchedule([stephenville], new Date("2026-11-14T07:00:00Z"));
  assert.equal(pending.presentation.kind, "awaiting_verification");
  assert.equal(pending.presentation.showScore, false);
  const [final] = getPlayoffSchedule([{ ...stephenville, status: "final", homeScore: 0, awayScore: 7 }]);
  assert.equal(final.presentation.kind, "verified_final");
  assert.equal(final.presentation.showScore, true);
  const [postponed] = getPlayoffSchedule([{ ...stephenville, status: "postponed" }]);
  assert.equal(postponed.presentation.kind, "postponed");
});

test("playoff kickoff displays Central time without inventing times for date-only entries", () => {
  assert.match(formatPlayoffKickoff("2026-11-14T01:00:00Z"), /Fri, Nov 13 · 7:00 PM CST/);
  assert.match(formatPlayoffKickoff("2026-11-13"), /Fri, Nov 13 · Time TBD/);
  assert.equal(formatPlayoffKickoff("2026-02-30"), "Kickoff TBD");
  assert.equal(formatPlayoffKickoff("unknown"), "Kickoff TBD");
});
