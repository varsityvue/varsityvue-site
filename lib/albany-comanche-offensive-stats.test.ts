import assert from "node:assert/strict";
import test from "node:test";

import { getAllGameStats } from "@/lib/game-stats";
import { getGames } from "@/lib/games";
import { getGameCategoryCompleteness } from "@/lib/stat-completeness";

const targetIds = [
  "albany-at-coleman-2026-week-4",
  "clyde-at-comanche-2026-week-3",
  "comanche-at-clifton-2026-week-4",
] as const;

function sum<T>(lines: T[], read: (line: T) => number) {
  return lines.reduce((total, line) => total + read(line), 0);
}

function requireStats(gameId: (typeof targetIds)[number]) {
  const records = getAllGameStats().filter((entry) => entry.gameId === gameId);
  assert.equal(records.length, 1, `${gameId} must have one canonical statistics record.`);
  return records[0];
}

function assertNoDuplicatePlayerCategories(gameId: (typeof targetIds)[number]) {
  const stats = requireStats(gameId);
  for (const [category, lines] of [["rushing", stats.rushing], ["passing", stats.passing], ["receiving", stats.receiving]] as const) {
    const identities = lines.map((line) => `${line.schoolSlug}:${line.player}`);
    assert.equal(new Set(identities).size, identities.length, `${gameId} ${category} must not contain duplicate player lines.`);
  }
}

test("target statistics attach once to the existing canonical finals", () => {
  const games = getGames();
  for (const gameId of targetIds) {
    const matches = games.filter((game) => game.id === gameId);
    assert.equal(matches.length, 1, `${gameId} must remain a single canonical game.`);
    assert.equal(matches[0].status, "final");
    assertNoDuplicatePlayerCategories(gameId);
  }
});

test("Albany Week 4 offense reconciles while interceptions remain unknown", () => {
  const stats = requireStats("albany-at-coleman-2026-week-4");
  const team = stats.teamStats.find((line) => line.schoolSlug === "albany");
  assert.deepEqual(team, { schoolSlug: "albany", rushingAttempts: 37, rushingYards: 246, passingYards: 197, completions: 12, passAttempts: 23 });
  assert.equal(stats.passing.find((line) => line.player === "Clay Chapman")?.interceptions, undefined);
  assert.equal(sum(stats.rushing, (line) => line.attempts), 37);
  assert.equal(sum(stats.rushing, (line) => line.yards), 246);
  assert.equal(sum(stats.rushing, (line) => line.touchdowns ?? 0), 1);
  assert.equal(sum(stats.receiving, (line) => line.receptions), 12);
  assert.equal(sum(stats.receiving, (line) => line.yards), 197);
  assert.equal(sum(stats.receiving, (line) => line.touchdowns ?? 0), 3);
  assert.equal(stats.receiving.find((line) => line.player === "Lyle Wheeler")?.yards, 0);
  assert.equal(getGameCategoryCompleteness(stats, "albany", "passing").status, "partial");
});

test("Comanche Week 3 offense reconciles without fabricated quarter scoring", () => {
  const stats = requireStats("clyde-at-comanche-2026-week-3");
  assert.equal(stats.quarterScores.every((line) => line.quarters.length === 0), true);
  assert.equal(sum(stats.rushing, (line) => line.attempts), 29);
  assert.equal(sum(stats.rushing, (line) => line.yards), 155);
  assert.equal(sum(stats.rushing, (line) => line.touchdowns ?? 0), 2);
  assert.equal(sum(stats.passing, (line) => line.completions), 13);
  assert.equal(sum(stats.passing, (line) => line.attempts), 22);
  assert.equal(sum(stats.passing, (line) => line.yards), 158);
  assert.equal(sum(stats.passing, (line) => line.interceptions ?? 0), 1);
  assert.equal(sum(stats.receiving, (line) => line.receptions), 13);
  assert.equal(sum(stats.receiving, (line) => line.yards), 158);
  assert.equal(sum(stats.receiving, (line) => line.touchdowns ?? 0), 1);
});

test("Comanche Week 4 offense and quarter scoring reconcile explicit zero touchdowns", () => {
  const stats = requireStats("comanche-at-clifton-2026-week-4");
  for (const line of stats.quarterScores) assert.equal(sum(line.quarters, (points) => points), line.total);
  assert.equal(sum(stats.rushing, (line) => line.attempts), 29);
  assert.equal(sum(stats.rushing, (line) => line.yards), 179);
  assert.equal(sum(stats.rushing, (line) => line.touchdowns ?? 0), 3);
  assert.equal(sum(stats.passing, (line) => line.completions), 7);
  assert.equal(sum(stats.passing, (line) => line.attempts), 16);
  assert.equal(sum(stats.passing, (line) => line.yards), 76);
  assert.equal(sum(stats.passing, (line) => line.interceptions ?? 0), 1);
  assert.equal(stats.passing.every((line) => line.touchdowns === 0), true);
  assert.equal(sum(stats.receiving, (line) => line.receptions), 7);
  assert.equal(sum(stats.receiving, (line) => line.yards), 76);
  assert.equal(stats.receiving.every((line) => line.touchdowns === 0), true);
});
