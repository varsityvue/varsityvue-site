import assert from "node:assert/strict";
import test from "node:test";

import { getGameStats } from "@/lib/game-stats";

const gameId = "cisco-at-stamford-2026-week-4";

test("Cisco Week 4 offensive statistics reconcile to the MaxPreps totals", () => {
  const stats = getGameStats(gameId);
  assert.ok(stats);
  assert.equal(stats.sourceLabel, "MaxPreps");
  assert.deepEqual(stats.quarterScores, [
    { schoolSlug: "cisco", quarters: [0, 0, 7, 0], total: 7 },
    { schoolSlug: "stamford", quarters: [0, 21, 6, 0], total: 27 },
  ]);

  const team = stats.teamStats.find((line) => line.schoolSlug === "cisco");
  assert.deepEqual(team, {
    schoolSlug: "cisco",
    rushingAttempts: 41,
    rushingYards: 270,
    passingYards: 108,
    totalYards: 378,
    completions: 8,
    passAttempts: 19,
    interceptionsThrown: 2,
  });

  const passing = stats.passing.filter((line) => line.schoolSlug === "cisco");
  assert.equal(passing.reduce((sum, line) => sum + line.completions, 0), 8);
  assert.equal(passing.reduce((sum, line) => sum + line.attempts, 0), 19);
  assert.equal(passing.reduce((sum, line) => sum + line.yards, 0), 108);
  assert.equal(passing.reduce((sum, line) => sum + (line.interceptions ?? 0), 0), 2);

  const rushing = stats.rushing.filter((line) => line.schoolSlug === "cisco");
  assert.equal(rushing.reduce((sum, line) => sum + line.attempts, 0), 41);
  assert.equal(rushing.reduce((sum, line) => sum + line.yards, 0), 270);

  const receiving = stats.receiving.filter((line) => line.schoolSlug === "cisco");
  assert.equal(receiving.reduce((sum, line) => sum + line.receptions, 0), 8);
  assert.equal(receiving.reduce((sum, line) => sum + line.yards, 0), 108);
});

test("Cisco Week 4 has no duplicate player lines within an offensive category", () => {
  const stats = getGameStats(gameId);
  assert.ok(stats);

  for (const category of [stats.passing, stats.rushing, stats.receiving]) {
    const names = category
      .filter((line) => line.schoolSlug === "cisco")
      .map((line) => line.player);
    assert.equal(new Set(names).size, names.length);
  }
});
