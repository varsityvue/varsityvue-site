import assert from "node:assert/strict";
import test from "node:test";

import { getGames } from "@/lib/games";
import { formatScoringAverage, getSchoolScoringAverages } from "@/lib/school-scoring-averages";
import type { Game } from "@/types/platform";

function game(overrides: Partial<Game> & Pick<Game, "id">): Game {
  const { id, ...gameOverrides } = overrides;
  return {
    id,
    season: 2026,
    gameType: "regular",
    status: "final",
    homeSchoolSlug: "home",
    awaySchoolSlug: "away",
    homeTeam: "Home",
    awayTeam: "Away",
    districtGame: false,
    sourceStatus: "verified",
    ...gameOverrides,
  };
}

test("maps points for and allowed correctly at home and away", () => {
  const averages = getSchoolScoringAverages("target", [
    game({ id: "home", homeSchoolSlug: "target", homeScore: 35, awayScore: 14 }),
    game({ id: "away", awaySchoolSlug: "target", homeScore: 21, awayScore: 28 }),
  ]);

  assert.deepEqual(averages, {
    scoredGames: 2,
    pointsFor: 63,
    pointsAllowed: 35,
    pointsPerGame: 31.5,
    pointsAllowedPerGame: 17.5,
  });
});

test("uses the current corrected final once when a canonical ID is overlaid", () => {
  const averages = getSchoolScoringAverages("target", [
    game({ id: "corrected", homeSchoolSlug: "target", homeScore: 14, awayScore: 7 }),
    game({ id: "corrected", homeSchoolSlug: "target", homeScore: 28, awayScore: 21 }),
  ]);

  assert.equal(averages.scoredGames, 1);
  assert.equal(averages.pointsFor, 28);
  assert.equal(averages.pointsAllowed, 21);
});

test("excludes scoreless forfeits, missing scores, pending games, and exceptional outcomes", () => {
  const averages = getSchoolScoringAverages("target", [
    game({ id: "forfeit", awaySchoolSlug: "target", resultType: "forfeit", officialWinnerSchoolSlug: "target" }),
    game({ id: "missing", homeSchoolSlug: "target", homeScore: 20 }),
    game({ id: "pending", homeSchoolSlug: "target", status: "upcoming", homeScore: 20, awayScore: 7 }),
    game({ id: "tie", homeSchoolSlug: "target", resultType: "tie", homeScore: 14, awayScore: 14 }),
    game({ id: "no-contest", homeSchoolSlug: "target", resultType: "no_contest", homeScore: 7, awayScore: 0 }),
    game({ id: "cancelled", homeSchoolSlug: "target", status: "cancelled", homeScore: 7, awayScore: 0 }),
  ]);

  assert.deepEqual(averages, {
    scoredGames: 0,
    pointsFor: 0,
    pointsAllowed: 0,
    pointsPerGame: null,
    pointsAllowedPerGame: null,
  });
  assert.equal(formatScoringAverage(averages.pointsPerGame), "—");
});

test("Cisco's four current finals reconcile to 27.8 PPG and 16.5 Allowed/G", () => {
  const averages = getSchoolScoringAverages("cisco", getGames());
  assert.equal(averages.scoredGames, 4);
  assert.equal(averages.pointsFor, 111);
  assert.equal(averages.pointsAllowed, 66);
  assert.equal(formatScoringAverage(averages.pointsPerGame), "27.8");
  assert.equal(formatScoringAverage(averages.pointsAllowedPerGame), "16.5");
});
