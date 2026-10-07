import assert from "node:assert/strict";
import test from "node:test";

import { gameStats } from "@/lib/all-game-stats";
import { getPlayerId, getPlayerSeasonStats } from "@/lib/player-stats";
import { getGameCategoryCompleteness } from "@/lib/stat-completeness";

const week2Id = "de-leon-at-stamford-2026-week-2";

test("Young's corrected Week 2 line survives the De Leon replacement without changing other receivers", () => {
  const matches = gameStats.filter((game) => game.gameId === week2Id);
  assert.equal(matches.length, 1);
  assert.deepEqual(matches[0].receiving.filter((line) => line.schoolSlug === "stamford"), [
    { player: "Karsten Hall", schoolSlug: "stamford", receptions: 3, yards: 36 },
    { player: "Brennan Armstrong", schoolSlug: "stamford", receptions: 1, yards: 12, touchdowns: 1 },
    { player: "Levi Vahlenkamp", schoolSlug: "stamford", receptions: 5, yards: 118 },
    { player: "Ace Martinez", schoolSlug: "stamford", receptions: 4, yards: 79 },
    { player: "Brenham Walker", schoolSlug: "stamford", receptions: 1, yards: -4 },
    { player: "Slayden Young", schoolSlug: "stamford", receptions: 6, yards: 30 },
  ]);
});

test("Week 2 preserves the source's 20 receptions versus 21 completions with partial attribution", () => {
  const game = gameStats.find((entry) => entry.gameId === week2Id);
  assert.ok(game);
  const receivers = game.receiving.filter((line) => line.schoolSlug === "stamford");
  assert.equal(receivers.reduce((sum, line) => sum + line.receptions, 0), 20);
  assert.equal(receivers.reduce((sum, line) => sum + line.yards, 0), 271);
  const team = game.teamStats.find((line) => line.schoolSlug === "stamford");
  const passer = game.passing.find((line) => line.schoolSlug === "stamford" && line.player === "Miles Follis");
  assert.equal(team?.completions, 21);
  assert.equal(team?.passingYards, 271);
  assert.equal(passer?.completions, 21);
  assert.equal(passer?.yards, 271);
  const completeness = getGameCategoryCompleteness(game, "stamford", "receiving");
  assert.equal(completeness.status, "partial");
  assert.match(completeness.note ?? "", /20 of 21 reported completions and all 271 passing yards/);
  assert.match(completeness.note ?? "", /unattributed in the source/);
});

test("Young's six distinct effective games derive one 34/474 season identity and 13.9 average", () => {
  const stamfordGames = gameStats.filter((game) => game.season === 2026 && game.quarterScores.some((line) => line.schoolSlug === "stamford"));
  assert.equal(stamfordGames.length, 6);
  const identities = stamfordGames.map((game) => `${game.season}|${game.gameId.match(/-week-(\d+)/)?.[1]}|${game.quarterScores.map((line) => line.schoolSlug).sort().join("|")}`);
  assert.equal(new Set(identities).size, 6);
  const lines = stamfordGames.flatMap((game) => game.receiving
    .filter((line) => line.schoolSlug === "stamford" && line.player === "Slayden Young")
    .map((line) => [game.gameId, line.receptions, line.yards]));
  assert.deepEqual(lines.sort(), [
    ["stamford-at-haskell-2026-week-1", 9, 215],
    [week2Id, 6, 30],
    ["stamford-at-hawley-2026-week-3", 8, 79],
    ["cisco-at-stamford-2026-week-4", 4, 46],
    ["miles-at-stamford-2026-week-5", 3, 36],
    ["stamford-at-hamlin-2026-week-6", 4, 68],
  ].sort());
  const players = getPlayerSeasonStats(2026).filter((player) => player.schoolSlug === "stamford" && player.player === "Slayden Young");
  assert.equal(players.length, 1);
  assert.equal(players[0].playerId, getPlayerId("stamford", "Slayden Young", 2026));
  assert.equal(players[0].gamesRecorded, 6);
  assert.equal(players[0].receiving.receptions, 34);
  assert.equal(players[0].receiving.yards, 474);
  assert.equal(players[0].receiving.yardsPerReception, 13.9);
  assert.equal(players[0].completeness.receiving.status, "partial");
});
