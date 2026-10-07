import assert from "node:assert/strict";
import test from "node:test";
import { getGameById, getGames, getGamesForSchool } from "./games";
import { getGameStats } from "./game-stats";
import { getScoreboardGames } from "./scoreboard";

const id = "comanche-at-cisco-2026-week-2";

test("Cisco ISD's September 4 varsity kickoff survives schedule precedence for every game selector", () => {
  const selections = [
    getGameById(id),
    getGames().find((game) => game.id === id && game.week === 2),
    getGamesForSchool("comanche").find((game) => game.id === id),
    getGamesForSchool("cisco").find((game) => game.id === id),
    getScoreboardGames().find((game) => game.id === id),
  ];
  for (const game of selections) {
    assert.ok(game);
    assert.equal(game.kickoff, "2026-09-04T19:00:00-05:00");
    assert.equal(new Date(game.kickoff).toISOString(), "2026-09-05T00:00:00.000Z");
    assert.equal(new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago", hour: "numeric", minute: "2-digit",
    }).format(new Date(game.kickoff)), "7:00 PM");
    assert.equal(game.status, "final");
    assert.equal(game.sourceStatus, "verified");
    assert.equal(game.homeScore, 38);
    assert.equal(game.awayScore, 6);
  }
});

test("kickoff correction preserves verified quarter scores and team statistics", () => {
  const stats = getGameStats(id);
  assert.ok(stats);
  assert.equal(stats.sourceStatus, "verified");
  assert.deepEqual(stats.quarterScores, [
    { schoolSlug: "comanche", quarters: [0, 6, 0, 0], total: 6 },
    { schoolSlug: "cisco", quarters: [7, 17, 0, 14], total: 38 },
  ]);
  assert.deepEqual(stats.teamStats.map((team) => [team.schoolSlug, team.totalYards]), [
    ["comanche", 215], ["cisco", 434],
  ]);
});
