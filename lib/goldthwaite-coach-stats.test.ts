import assert from "node:assert/strict";
import test from "node:test";
import { gameStats } from "@/lib/all-game-stats";
import { validateGameStats } from "@/lib/game-stats-validation";
import { extendedGameStats } from "@/data/extended-game-stats";

const ids = [
  "de-leon-at-goldthwaite-2026-week-4",
  "winters-at-goldthwaite-2026-week-5",
  "goldthwaite-at-miles-2026-week-6",
];
test("Goldthwaite coach reports reconcile without duplicate matchups", () => {
  for (const id of ids) {
    const records = gameStats.filter(game => game.gameId === id);
    assert.equal(records.length, 1);
    const game = records[0];
    assert.equal(validateGameStats(game).filter(issue => issue.level === "error").length, 0);
    const team = game.teamStats.find(line => line.schoolSlug === "goldthwaite");
    assert.ok(team);
    const rushing = game.rushing.filter(line => line.schoolSlug === "goldthwaite");
    const passing = game.passing.filter(line => line.schoolSlug === "goldthwaite");
    const receiving = game.receiving.filter(line => line.schoolSlug === "goldthwaite");
    assert.equal(rushing.reduce((n, r) => n + r.attempts, 0), team.rushingAttempts);
    assert.equal(rushing.reduce((n, r) => n + r.yards, 0), team.rushingYards);
    assert.equal(passing.reduce((n, r) => n + r.completions, 0), team.completions);
    assert.equal(passing.reduce((n, r) => n + r.attempts, 0), team.passAttempts);
    assert.equal(passing.reduce((n, r) => n + r.yards, 0), team.passingYards);
    assert.equal(receiving.reduce((n, r) => n + r.receptions, 0), team.completions);
    assert.equal(receiving.reduce((n, r) => n + r.yards, 0), team.passingYards);
    assert.equal(receiving.reduce((n, r) => n + (r.touchdowns ?? 0), 0), passing.reduce((n, r) => n + (r.touchdowns ?? 0), 0));
    const scores = game.quarterScores.find(line => line.schoolSlug === "goldthwaite");
    assert.ok(scores);
    for (let quarter = 1; quarter <= 4; quarter++) {
      const points = game.scoringPlays.filter(play => play.schoolSlug === "goldthwaite" && play.quarter === quarter).reduce((n, play) => n + (play.description.includes("field goal") ? 3 : 6 + (play.description.includes("(Blake Howard kick)") ? 1 : 0)), 0);
      assert.equal(points, scores.quarters[quarter - 1]);
    }
    assert.equal(extendedGameStats.filter(game => game.gameId === id).length, 1);
  }
});
test("De Leon statistics remain unchanged and Goldthwaite uses the approved correction", () => {
  const game = gameStats.find(game => game.gameId === ids[0]);
  assert.ok(game);
  assert.deepEqual(game.teamStats.find(line => line.schoolSlug === "de-leon"), {
    schoolSlug: "de-leon", rushingAttempts: 41, rushingYards: 220, passingYards: 106,
    totalYards: 326, completions: 16, passAttempts: 30, interceptionsThrown: 0,
  });
  assert.deepEqual(game.rushing.filter(line => line.schoolSlug === "de-leon").map(line => [line.player, line.attempts, line.yards]), [
    ["Lane Couch", 23, 103], ["Bryce Burkeen", 5, 36], ["Hud Price", 10, 68], ["Ed Garcia", 3, 13],
  ]);
  assert.deepEqual(game.receiving.filter(line => line.schoolSlug === "de-leon").map(line => [line.player, line.receptions, line.yards]), [
    ["Bentley Lingle", 2, 11], ["Trenton Zmeskal", 5, 43], ["Bryce Burkeen", 8, 41], ["Jayden Lindley", 1, 11],
  ]);
  assert.equal(game.passing.find(line => line.schoolSlug === "goldthwaite")?.completions, 6);
  assert.equal(game.rushing.find(line => line.player === "Hayes Greenway")?.yards, 64);
});
test("Winters and Miles imports contain Goldthwaite player statistics only", () => {
  for (const id of ids.slice(1)) {
    const game = gameStats.find(game => game.gameId === id);
    assert.ok(game);
    assert.ok([...game.rushing, ...game.passing, ...game.receiving, ...game.teamStats].every(line => line.schoolSlug === "goldthwaite"));
  }
});
