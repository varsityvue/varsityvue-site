import assert from "node:assert/strict";
import test from "node:test";
import { buildRegionalRounds, verifiedWinner } from "./playoff-bracket-advancement";
import type { Game } from "@/types/platform";

const fixture = (homeTeam: string, awayTeam: string, homeScore: number, awayScore: number, verified = true): Game => ({
  id: `${homeTeam}-${awayTeam}`, season: 2026, gameType: "playoff", homeTeam, awayTeam,
  homeScore, awayScore, publicScoreVerified: verified, status: "final",
} as Game);

const field = [
  ["A", "B"], ["C", "D"], ["E", "F"], ["G", "H"],
  ["I", "J"], ["K", "L"], ["M", "N"], ["O", "P"],
] as const;

test("does not advance an unverified score", () => {
  assert.equal(verifiedWinner(fixture("A", "B", 20, 10, false)), null);
  assert.equal(verifiedWinner(undefined), null);
});

test("advances verified winners in correct bracket slots", () => {
  const games = [fixture("A", "B", 20, 10), fixture("C", "D", 7, 14), fixture("A", "D", 21, 17)];
  const { roundTeams, roundGames } = buildRegionalRounds(field, games);
  assert.deepEqual(roundTeams[1][0], ["A", "D"]);
  assert.deepEqual(roundTeams[2][0], ["A", null]);
  assert.equal(roundGames[1][0]?.id, "A-D");
  assert.equal(roundTeams[3].length, 1);
});

test("does not advance a tie or an unpublished later-round result", () => {
  const games = [fixture("A", "B", 14, 14), fixture("C", "D", 14, 7)];
  const { roundTeams } = buildRegionalRounds(field, games);
  assert.deepEqual(roundTeams[1][0], [null, "C"]);
  assert.deepEqual(roundTeams[2][0], [null, null]);
});
