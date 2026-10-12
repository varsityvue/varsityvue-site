import assert from "node:assert/strict";
import type { Game } from "@/types/platform";

// Frozen expectations from the approved District 12 evidence package.
// Used only by tests; never imported by runtime code or installed into a database.
export const retrospectiveDistrict12Results: Game[] = [
  {
    "id": "burnet-at-blanco-2026-week-4",
    "season": 2026,
    "week": 4,
    "gameType": "regular",
    "status": "final",
    "homeSchoolSlug": "blanco",
    "awaySchoolSlug": "burnet",
    "homeTeam": "Blanco",
    "awayTeam": "Burnet",
    "kickoff": "2026-09-18T19:00:00-05:00",
    "districtGame": false,
    "homeScore": 28,
    "awayScore": 7,
    "score": {
      "home": 28,
      "away": 7,
      "period": "Final"
    },
    "coverageStatus": "none",
    "sourceStatus": "verified",
    "sourceLabel": "District 12 reconciliation: MaxPreps / Pigskin Prep / AP results"
  },
  {
    "id": "gatesville-at-burnet-2026-week-5",
    "season": 2026,
    "week": 5,
    "gameType": "regular",
    "status": "final",
    "homeSchoolSlug": "burnet",
    "awaySchoolSlug": "gatesville",
    "homeTeam": "Burnet",
    "awayTeam": "Gatesville",
    "kickoff": "2026-09-25T19:00:00-05:00",
    "districtGame": false,
    "homeScore": 7,
    "awayScore": 42,
    "score": {
      "home": 7,
      "away": 42,
      "period": "Final"
    },
    "coverageStatus": "none",
    "sourceStatus": "verified",
    "sourceLabel": "District 12 reconciliation: MaxPreps / Pigskin Prep / AP results"
  },
  {
    "id": "burnet-at-china-spring-2026-week-7",
    "season": 2026,
    "week": 7,
    "gameType": "regular",
    "status": "final",
    "homeSchoolSlug": "china-spring",
    "awaySchoolSlug": "burnet",
    "homeTeam": "China Spring",
    "awayTeam": "Burnet",
    "kickoff": "2026-10-09T19:00:00-05:00",
    "districtGame": true,
    "homeScore": 31,
    "awayScore": 33,
    "score": {
      "home": 31,
      "away": 33,
      "period": "Final"
    },
    "coverageStatus": "none",
    "sourceStatus": "verified",
    "sourceLabel": "District 12 reconciliation: MaxPreps / Pigskin Prep / AP results"
  },
  {
    "id": "china-spring-at-glen-rose-2026-week-4",
    "season": 2026,
    "week": 4,
    "gameType": "regular",
    "status": "final",
    "homeSchoolSlug": "glen-rose",
    "awaySchoolSlug": "china-spring",
    "homeTeam": "Glen Rose",
    "awayTeam": "China Spring",
    "kickoff": "2026-09-18T19:00:00-05:00",
    "districtGame": false,
    "homeScore": 42,
    "awayScore": 39,
    "score": {
      "home": 42,
      "away": 39,
      "period": "Final"
    },
    "coverageStatus": "none",
    "sourceStatus": "verified",
    "sourceLabel": "District 12 reconciliation: MaxPreps / Pigskin Prep / AP results"
  },
  {
    "id": "brownwood-at-china-spring-2026-week-5",
    "season": 2026,
    "week": 5,
    "gameType": "regular",
    "status": "final",
    "homeSchoolSlug": "china-spring",
    "awaySchoolSlug": "brownwood",
    "homeTeam": "China Spring",
    "awayTeam": "Brownwood",
    "kickoff": "2026-09-25T19:00:00-05:00",
    "districtGame": false,
    "homeScore": 21,
    "awayScore": 42,
    "score": {
      "home": 21,
      "away": 42,
      "period": "Final"
    },
    "coverageStatus": "none",
    "sourceStatus": "verified",
    "sourceLabel": "District 12 reconciliation: MaxPreps / Pigskin Prep / AP results"
  },
  {
    "id": "austin-eastside-memorial-at-jarrell-2026-week-4",
    "season": 2026,
    "week": 4,
    "gameType": "regular",
    "status": "final",
    "homeSchoolSlug": "jarrell",
    "awaySchoolSlug": "austin-eastside-memorial",
    "homeTeam": "Jarrell",
    "awayTeam": "Austin Eastside Memorial",
    "kickoff": "2026-09-18T19:00:00-05:00",
    "districtGame": false,
    "homeScore": 49,
    "awayScore": 6,
    "score": {
      "home": 49,
      "away": 6,
      "period": "Final"
    },
    "coverageStatus": "none",
    "sourceStatus": "verified",
    "sourceLabel": "District 12 reconciliation: MaxPreps / Pigskin Prep / AP results"
  },
  {
    "id": "jarrell-at-madisonville-2026-week-5",
    "season": 2026,
    "week": 5,
    "gameType": "regular",
    "status": "final",
    "homeSchoolSlug": "madisonville",
    "awaySchoolSlug": "jarrell",
    "homeTeam": "Madisonville",
    "awayTeam": "Jarrell",
    "kickoff": "2026-09-25T19:00:00-05:00",
    "districtGame": false,
    "homeScore": 31,
    "awayScore": 34,
    "score": {
      "home": 31,
      "away": 34,
      "period": "Final"
    },
    "coverageStatus": "none",
    "sourceStatus": "verified",
    "sourceLabel": "District 12 reconciliation: MaxPreps / Pigskin Prep / AP results"
  },
  {
    "id": "marble-falls-at-jarrell-2026-week-7",
    "season": 2026,
    "week": 7,
    "gameType": "regular",
    "status": "final",
    "homeSchoolSlug": "jarrell",
    "awaySchoolSlug": "marble-falls",
    "homeTeam": "Jarrell",
    "awayTeam": "Marble Falls",
    "kickoff": "2026-10-09T19:00:00-05:00",
    "districtGame": true,
    "homeScore": 49,
    "awayScore": 7,
    "score": {
      "home": 49,
      "away": 7,
      "period": "Final"
    },
    "coverageStatus": "none",
    "sourceStatus": "verified",
    "sourceLabel": "District 12 reconciliation: MaxPreps / Pigskin Prep / AP results"
  },
  {
    "id": "austin-lasa-at-marble-falls-2026-week-4",
    "season": 2026,
    "week": 4,
    "gameType": "regular",
    "status": "final",
    "homeSchoolSlug": "marble-falls",
    "awaySchoolSlug": "austin-lasa",
    "homeTeam": "Marble Falls",
    "awayTeam": "Austin LASA",
    "kickoff": "2026-09-18T19:00:00-05:00",
    "districtGame": false,
    "homeScore": 55,
    "awayScore": 0,
    "score": {
      "home": 55,
      "away": 0,
      "period": "Final"
    },
    "coverageStatus": "none",
    "sourceStatus": "verified",
    "sourceLabel": "District 12 reconciliation: MaxPreps / Pigskin Prep / AP results"
  },
  {
    "id": "marble-falls-at-geronimo-navarro-2026-week-5",
    "season": 2026,
    "week": 5,
    "gameType": "regular",
    "status": "final",
    "homeSchoolSlug": "geronimo-navarro",
    "awaySchoolSlug": "marble-falls",
    "homeTeam": "Geronimo Navarro",
    "awayTeam": "Marble Falls",
    "kickoff": "2026-09-25T19:00:00-05:00",
    "districtGame": false,
    "homeScore": 34,
    "awayScore": 17,
    "score": {
      "home": 34,
      "away": 17,
      "period": "Final"
    },
    "coverageStatus": "none",
    "sourceStatus": "verified",
    "sourceLabel": "District 12 reconciliation: MaxPreps / Pigskin Prep / AP results"
  },
  {
    "id": "wimberley-at-lampasas-2026-week-4",
    "season": 2026,
    "week": 4,
    "gameType": "regular",
    "status": "final",
    "homeSchoolSlug": "lampasas",
    "awaySchoolSlug": "wimberley",
    "homeTeam": "Lampasas",
    "awayTeam": "Wimberley",
    "kickoff": "2026-09-18T19:00:00-05:00",
    "districtGame": false,
    "homeScore": 14,
    "awayScore": 35,
    "score": {
      "home": 14,
      "away": 35,
      "period": "Final"
    },
    "coverageStatus": "none",
    "sourceStatus": "verified",
    "sourceLabel": "District 12 reconciliation: MaxPreps / Pigskin Prep / AP results"
  },
  {
    "id": "lago-vista-at-lampasas-2026-week-5",
    "season": 2026,
    "week": 5,
    "gameType": "regular",
    "status": "final",
    "homeSchoolSlug": "lampasas",
    "awaySchoolSlug": "lago-vista",
    "homeTeam": "Lampasas",
    "awayTeam": "Lago Vista",
    "kickoff": "2026-09-25T19:00:00-05:00",
    "districtGame": false,
    "homeScore": 42,
    "awayScore": 43,
    "score": {
      "home": 42,
      "away": 43,
      "period": "Final"
    },
    "coverageStatus": "none",
    "sourceStatus": "verified",
    "sourceLabel": "District 12 reconciliation: MaxPreps / Pigskin Prep / AP results"
  }
];

