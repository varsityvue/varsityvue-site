import assert from "node:assert/strict";
import test from "node:test";
import { getAreaRoundReadiness } from "./area-round-readiness";
import type { Game } from "@/types/platform";

const final = (a: string, b: string, home: number, away: number): Game => ({
  id: `${a}-${b}`, season: 2026, gameType: "playoff",
  playoff: { round: "Bi-District", division: "2A D1", region: "II" },
  homeTeam: a, awayTeam: b, homeScore: home, awayScore: away,
  publicScoreVerified: true, status: "final", districtGame: false,
});

test("unverified or absent first-round results never create a publishable pairing", () => {
  const queue = getAreaRoundReadiness([]);
  assert.equal(queue.length, 12);
  assert.ok(queue.every((item) => item.status === "awaiting-results"));
});

test("two verified first-round winners require a separately confirmed area schedule", () => {
  const games = [final("Cisco", "Nocona", 24, 7), final("Bosqueville", "Johnson City", 14, 3)];
  const entry = getAreaRoundReadiness(games)[0];
  assert.deepEqual(entry.teams, ["Cisco", "Bosqueville"]);
  assert.equal(entry.status, "needs-schedule");
});

test("published area game retains missing kickoff and venue as review requirements", () => {
  const games = [
    final("Cisco", "Nocona", 24, 7), final("Bosqueville", "Johnson City", 14, 3),
    { id: "area-1", season: 2026, gameType: "playoff", playoff: { round: "Area", division: "2A D1", region: "II" },
      homeTeam: "Cisco", awayTeam: "Bosqueville", status: "scheduled", districtGame: false, sourceLabel: "School confirmation" } as Game,
  ];
  const entry = getAreaRoundReadiness(games)[0];
  assert.equal(entry.status, "scheduled");
  assert.deepEqual(entry.missing, ["confirmed kickoff", "confirmed venue"]);
});
