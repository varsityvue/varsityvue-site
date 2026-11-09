import assert from "node:assert/strict";
import test from "node:test";
import { getStateChampionshipPath } from "./state-championship-path";
import type { Game } from "@/types/platform";

test("unverified statewide regions never create fabricated semifinalists", () => {
  const path = getStateChampionshipPath("2A-D1", []);
  assert.ok(path);
  assert.deepEqual(path.regionalChampions, [null, null, null, null]);
  assert.deepEqual(path.final, [null, null]);
  assert.equal(path.champion, null);
});
test("unknown division fails closed", () => {
  assert.equal(getStateChampionshipPath("5A-D1", []), null);
});
test("unrelated or unverified semifinal scores do not generate a champion", () => {
  const fake: Game = { id: "unrelated", season: 2026, gameType: "playoff",
    playoff: { round: "State Semifinal", division: "2A D1" },
    homeTeam: "Team A", awayTeam: "Team B", homeScore: 35, awayScore: 7,
    status: "final", publicScoreVerified: false, districtGame: false };
  const path = getStateChampionshipPath("2A-D1", [fake]);
  assert.ok(path);
  assert.equal(path.champion, null);
  assert.deepEqual(path.semifinalWinners, [null, null]);
});
