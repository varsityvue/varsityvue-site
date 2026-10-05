import assert from "node:assert/strict";
import test from "node:test";
import { parseWeeklyParams, selectWeeklyGames, weeklyAppliedRefinements, updateWeeklyParams, weeklyUrl, type WeeklyGame } from "./unified-games";

const now = new Date("2026-10-05T18:00:00Z");
const game: WeeklyGame = {
  id: "fixture", season: 2026, week: 7, gameType: "regular", status: "upcoming",
  kickoff: "2026-10-09T19:00:00-05:00", districtGame: true,
  homeTeam: "Home", awayTeam: "Away", homeSchoolSlug: "home", awaySchoolSlug: "away",
  classification: "2A Division I", searchText: "home away venue",
  locationInfo: { locationQuality: "verified", locationSource: "home_venue", venueName: "Venue", city: "Town", latitude: 32, longitude: -99 },
};
const games = [game, { ...game, id: "final", status: "final" as const }, { ...game, id: "cancelled", status: "cancelled" as const }];
const parse = (raw: Record<string, string>) => parseWeeklyParams(raw, games, now);
const restored = (url: string) => parse(Object.fromEntries(new URL(url, "https://varsityvue.com").searchParams));

test("applied refinement count includes independent legacy scopes, search and Nearby radius", () => {
  const p = parse({ season: "2026", week: "7", q: "Home", filter: "legacy-completed-current-verified", classification: "Unavailable class", district: "1", following: "1", mode: "nearby", radius: "100", intent: "scores" });
  const refinements = weeklyAppliedRefinements(p);
  assert.deepEqual(refinements.map(r => r.key), ["q", "filter", "current", "verified", "classification", "district", "following", "radius"]);
  assert.equal(weeklyAppliedRefinements({ ...p, mode: "all" }).length, 7);
  assert.equal(weeklyAppliedRefinements(parse({ season: "2026", week: "7" })).length, 0);
  for (const route of ["/games", "/scoreboard"] as const) for (const refinement of refinements) {
    const next = updateWeeklyParams(p, refinement.clear);
    assert.deepEqual(restored(weeklyUrl(p, refinement.clear, route)), next);
    assert.equal(next.intent, true);
    for (const key of Object.keys(p) as (keyof typeof p)[]) {
      if (key !== refinement.key) assert.equal(next[key], p[key], key);
    }
    assert.equal(weeklyAppliedRefinements(next).length, refinements.length - 1);
  }
});

test("independent scope clears preserve intentional status intersections", () => {
  const p = parse({ week: "7", filter: "legacy-completed-current-verified" });
  assert.deepEqual(selectWeeklyGames(games, p, new Set(), now), []);
  const clearedCurrent = restored(weeklyUrl(p, { current: false }));
  assert.equal(clearedCurrent.filter, "completed"); assert.equal(clearedCurrent.verified, true);
  assert.deepEqual(selectWeeklyGames(games, clearedCurrent, new Set(), now).map(r => r.game.id), ["final"]);
  const clearedStatus = restored(weeklyUrl(p, { filter: "all", current: p.current, verified: p.verified }));
  assert.equal(clearedStatus.current, true); assert.equal(clearedStatus.verified, true);
  assert.deepEqual(updateWeeklyParams(p, { filter: "all" }), { ...p, filter: "all", current: false, verified: false });
});

test("week season mode and shared-link restoration retain exact refinements and scores intent", () => {
  for (const scope of [{ result: "verified" }, { state: "current" }, { view: "current" }, { status: "district" }, { status: "final" }] as Record<string,string>[]) {
    const p = parse({ season: "2026", week: "7", ...scope, q: "Home", classification: "Unavailable class", following: "1", radius: "150", intent: "scores" });
    for (const route of ["/games", "/scoreboard"] as const) for (const updates of [{ week: "8" }, { season: "2025", week: "all" }, { mode: "nearby" as const }]) {
      assert.deepEqual(restored(weeklyUrl(p, updates, route)), updateWeeklyParams(p, updates));
    }
  }
  // result=current is not an applied compatibility constraint. state=current is.
  const p = parse({ season: "2026", week: "7", result: "current" });
  assert.equal(p.current, false); assert.equal(p.verified, false);
  assert.equal(weeklyAppliedRefinements(p).length, 0);
});

test("filter clearing preserves combinations, combined status, classification, following and Nearby selection", () => {
  const p = parse({ season: "2026", week: "7", q: "Home", filter: "upcoming", classification: "2A Division I", district: "1", following: "1", mode: "nearby", radius: "10" });
  const center = { latitude: 32, longitude: -99 };
  assert.deepEqual(selectWeeklyGames(games, p, new Set(["home"]), now, center).map(r => r.game.id), ["fixture"]);
  const clearSearch = weeklyAppliedRefinements(p).find(r => r.key === "q")!;
  assert.deepEqual(selectWeeklyGames(games, restored(weeklyUrl(p, clearSearch.clear)), new Set(["home"]), now, center).map(r => r.game.id), ["fixture"]);
  assert.deepEqual(selectWeeklyGames(games, { ...p, following: false, classification: "Unavailable class" }, new Set(), now, center), []);
});

