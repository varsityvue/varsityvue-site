import assert from "node:assert/strict";
import test from "node:test";

import { getAllGameStats } from "@/lib/game-stats";
import { getGames, getGamesForSchool } from "@/lib/games";
import { getStandingsForDistrictId } from "@/lib/standings";

const districtId = "2a-d2-district-8";
const districtSchools = [
  "crawford",
  "frost",
  "hubbard",
  "mart",
  "meridian",
  "santo",
  "wortham",
] as const;
const districtSchoolSet = new Set<string>(districtSchools);

const completedGames = [
  ["hubbard-at-milano-2026-week-1", "2026-08-28T19:00:00-05:00", 18, 21],
  ["frost-at-blooming-grove-2026-week-1", "2026-08-28T19:00:00-05:00", 0, 31],
  ["crawford-at-mcgregor-2026-week-1", "2026-08-28T19:30:00-05:00", 0, 14],
  ["whitney-at-mart-2026-week-1", "2026-08-28T19:00:00-05:00", 0, 40],
  ["dawson-at-meridian-2026-week-1", "2026-08-28T19:00:00-05:00", 25, 19],
  ["santo-at-chilton-2026-week-1", "2026-08-28T19:00:00-05:00", 13, 22],
  ["wortham-at-valley-mills-2026-week-1", "2026-08-28T19:00:00-05:00", 54, 14],
  ["snook-at-hubbard-2026-week-2", "2026-09-04T19:00:00-05:00", 40, 24],
  ["itasca-at-frost-2026-week-2", "2026-09-04T19:00:00-05:00", 33, 29],
  ["centerville-at-crawford-2026-week-2", "2026-09-04T19:30:00-05:00", 14, 20],
  ["mart-at-axtell-2026-week-2", "2026-09-04T19:00:00-05:00", 44, 0],
  ["cross-roads-at-meridian-2026-week-2", "2026-09-04T19:00:00-05:00", 20, 39],
  ["santo-at-dublin-2026-week-2", "2026-09-04T19:00:00-05:00", 0, 61],
  ["dawson-at-wortham-2026-week-2", "2026-09-04T19:00:00-05:00", 49, 0],
  ["hubbard-at-dawson-2026-week-3", "2026-09-11T19:00:00-05:00", 19, 13],
  ["riesel-at-frost-2026-week-3", "2026-09-11T19:00:00-05:00", 10, 34],
  ["valley-mills-at-crawford-2026-week-3", "2026-09-11T19:30:00-05:00", 39, 6],
  ["tolar-at-mart-2026-week-3", "2026-09-11T19:00:00-05:00", 26, 41],
  ["itasca-at-meridian-2026-week-3", "2026-09-11T19:00:00-05:00", 27, 62],
  ["haskell-at-santo-2026-week-3", "2026-09-11T19:00:00-05:00", 42, 44],
  ["wortham-at-blooming-grove-2026-week-3", "2026-09-11T19:00:00-05:00", 30, 39],
  ["bruceville-eddy-at-hubbard-2026-week-4", "2026-09-18T19:00:00-05:00", 6, 48],
  ["frost-at-dawson-2026-week-4", "2026-09-18T19:00:00-05:00", 14, 17],
  ["crawford-at-marlin-2026-week-4", "2026-09-18T19:30:00-05:00", 26, 25],
  ["mart-at-centerville-2026-week-4", "2026-09-18T19:30:00-05:00", 14, 28],
  ["hico-at-meridian-2026-week-4", "2026-09-18T19:00:00-05:00", 7, 57],
  ["roscoe-at-santo-2026-week-4", "2026-09-18T19:00:00-05:00", 48, 0],
  ["rice-at-wortham-2026-week-4", "2026-09-18T19:00:00-05:00", 35, 39],
] as const;

const districtGames = [
  [5, "meridian", "hubbard", "2026-09-25T19:00:00-05:00"],
  [5, "crawford", "santo", "2026-09-25T19:00:00-05:00"],
  [5, "wortham", "mart", "2026-09-25T19:00:00-05:00"],
  [6, "hubbard", "wortham", "2026-10-02T19:00:00-05:00"],
  [6, "santo", "frost", "2026-10-02T19:00:00-05:00"],
  [6, "mart", "crawford", "2026-10-02T19:00:00-05:00"],
  [7, "crawford", "hubbard", "2026-10-09T19:00:00-05:00"],
  [7, "frost", "mart", "2026-10-09T19:00:00-05:00"],
  [7, "wortham", "meridian", "2026-10-09T19:00:00-05:00"],
  [8, "hubbard", "frost", "2026-10-16T19:00:00-05:00"],
  [8, "meridian", "crawford", "2026-10-16T19:00:00-05:00"],
  [8, "mart", "santo", "2026-10-16T19:00:00-05:00"],
  [9, "santo", "hubbard", "2026-10-23T19:00:00-05:00"],
  [9, "frost", "meridian", "2026-10-23T19:00:00-05:00"],
  [9, "crawford", "wortham", "2026-10-23T19:30:00-05:00"],
  [10, "hubbard", "mart", "2026-10-30T19:00:00-05:00"],
  [10, "wortham", "frost", "2026-10-30T19:00:00-05:00"],
  [10, "meridian", "santo", "2026-10-30T19:00:00-05:00"],
  [11, "frost", "crawford", "2026-11-06T19:30:00-06:00"],
  [11, "mart", "meridian", "2026-11-06T19:00:00-06:00"],
  [11, "santo", "wortham", "2026-11-06T19:00:00-06:00"],
] as const;