export const retrospectiveDistrict12Ids = new Set(retrospectiveDistrict12Results.map(g => g.id));

// Immutable migration catalogs describe the application at their original dates.
// Assert every newly published historical final before comparing that legacy scope.
export function historicalCatalogBeforeDistrict12(games: Game[]): Game[] {
  for (const expected of retrospectiveDistrict12Results) {
    const rows = games.filter(g => g.id === expected.id);
    assert.equal(rows.length, 1, expected.id);
    const actual = rows[0];
    for (const key of ["season", "week", "gameType", "status", "kickoff", "districtGame", "homeSchoolSlug", "awaySchoolSlug", "homeScore", "awayScore", "sourceStatus"] as const) {
      assert.equal(actual[key], expected[key], `${expected.id}: ${key}`);
    }
    assert.deepEqual(actual.score, expected.score, `${expected.id}: nested score`);
  }
  const jarrell = games.find(g => g.id === "austin-at-jarrell-2026-week-3");
  assert.ok(jarrell);
  assert.equal(jarrell.homeSchoolSlug, "austin");
  assert.equal(jarrell.awaySchoolSlug, "jarrell");
  assert.equal(jarrell.homeScore, 13);
  assert.equal(jarrell.awayScore, 32);
  assert.deepEqual(jarrell.score, { home: 13, away: 32, period: "Final" });
  assert.equal(jarrell.kickoff, "2026-09-11T19:00:00-05:00");
  return games.filter(g => !retrospectiveDistrict12Ids.has(g.id)).map(g =>
    g.id === jarrell.id ? { ...g, homeSchoolSlug: "jarrell", awaySchoolSlug: "austin", homeTeam: "Jarrell", awayTeam: "Austin", homeScore: 32, awayScore: 13, score: { home: 32, away: 13, period: "Final" } } : g);
}
