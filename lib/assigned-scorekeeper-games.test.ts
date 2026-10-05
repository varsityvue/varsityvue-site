import assert from "node:assert/strict";
import test from "node:test";
import { assignedScorekeeperGames } from "./assigned-scorekeeper-games";
import { getGameById, getGames, normalizeGameStatus } from "./games";
import type { Game } from "@/types/platform";

const base = getGameById("albany-at-stamford-2026-week-7")!;
assert.ok(base);
const assigned = new Set(["albany"]);
const ready = () => true;
function fixture(id: string, patch: Partial<Game> = {}): Game {
  return { ...base, id, status: "upcoming", ...patch };
}
test("either assigned participant finds Week 7–11 and later 2026 playable weeks", () => {
  const games = [7, 8, 9, 10, 11, 12].map((week) => fixture(`week-${week}`, { week }));
  for (const school of ["albany", "stamford"]) {
    assert.equal(assignedScorekeeperGames(games, new Set([school]), ready).length, 6);
  }
  assert.deepEqual(assignedScorekeeperGames(games, new Set(), ready), []);
  assert.deepEqual(assignedScorekeeperGames(games, new Set(["other"]), ready), []);
});
test("2026 historical floor, canonical scope, identity and playable status remain bounded", () => {
  const excluded: Partial<Game>[] = [
    { season: 2025 }, { season: 2027 }, { week: undefined }, { week: 1 }, { week: 2 },
    { gameType: "bye" }, { gameType: "scrimmage" }, { status: "final" },
    { status: "postponed" }, { status: "cancelled" },
    { awaySchoolSlug: undefined, homeSchoolSlug: undefined },
  ];
  assert.deepEqual(assignedScorekeeperGames(excluded.map((p, i) => fixture(`excluded-${i}`, p)), assigned, ready), []);
  assert.deepEqual(assignedScorekeeperGames([base], assigned, () => false), []);
  assert.deepEqual(assignedScorekeeperGames([fixture("historical", { week: 3, status: "scheduled" })], assigned, ready).map(g => g.id), ["historical"]);
});
test("LIVE first, upcoming nearest first, TBD last, unresolved newest first; no six-game truncation", () => {
  const games = [
    fixture("old-pending", { week: 3, status: "scheduled", kickoff: "2026-09-11T19:00:00-05:00" }),
    fixture("later", { week: 8, kickoff: "2026-10-16T19:00:00-05:00" }),
    fixture("now-live", { status: "live" }), fixture("next"),
    fixture("new-pending", { week: 6, status: "scheduled", kickoff: "2026-10-02T19:00:00-05:00" }),
    fixture("tbd", { kickoff: undefined }),
    fixture("week9", { week: 9, kickoff: "2026-10-23T19:00:00-05:00" }),
  ];
  assert.deepEqual(assignedScorekeeperGames(games, assigned, ready).map(g => g.id),
    ["now-live", "next", "later", "week9", "tbd", "new-pending", "old-pending"]);
  assert.equal(games[0].id, "old-pending", "input order is not mutated");
});
test("real 2026 catalog makes Friday Week 7 discoverable before kickoff without opening reporting", () => {
  const games = getGames().map(game => normalizeGameStatus(game, new Date("2026-10-05T20:00:00Z")));
  const results = assignedScorekeeperGames(games, assigned, ready);
  const week7 = results.find(g => g.id === base.id);
  assert.ok(week7);
  assert.equal(week7.status, "upcoming");
  assert.equal(results[0].id, base.id);
});
test("kickoff order compares instants across offsets and treats invalid time as TBD", () => {
  const games = [fixture("later", { kickoff: "2026-11-01T01:15:00-06:00" }),
    fixture("earlier", { kickoff: "2026-11-01T01:45:00-05:00" }),
    fixture("unknown", { kickoff: "TBD" })];
  assert.deepEqual(assignedScorekeeperGames(games, assigned, ready).map(g => g.id), ["earlier", "later", "unknown"]);
});
