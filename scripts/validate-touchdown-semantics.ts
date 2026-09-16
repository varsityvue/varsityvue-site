import assert from "node:assert/strict";

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
const findPlayer = (name: string) => players.find((player) => player.player === name && player.schoolSlug === "de-leon");

assert.equal(findPlayer("Bryce Burkeen")?.receiving.touchdowns, 4, "known positive season total must remain numeric");
assert.equal(findPlayer("Jayden Lindley")?.receiving.touchdowns, 0, "explicit zero season total must remain numeric zero");
assert.equal(findPlayer("Lane Couch")?.receiving.touchdowns, undefined, "a season total containing missing touchdown attribution must remain unknown");

console.log("Touchdown semantics validation passed: positive, explicit zero, and missing values remain distinct.");
