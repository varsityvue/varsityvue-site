import assert from "node:assert/strict";
import test from "node:test";

import { getGames } from "./games";
import { orderPlayedFinals } from "./recent-results";
import { fridaySevenCentralForGame } from "./pickem-close";
import { isPickemWeekClosed } from "./pickem-week-state";
import { liveGameContext, normalizeLivePeriod } from "./live-period";

function sequence(slug: string) {
  const confirmed = new Map([
    ["de-leon-at-goldthwaite-2026-week-4", [13, 24]],
    ["early-at-de-leon-2026-week-5", [20, 51]],
    ["cisco-at-stamford-2026-week-4", [7, 27]],
    ["jacksboro-at-cisco-2026-week-5", [42, 49]],
  ]);
  const games = getGames().map((game) => {
    const scores = confirmed.get(game.id);
    return scores ? { ...game, status: "final" as const, awayScore: scores[0], homeScore: scores[1] } : game;
  });
  return orderPlayedFinals(games.filter((game) => game.homeSchoolSlug === slug || game.awaySchoolSlug === slug))
    .slice(-5).map((game) => {
      const own = game.homeSchoolSlug === slug ? game.homeScore! : game.awayScore!;
      const other = game.homeSchoolSlug === slug ? game.awayScore! : game.homeScore!;
      return own > other ? "W" : own < other ? "L" : "T";
    }).join(" ");
}

test("Last 5 is oldest to newest, independent of source order", () => {
  assert.equal(sequence("de-leon"), "W W W L W");
  assert.equal(sequence("cisco"), "L W W L W");
  const reversed = getGames().filter((game) => [game.homeSchoolSlug, game.awaySchoolSlug].includes("cisco")).reverse();
  assert.deepEqual(orderPlayedFinals(reversed).map((game) => game.id), orderPlayedFinals([...reversed].reverse()).map((game) => game.id));
});

test("weekly close is an absolute Central Friday 7 PM instant across DST", () => {
  assert.equal(fridaySevenCentralForGame("2026-09-25T19:00:00-05:00"), "2026-09-26T00:00:00.000Z");
  assert.equal(fridaySevenCentralForGame("2026-11-06T19:00:00-06:00"), "2026-11-07T01:00:00.000Z");
  const week = { status: "open", closes_at: "2026-09-26T00:00:00Z" };
  assert.equal(isPickemWeekClosed(week, new Date("2026-09-25T23:59:59Z")), false);
  assert.equal(isPickemWeekClosed(week, new Date("2026-09-26T00:00:00Z")), true);
});

test("live period is canonical and unknown clocks are omitted", () => {
  assert.equal(normalizeLivePeriod("3rd"), "3rd");
  assert.equal(normalizeLivePeriod("OT2"), "OT2");
  assert.equal(normalizeLivePeriod("third quarter"), null);
  assert.equal(liveGameContext("3rd", "4:27"), "3rd · 4:27");
  assert.equal(liveGameContext("OT", null), "OT");
  assert.equal(liveGameContext(null, null), "Live");
});
