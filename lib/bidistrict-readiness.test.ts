import assert from "node:assert/strict";
import test from "node:test";
import { getBiDistrictReadiness } from "./bidistrict-readiness";
import type { Game } from "@/types/platform";

const game = (overrides: Partial<Game> = {}): Game => ({
  id: "cisco-nocona", season: 2026, gameType: "playoff",
  playoff: { round: "Bi-District", division: "2A D1", region: "II" },
  homeTeam: "Cisco", awayTeam: "Nocona", status: "scheduled", districtGame: false,
  kickoff: "2026-11-12T19:00:00-06:00", venue: "Verified venue",
  sourceLabel: "School announcement", sourceStatus: "school-official",
  ...overrides,
});

const target = (games: Game[]) => getBiDistrictReadiness(games)
  .find((item) => item.division === "2A Division I" && item.region === "Region II" && item.slot === 1)!;

test("all 192 bi-district bracket games require independent records", () => {
  const queue = getBiDistrictReadiness([]);
  assert.equal(queue.length, 192);
  assert.ok(queue.every((entry) => entry.status === "missing-record"));
});

test("a complete schedule is not a verified final", () => {
  assert.equal(target([game()]).status, "scheduled");
  assert.equal(target([game({ status: "final", homeScore: 24, awayScore: 7 })]).status, "awaiting-verification");
  assert.equal(target([game({ status: "final", homeScore: 24, awayScore: 7, publicScoreVerified: true })]).status, "verified-final");
});

test("duplicates and wrong-round records fail closed", () => {
  assert.equal(target([game(), game({ id: "duplicate" })]).status, "duplicate-record");
  assert.equal(target([game({ playoff: { round: "Area", division: "2A D1", region: "II" } })]).status, "missing-record");
});


test("readiness and advancement reject malformed verified finals", () => {
  for (const homeScore of [NaN, Infinity, -1, 1.5]) {
    assert.equal(target([game({ status: "final", homeScore, awayScore: 7, publicScoreVerified: true })]).status, "awaiting-verification");
  }
});
