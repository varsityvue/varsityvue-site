import assert from "node:assert/strict";
import test from "node:test";

import { getGames } from "@/lib/games";
import { getGameOfTheWeek } from "@/lib/scoreboard";

test("Week 5 has exactly one Game of the Week", () => {
  const weekFiveGames = getGames().filter((game) => game.season === 2026 && game.week === 5);
  const gamesOfTheWeek = weekFiveGames.filter(
    (game) => game.specialEvent?.toLowerCase() === "game of the week",
  );

  assert.deepEqual(
    gamesOfTheWeek.map((game) => game.id),
    ["jacksboro-at-cisco-2026-week-5"],
  );

  const homepageGame = getGameOfTheWeek();
  assert.equal(homepageGame?.id, "jacksboro-at-cisco-2026-week-5");
  assert.equal(homepageGame?.awayTeam, "Jacksboro");
  assert.equal(homepageGame?.homeTeam, "Cisco");
  assert.equal(homepageGame?.kickoff, "2026-09-25T19:00:00-05:00");
  assert.equal(homepageGame?.venue, "Chesley Field");
});

test("Tolar at Comanche remains a normal Week 5 matchup", () => {
  const game = getGames().find((candidate) => candidate.id === "tolar-at-comanche-2026-week-5");

  assert.ok(game);
  assert.equal(game.featured, undefined);
  assert.equal(game.specialEvent, undefined);
  assert.equal(game.status, "upcoming");
});
