import assert from "node:assert/strict";
import test from "node:test";
import { auditPublishedPlayoffGames } from "./playoff-bracket-schedule-audit";
import type { Game } from "@/types/platform";
const fixture = (homeTeam: string, awayTeam: string, region = "II"): Game => ({
  id: homeTeam + "-" + awayTeam, season: 2026, gameType: "playoff",
  playoff: { round: "Bi-District", division: "2A Division I", region },
  homeTeam, awayTeam, status: "upcoming", districtGame: false,
});
test("published matchup must agree with bracket region", () => {
  assert.deepEqual(auditPublishedPlayoffGames([fixture("Cisco","Nocona")]), []);
  assert.equal(auditPublishedPlayoffGames([fixture("Cisco","Nocona","I")])[0].issue, "pairing-not-in-region");
});
test("duplicate published matchups are flagged", () => {
  const a = fixture("Cisco","Nocona");
  const b = { ...a, id: "other" };
  assert.ok(auditPublishedPlayoffGames([a,b]).some((item) => item.issue === "duplicate-matchup"));
});
