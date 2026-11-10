import assert from "node:assert/strict";
import test from "node:test";
import { buildRegionalRounds, verifiedWinner } from "./playoff-bracket-advancement";
import type { Game } from "@/types/platform";

const fixture = (homeTeam: string, awayTeam: string, homeScore: number, awayScore: number, verified = true): Game => ({
  id: `${homeTeam}-${awayTeam}`, season: 2026, gameType: "playoff", homeTeam, awayTeam,
  homeScore, awayScore, publicScoreVerified: verified, status: "final",
  playoff: { round: ({"A-D":"Area","E-H":"Area","I-L":"Area","M-P":"Area","A-H":"Regional Semifinal","I-P":"Regional Semifinal","A-P":"Regional Final"} as Record<string,string>)[`${homeTeam}-${awayTeam}`] ?? "Bi-District", division: "2A D1" },
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

test("advances a complete verified four-round regional path", () => {
  const games = [
    fixture("A", "B", 21, 7), fixture("C", "D", 10, 20),
    fixture("E", "F", 14, 6), fixture("G", "H", 3, 24),
    fixture("I", "J", 28, 0), fixture("K", "L", 7, 14),
    fixture("M", "N", 10, 9), fixture("O", "P", 14, 21),
    fixture("A", "D", 31, 14), fixture("E", "H", 7, 20),
    fixture("I", "L", 14, 3), fixture("M", "P", 3, 17),
    fixture("A", "H", 24, 10), fixture("I", "P", 7, 28),
    fixture("A", "P", 21, 17),
  ];
  const { roundTeams, roundGames } = buildRegionalRounds(field, games);
  assert.deepEqual(roundTeams[1], [["A", "D"], ["E", "H"], ["I", "L"], ["M", "P"]]);
  assert.deepEqual(roundTeams[2], [["A", "H"], ["I", "P"]]);
  assert.deepEqual(roundTeams[3], [["A", "P"]]);
  assert.equal(verifiedWinner(roundGames[3][0]), "A");
});

test("blocks downstream advancement when an area final is unverified", () => {
  const games = [
    fixture("A", "B", 21, 7), fixture("C", "D", 10, 20),
    fixture("A", "D", 31, 14, false),
  ];
  const { roundTeams } = buildRegionalRounds(field, games);
  assert.deepEqual(roundTeams[1][0], ["A", "D"]);
  assert.deepEqual(roundTeams[2][0], [null, null]);
});

test("no-contest cannot advance a team even if a numeric score exists", () => {
  const game = { ...fixture("A", "B", 21, 0), resultType: "no_contest" as const };
  assert.equal(verifiedWinner(game), null);
});

test("forfeit advances only the verified official winner, never a numeric-score guess", () => {
  const game = {
    ...fixture("A", "B", 0, 1),
    resultType: "forfeit" as const,
    homeSchoolSlug: "a",
    awaySchoolSlug: "b",
    officialWinnerSchoolSlug: "a",
  };
  assert.equal(verifiedWinner(game), "A");
  assert.equal(verifiedWinner({ ...game, officialWinnerSchoolSlug: undefined }), null);
  assert.equal(verifiedWinner({ ...game, officialWinnerSchoolSlug: "unknown" }), null);
});

test("division-scoped bracket ignores identical matchup from another division", () => {
  const wrong = { ...fixture("A", "B", 21, 7), playoff: { round: "Bi-District" as const, division: "3A D1" } };
  const right = { ...fixture("A", "B", 7, 21), playoff: { round: "Bi-District" as const, division: "2A D1" } };
  const { roundTeams } = buildRegionalRounds(field, [wrong, right], 2026, "2A-D1");
  assert.deepEqual(roundTeams[1][0], ["B", null]);
});

test("region-scoped bracket rejects same-division result from another region", () => {
  const wrong = { ...fixture("A", "B", 21, 7), playoff: { round: "Bi-District" as const, division: "2A D1", region: "I" } };
  const right = { ...fixture("A", "B", 7, 21), playoff: { round: "Bi-District" as const, division: "2A D1", region: "II" } };
  const { roundTeams } = buildRegionalRounds(field, [wrong, right], 2026, "2A-D1", "II");
  assert.deepEqual(roundTeams[1][0], ["B", null]);
});

test("duplicate matching playoff records cannot advance a winner", () => {
  const first = { ...fixture("A", "B", 21, 7), id: "first" };
  const duplicate = { ...fixture("A", "B", 7, 21), id: "second" };
  const { roundTeams, roundGames } = buildRegionalRounds(field, [first, duplicate]);
  assert.equal(roundGames[0][0], undefined);
  assert.deepEqual(roundTeams[1][0], [null, null]);
});

test("a verified result from a different playoff round never advances a first-round slot", () => {
  const mislabeled = { ...fixture("A", "B", 35, 7), playoff: { round: "Area" as const, division: "2A D1" } };
  const { roundTeams } = buildRegionalRounds(field, [mislabeled]);
  assert.deepEqual(roundTeams[1][0], [null, null]);
});

test("a duplicate opponent pairing in another round does not block a valid bi-district result", () => {
  const first = fixture("A", "B", 21, 7);
  const unrelatedRound = { ...fixture("A", "B", 7, 21), id: "other-round", playoff: { round: "Area" as const } };
  const { roundTeams } = buildRegionalRounds(field, [first, unrelatedRound]);
  assert.deepEqual(roundTeams[1][0], ["A", null]);
});
