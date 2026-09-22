import assert from "node:assert/strict";
import test from "node:test";

import { getDistrictById } from "@/lib/districts";
import {
  filterUpcomingGamesForSchool,
  getGamesForSchool,
  getUpcomingGamesForSchool,
} from "@/lib/games";
import { getSchoolBySlug, getSchoolsByDistrictId } from "@/lib/schools";
import {
  getStandingForSchoolFromGames,
  getStandingsForDistrictIdFromGames,
} from "@/lib/standings";

const asOf = new Date("2026-09-22T12:00:00-05:00");
const districtId = "3a-d2-district-4";
const districtMembers = [
  "breckenridge",
  "city-view",
  "henrietta",
  "holliday",
  "jacksboro",
  "merkel",
];

test("Jacksboro uses the Texas UIL District 4-3A Division II identity", () => {
  const school = getSchoolBySlug("jacksboro");
  const district = getDistrictById(districtId);

  assert.equal(school?.districtId, districtId);
  assert.equal(district?.name, "3A Division II District 4");
  assert.deepEqual(
    getSchoolsByDistrictId(districtId).map((candidate) => candidate.slug).sort(),
    districtMembers,
  );
  assert.equal(getSchoolBySlug("santo")?.districtId, "2a-d2-district-8");
});

test("Jacksboro schedule derives a 4-0 record and six upcoming games", () => {
  const games = getGamesForSchool("jacksboro", asOf);
  const standing = getStandingForSchoolFromGames("jacksboro", games);
  const upcoming = getUpcomingGamesForSchool("jacksboro", asOf);

  assert.equal(games.length, 11);
  assert.equal(new Set(games.map((game) => game.id)).size, games.length);
  assert.equal(standing?.overallWins, 4);
  assert.equal(standing?.overallLosses, 0);
  assert.equal(upcoming.length, 6);
  assert.equal(upcoming[0]?.id, "jacksboro-at-cisco-2026-week-5");
  assert.equal(upcoming.some((game) => game.gameType === "bye"), false);
  assert.equal(games.filter((game) => game.id === "millsap-at-jacksboro-2026-week-1").length, 1);
  assert.equal(games.filter((game) => game.id === "jacksboro-at-cisco-2026-week-5").length, 1);
});

test("the upcoming count drops to five after Cisco becomes final", () => {
  const gamesAfterCisco = getGamesForSchool("jacksboro", asOf).map((game) =>
    game.id === "jacksboro-at-cisco-2026-week-5"
      ? { ...game, status: "final" as const, homeScore: 0, awayScore: 0 }
      : game,
  );

  assert.equal(
    filterUpcomingGamesForSchool(gamesAfterCisco, "jacksboro", new Date("2026-09-26T12:00:00-05:00")).length,
    5,
  );
});

test("Jacksboro District Race is scoped and excludes Santo", () => {
  const games = getGamesForSchool("jacksboro", asOf);
  const standings = getStandingsForDistrictIdFromGames(districtId, games);

  assert.deepEqual(
    standings.map((standing) => standing.schoolSlug).sort(),
    districtMembers,
  );
  assert.equal(standings.some((standing) => standing.schoolSlug === "santo"), false);
});

test("the opponent sentinel cannot produce pooled standings", () => {
  const games = getGamesForSchool("jacksboro", asOf);
  assert.deepEqual(getStandingsForDistrictIdFromGames("opponent", games), []);
});
