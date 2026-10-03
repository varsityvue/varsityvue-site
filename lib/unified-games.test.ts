import assert from "node:assert/strict";
import test from "node:test";
import {
  parseWeeklyParams,
  selectWeeklyGames,
  weeklyUrl,
  safeGamesReturn,
  scoresDestination,
  type WeeklyGame,
} from "./unified-games";
const now = new Date("2026-10-03T18:00:00Z");
function game(
  id: string,
  week = 6,
  extra: Partial<WeeklyGame> = {},
): WeeklyGame {
  return {
    id,
    week,
    season: 2026,
    gameType: "regular",
    status: "upcoming",
    districtGame: true,
    kickoff:
      week === 6 ? "2026-10-02T19:00:00-05:00" : "2026-10-09T19:00:00-05:00",
    homeTeam: "Hawley",
    awayTeam: "De Leon",
    homeSchoolSlug: "hawley",
    awaySchoolSlug: "de-leon",
    classification: "2A Division I",
    searchText: "de leon hawley bearcats test stadium test city week " + week,
    locationInfo: {
      locationQuality: "verified",
      locationSource: "home_venue",
      venueName: "Test",
      city: "Test",
      latitude: 32,
      longitude: -99,
    },
    ...extra,
  };
}
const games = [
  game("pending"),
  game("live", 6, {
    status: "live",
    publicScoreVerified: true,
    homeScore: 0,
    awayScore: 0,
  }),
  game("final", 5, { status: "final", kickoff: "2026-09-25T19:00:00-05:00" }),
  game("next", 7),
];
test("Central current week wins over next upcoming; scores intent prefers verified live", () => {
  assert.equal(parseWeeklyParams({}, games, now).week, "6");
  assert.equal(parseWeeklyParams({ intent: "scores" }, games, now).week, "6");
  assert.equal(
    parseWeeklyParams(
      { intent: "scores" },
      games.filter((g) => g.id !== "live"),
      now,
    ).week,
    "5",
  );
});
test("explicit empty week stays selected; legacy search/result/current context is seasonwide", () => {
  assert.equal(
    parseWeeklyParams({ week: "11", filter: "completed" }, games, now).week,
    "11",
  );
  assert.equal(parseWeeklyParams({ q: "hawley" }, games, now).week, "all");
  const p = parseWeeklyParams({ status: "final" }, games, now);
  assert.equal(p.week, "all");
  assert.equal(p.verified, true);
  assert.equal(p.filter, "completed");
  assert.equal(
    parseWeeklyParams({ status: "upcoming" }, games, now).current,
    true,
  );
  assert.equal(
    parseWeeklyParams({ status: "district" }, games, now).district,
    true,
  );
});
test("strict LIVE excludes inferred kickoff and preserves 0-0; completed includes cancelled, verified-only excludes it", () => {
  const slate = [
    ...games,
    game("inferred", 6, { status: "live" }),
    game("cancelled", 6, { status: "cancelled" }),
  ];
  const p = parseWeeklyParams({ week: "all", filter: "live" }, slate, now);
  assert.deepEqual(
    selectWeeklyGames(slate, p, new Set(), now).map((r) => r.game.id),
    ["live"],
  );
  const c = { ...p, filter: "completed" as const };
  assert.deepEqual(
    selectWeeklyGames(slate, c, new Set(), now)
      .map((r) => r.game.id)
      .sort(),
    ["cancelled", "final"],
  );
  assert.deepEqual(
    selectWeeklyGames(slate, { ...c, verified: true }, new Set(), now).map(
      (r) => r.game.id,
    ),
    ["final"],
  );
});
test("combined filters intersect and canonical games dedupe even when both schools followed", () => {
  const p = parseWeeklyParams(
    {
      week: "all",
      q: "bearcats",
      following: "1",
      classification: "2A Division I",
      district: "1",
    },
    games,
    now,
  );
  assert.equal(
    selectWeeklyGames(
      [...games, games[0]],
      p,
      new Set(["hawley", "de-leon"]),
      now,
    ).length,
    4,
  );
  assert.equal(
    selectWeeklyGames(
      games,
      { ...p, classification: "6A" },
      new Set(["hawley"]),
      now,
    ).length,
    0,
  );
});
test("Nearby is distance-first, never pulls followed out-of-radius games; completed discoverable", () => {
  const near = game("near", 7, {
    homeSchoolSlug: "other",
    awaySchoolSlug: "other",
    locationInfo: {
      locationQuality: "verified",
      locationSource: "home_venue",
      venueName: "Test",
      city: "Test",
      latitude: 32,
      longitude: -99.01,
    },
  });
  const far = game("far", 7, {
    locationInfo: {
      locationQuality: "verified",
      locationSource: "home_venue",
      venueName: "Test",
      city: "Test",
      latitude: 32,
      longitude: -100,
    },
  });
  const p = parseWeeklyParams({ week: "7", mode: "nearby" }, [near, far], now);
  assert.deepEqual(
    selectWeeklyGames([far, near], p, new Set(["hawley"]), now, {
      latitude: 32,
      longitude: -99,
    }).map((r) => r.game.id),
    ["near"],
  );
  assert.equal(selectWeeklyGames([near], p, new Set(), now, null).length, 0);
});
test("links round-trip public context and discard coordinates, unknown identifiers, and open redirects", () => {
  const p = parseWeeklyParams(
    {
      week: "7",
      q: "Hawley",
      filter: "live",
      district: "1",
      radius: "25",
      mode: "nearby",
    },
    games,
    now,
  );
  assert.deepEqual(
    parseWeeklyParams(
      Object.fromEntries(new URLSearchParams(weeklyUrl(p).split("?")[1])),
      games,
      now,
    ),
    p,
  );
  assert.equal(safeGamesReturn("https://evil.example"), " /games".trim());
  assert.equal(safeGamesReturn("//evil.example/games?week=7"), "/games");
  assert.equal(
    safeGamesReturn("/games?week=7&latitude=32&user_id=private"),
    "/games?week=7",
  );
  assert.equal(
    scoresDestination({
      week: "7",
      q: "Hawley",
      latitude: "32",
      team: "unsupported",
    }),
    "/games?week=7&q=Hawley&intent=scores",
  );
});

test("redirect preserves existing valid campaign tokens without private or arbitrary context", () => {
  assert.equal(
    scoresDestination({
      utm_source: "Facebook",
      utm_campaign: "week_7",
      user_id: "secret",
    }),
    "/games?utm_source=facebook&utm_campaign=week_7&intent=scores",
  );
  assert.equal(
    scoresDestination({
      utm_source: "member@example.invalid",
      utm_campaign: "invalid text",
    }),
    "/games?intent=scores",
  );
});
