import assert from "node:assert/strict";
import test from "node:test";
import { getGames } from "./games";
import { auditPublishedPlayoffGames } from "./playoff-bracket-schedule-audit";

test("all published 2026 bi-district games agree with statewide bracket fields", () => {
  const conflicts = auditPublishedPlayoffGames(getGames());
  assert.deepEqual(conflicts, []);
});


test("Tolar playoff game is present in both public game catalogs", async () => {
  const games = getGames();
  const tolar = games.find((game) => game.id === "2026-bi-district-3a-d2-ii-8");
  assert.ok(tolar, "Tolar–Scurry-Rosser must be published in Game Center");
  assert.equal(tolar.gameType, "playoff");
  assert.equal(tolar.homeSchoolSlug, "tolar");
  assert.equal(tolar.awaySchoolSlug, "scurry-rosser");
  const { getPlayoffSchedule } = await import("./playoffs");
  assert.ok(getPlayoffSchedule(games).some(({ game }) => game.id === tolar.id), "Playoff Central must include Tolar");
});