function relevantGames() {
  return getGames().filter(
    (game) =>
      game.season === 2026 &&
      game.gameType !== "scrimmage" &&
      (districtSchoolSet.has(game.homeSchoolSlug ?? "") ||
        districtSchoolSet.has(game.awaySchoolSlug ?? "")),
  );
}

test("District 8 has 49 unique canonical games and ten real games per school", () => {
  const games = relevantGames();
  assert.equal(games.length, 49);
  assert.equal(new Set(games.map((game) => game.id)).size, 49);

  for (const school of districtSchools) {
    const schedule = getGamesForSchool(school).filter(
      (game) => game.season === 2026 && game.gameType !== "scrimmage",
    );
    assert.equal(schedule.length, 10, `${school} should have ten real games`);
    assert.equal(schedule.some((game) => game.gameType === "bye"), false);
  }
});

test("all 28 completed games retain canonical scores, winners, times, and identities", () => {
  const byId = new Map(getGames().map((game) => [game.id, game]));
  for (const [id, kickoff, homeScore, awayScore] of completedGames) {
    const game = byId.get(id);
    assert.ok(game, id);
    assert.equal(game.status, "final", id);
    assert.equal(game.kickoff, kickoff, id);
    assert.equal(game.homeScore, homeScore, id);
    assert.equal(game.awayScore, awayScore, id);
    assert.deepEqual(
      { home: game.score?.home, away: game.score?.away },
      { home: homeScore, away: awayScore },
      id,
    );
    assert.notEqual(homeScore, awayScore, id);
    assert.equal(game.sourceLabel, "MaxPreps", id);
  }

  assert.equal(byId.get("crawford-at-marlin-2026-week-4")?.score?.period, "Final (OT)");
  assert.equal(byId.get("bruceville-eddy-at-hubbard-2026-week-4")?.awayTeam, "Bruceville-Eddy");
  assert.equal(byId.get("cross-roads-at-meridian-2026-week-2")?.awayTeam, "Cross Roads");
  assert.equal(byId.get("rice-at-wortham-2026-week-4")?.awaySchoolSlug, "rice");
  assert.equal(byId.get("rice-at-wortham-2026-week-4")?.awayTeam, "Rice");
});

test("the 21 district games have exact orientation and kickoff once each", () => {
  const games = relevantGames().filter((game) => game.districtGame);
  assert.equal(games.length, 21);

  const actual = games
    .map((game) => [game.week, game.awaySchoolSlug, game.homeSchoolSlug, game.kickoff])
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const expected = [...districtGames].sort((a, b) =>
    JSON.stringify(a).localeCompare(JSON.stringify(b)),
  );
  assert.deepEqual(actual, expected);

  for (const game of games) {
    assert.equal(game.status, "upcoming", game.id);
    assert.equal(game.gameType, "district", game.id);
    assert.equal(game.sourceLabel, "MaxPreps", game.id);
    assert.equal(districtSchoolSet.has(game.homeSchoolSlug ?? ""), true, game.id);
    assert.equal(districtSchoolSet.has(game.awaySchoolSlug ?? ""), true, game.id);
  }
});

test("district byes are absences, not game rows", () => {
  const byeWeeks: Record<(typeof districtSchools)[number], number> = {
    crawford: 10,
    frost: 5,
    hubbard: 11,
    mart: 9,
    meridian: 6,
    santo: 7,
    wortham: 8,
  };

  for (const school of districtSchools) {
    const byeWeekGames = relevantGames().filter(
      (game) =>
        game.week === byeWeeks[school] &&
        (game.homeSchoolSlug === school || game.awaySchoolSlug === school),
    );
    assert.deepEqual(byeWeekGames, [], `${school} bye should not create a game`);
  }
});

test("records and District 8 standings derive from canonical games", () => {
  const expectedRecords = new Map([
    ["crawford", [2, 2]],
    ["frost", [3, 1]],
    ["hubbard", [2, 2]],
    ["mart", [1, 3]],
    ["meridian", [1, 3]],
    ["santo", [3, 1]],
    ["wortham", [2, 2]],
  ]);
  const standings = getStandingsForDistrictId(districtId);

  assert.deepEqual(
    standings.map((standing) => standing.schoolSlug).sort(),
    [...districtSchools].sort(),
  );
  for (const standing of standings) {
    assert.deepEqual(
      [standing.overallWins, standing.overallLosses],
      expectedRecords.get(standing.schoolSlug),
      standing.schoolSlug,
    );
    assert.deepEqual(
      [standing.districtWins, standing.districtLosses],
      [0, 0],
      standing.schoolSlug,
    );
  }
});

test("no reversed-pair duplicates or synthetic bye opponents exist", () => {
  const keys = relevantGames().map((game) => {
    const pair = [game.homeSchoolSlug, game.awaySchoolSlug].sort().join("|");
    return `${game.season}|${game.kickoff?.slice(0, 10)}|${pair}`;
  });
  assert.equal(new Set(keys).size, keys.length);
  assert.equal(relevantGames().some((game) => game.awaySchoolSlug === "bye"), false);
});

test("existing Santo statistics remain attached to preserved game IDs", () => {
  const statGameIds = new Set(getAllGameStats().map((stats) => stats.gameId));
  for (const id of [
    "santo-at-chilton-2026-week-1",
    "santo-at-dublin-2026-week-2",
    "haskell-at-santo-2026-week-3",
  ]) {
    assert.equal(statGameIds.has(id), true, id);
  }
});
