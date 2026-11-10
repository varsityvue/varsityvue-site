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
  assert.equal(queue.length, 96);
  assert.ok(queue.every((item) => item.status === "awaiting-results"));
});

test("two verified first-round winners require a separately confirmed area schedule", () => {
  const games = [final("Cisco", "Nocona", 24, 7), final("Bosqueville", "Johnson City", 14, 3)];
  const entry = getAreaRoundReadiness(games).find((item) => item.region === "2A Division I · Region II" && item.slot === 1)!;
  assert.deepEqual(entry.teams, ["Cisco", "Bosqueville"]);
  assert.equal(entry.status, "needs-schedule");
});

test("published area game retains missing kickoff and venue as review requirements", () => {
  const games = [
    final("Cisco", "Nocona", 24, 7), final("Bosqueville", "Johnson City", 14, 3),
    { id: "area-1", season: 2026, gameType: "playoff", playoff: { round: "Area", division: "2A D1", region: "II" },
      homeTeam: "Cisco", awayTeam: "Bosqueville", status: "scheduled", districtGame: false, sourceLabel: "School confirmation" } as Game,
  ];
  const entry = getAreaRoundReadiness(games).find((item) => item.region === "2A Division I · Region II" && item.slot === 1)!;
  assert.equal(entry.status, "needs-details");
  assert.deepEqual(entry.missing, ["confirmed kickoff", "confirmed venue"]);
});

test("area schedules from another division or region cannot satisfy a bracket slot", () => {
  const base = [final("Cisco", "Nocona", 24, 7), final("Bosqueville", "Johnson City", 14, 3)];
  const area = {
    id: "wrong-area", season: 2026, gameType: "playoff",
    playoff: { round: "Area", division: "2A Division II", region: "II" },
    homeTeam: "Cisco", awayTeam: "Bosqueville",
    status: "scheduled", districtGame: false,
  } as Game;
  const lookup = (games: Game[]) => getAreaRoundReadiness(games)
    .find((item) => item.region === "2A Division I · Region II" && item.slot === 1)!;
  assert.equal(lookup([...base, area]).status, "needs-schedule");
  assert.equal(lookup([...base, { ...area, playoff: { ...area.playoff!, division: "2A Division I", region: "I" } }]).status, "needs-schedule");
});

test("duplicate area game records are flagged instead of silently accepted", () => {
  const games = [
    final("Cisco", "Nocona", 24, 7),
    final("Bosqueville", "Johnson City", 14, 3),
    ...["area-a", "area-b"].map((id) => ({
      id, season: 2026, gameType: "playoff" as const,
      playoff: { round: "Area", division: "2A D1", region: "II" },
      homeTeam: "Cisco", awayTeam: "Bosqueville",
      status: "scheduled" as const, districtGame: false,
    } as Game)),
  ];
  const entry = getAreaRoundReadiness(games).find((item) => item.region === "2A Division I · Region II" && item.slot === 1)!;
  assert.equal(entry.status, "duplicate-schedule");
});
