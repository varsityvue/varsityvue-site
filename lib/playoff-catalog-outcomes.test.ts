import assert from "node:assert/strict";
import test from "node:test";
import { getStandingForSchoolFromGames } from "./standings";
import { verifiedWinner } from "./playoff-bracket-advancement";
import { getGamePresentation } from "./game-presentation";
import { orderPlayedFinals } from "./recent-results";
import { getSchoolScoringAverages } from "./school-scoring-averages";
import { getDistrictCoveragePresentation } from "./district-coverage-presentation";
import type { Game } from "../types/platform";

const final: Game = {
  id: "panhandle-floydada-regression", season: 2026, gameType: "playoff", districtGame: false,
  homeTeam: "Panhandle", awayTeam: "Floydada", homeSchoolSlug: "panhandle", awaySchoolSlug: "floydada",
  status: "final", homeScore: 21, awayScore: 7,
  playoff: { round: "Bi-District", division: "2A D1", region: "I" },
};

test("pending playoff finals cannot change school records before bracket verification", () => {
  const standing = getStandingForSchoolFromGames("panhandle", [final])!;
  assert.equal(getGamePresentation(final).kind, "awaiting_verification");
  assert.equal(verifiedWinner(final), null);
  assert.equal(standing.overallRecordKnown, false);
  assert.equal(standing.overallWins, 0);
  assert.equal(standing.pointsFor, 0);
});

test("valid verified playoff wins update overall records without inventing district results", () => {
  const game = { ...final, publicScoreVerified: true };
  const standing = getStandingForSchoolFromGames("panhandle", [game])!;
  assert.equal(verifiedWinner(game), "Panhandle");
  assert.equal(standing.overallRecordKnown, true);
  assert.equal(standing.overallWins, 1);
  assert.equal(standing.districtWins, 0);
  assert.equal(standing.pointsFor, 21);
});

test("no-contest and malformed verified playoff scores stay outside record totals", () => {
  for (const game of [
    { ...final, publicScoreVerified: true, resultType: "no_contest" as const },
    ...[NaN, Infinity, -1, 1.5].map((homeScore) => ({ ...final, publicScoreVerified: true, homeScore })),
  ]) {
    assert.equal(verifiedWinner(game), null);
    assert.equal(getStandingForSchoolFromGames("panhandle", [game])!.overallRecordKnown, false);
  }
});

test("verified forfeits use the official winner rather than numeric score ordering", () => {
  const game = { ...final, publicScoreVerified: true, resultType: "forfeit" as const, officialWinnerSchoolSlug: "floydada" };
  assert.equal(verifiedWinner(game), "Floydada");
  assert.equal(getStandingForSchoolFromGames("panhandle", [game])!.overallLosses, 1);
  assert.equal(getStandingForSchoolFromGames("floydada", [game])!.overallWins, 1);
});

test("planned district coverage distinguishes missing results from an unstarted season", () => {
  const empty = getDistrictCoveragePresentation("planned", false);
  assert.equal(empty.statusValue, "Results Pending");
  assert.match(empty.notice!, /membership and 2026 results may be incomplete/);
  assert.equal(empty.teamLabel, "Catalog Schools");
  assert.equal(getDistrictCoveragePresentation("planned", true).statusValue, "Partial Results");
  assert.equal(getDistrictCoveragePresentation("pilot", false).statusValue, "Not Started");
  assert.equal(getDistrictCoveragePresentation("pilot", true).notice, null);
});


test("pending and exceptional playoff outcomes never leak into played-result summaries or scoring averages", () => {
  for (const game of [
    final,
    { ...final, publicScoreVerified: true, resultType: "no_contest" as const },
    { ...final, publicScoreVerified: true, resultType: "forfeit" as const, officialWinnerSchoolSlug: "floydada" },
    ...[NaN, Infinity, -1, 1.5].map((homeScore) => ({ ...final, publicScoreVerified: true, homeScore })),
  ]) {
    assert.equal(orderPlayedFinals([game]).length, 0);
    assert.equal(getSchoolScoringAverages("panhandle", [game]).scoredGames, 0);
  }
  const verified = { ...final, publicScoreVerified: true };
  assert.equal(orderPlayedFinals([verified]).length, 1);
  assert.equal(getSchoolScoringAverages("panhandle", [verified]).pointsPerGame, 21);
});
