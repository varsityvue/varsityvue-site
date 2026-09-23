import assert from "node:assert/strict";

import { gameStats } from "@/lib/all-game-stats";
import { getPlayerSeasonStats } from "@/lib/player-stats";
import {
  addOptionalStatTotal,
  formatTouchdownCount,
  formatTouchdownDetail,
} from "@/lib/stat-values";

assert.equal(addOptionalStatTotal(0, 4), 4, "positive touchdown values must aggregate");
assert.equal(addOptionalStatTotal(0, 0), 0, "explicit zero must remain zero");
assert.equal(addOptionalStatTotal(4, undefined), undefined, "missing touchdown values must make the total unknown");

assert.equal(formatTouchdownCount(4), "4");
assert.equal(formatTouchdownCount(0), "0");
assert.equal(formatTouchdownCount(undefined), "—");
assert.equal(formatTouchdownDetail(undefined), "TD unavailable");

const players = getPlayerSeasonStats(2026);
const findPlayer = (name: string, schoolSlug = "de-leon") => players.find((player) => player.player === name && player.schoolSlug === schoolSlug);

assert.equal(findPlayer("Bryce Burkeen")?.receiving.touchdowns, 4, "known positive season total must remain numeric");
assert.equal(findPlayer("Jayden Lindley")?.receiving.touchdowns, 1, "known positive season total must include the Week 4 touchdown");
assert.equal(findPlayer("Lane Couch")?.receiving.touchdowns, 0, "source-supported receiving zeroes must remain numeric through aggregation");
assert.equal(findPlayer("Beau Morris")?.passing.touchdowns, 0, "source-supported passing zeroes must remain numeric through aggregation");
assert.equal(findPlayer("Slayden Young", "stamford")?.receiving.touchdowns, undefined, "unresolved touchdown attribution must remain unknown");

const week1 = gameStats.find((game) => game.gameId === "san-saba-at-de-leon-2026-week-1");
const week2 = gameStats.find((game) => game.gameId === "de-leon-at-stamford-2026-week-2");
const stamfordHaskell = gameStats.find((game) => game.gameId === "stamford-at-haskell-2026-week-1");

assert.ok(week1 && week2 && stamfordHaskell, "target reconciliation records must exist");
assert.deepEqual(
  week1.passing.filter((line) => ["Jason Everett", "JJ Romero", "Beau Morris"].includes(line.player)).map((line) => line.touchdowns),
  [0, 0, 0],
  "Week 1 source-supported passing zeroes must remain explicit"
);
assert.deepEqual(
  week1.receiving.filter((line) => ["Lane Couch", "Trenton Zmeskal", "Alex Reyna"].includes(line.player)).map((line) => line.touchdowns),
  [0, 0, 0],
  "Week 1 source-supported receiving zeroes must remain explicit"
);
assert.equal(week2.passing.find((line) => line.player === "Beau Morris")?.touchdowns, 0, "Week 2 Beau Morris passing zero must remain explicit");
assert.equal(week1.passing.find((line) => line.player === "Hud Price")?.touchdowns, 1, "Week 1 Hud Price positive total must remain unchanged");
assert.equal(week2.passing.find((line) => line.player === "Hud Price")?.touchdowns, 3, "Week 2 Hud Price positive total must remain unchanged");
assert.ok(stamfordHaskell.receiving.every((line) => line.touchdowns === undefined), "Stamford-Haskell receiving attribution must remain unknown");

console.log("Touchdown semantics validation passed: positive, explicit zero, and missing values remain distinct.");
