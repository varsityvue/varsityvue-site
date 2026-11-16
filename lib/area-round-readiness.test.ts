import assert from "node:assert/strict";
import test from "node:test";
import { getAreaRoundReadiness, getAreaScheduleMissingDetails } from "./area-round-readiness";
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


test("readiness rejects ambiguous kickoff instants and impossible dates", () => {
  const game = {...final("Cisco", "Nocona", 24, 7), venue: "Bulldog Stadium, McGregor, TX", sourceLabel: "School announcement"};
  for (const kickoff of ["2026-11-20", "2026-11-20T19:00:00", "2026-02-30T19:00:00-06:00", "2026-11-20T24:00:00-06:00", "invalid"]) {
    assert.deepEqual(getAreaScheduleMissingDetails({...game, kickoff}), ["confirmed kickoff"], kickoff);
  }
  for (const kickoff of ["2026-11-20T19:00:00-06:00", "2026-11-21T01:00:00Z"]) {
    assert.deepEqual(getAreaScheduleMissingDetails({...game, kickoff}), [], kickoff);
  }
});

test("readiness never treats placeholder venues or whitespace sources as confirmed", () => {
  const game = {...final("Cisco", "Nocona", 24, 7), kickoff: "2026-11-20T19:00:00-06:00", sourceLabel: "School announcement"};
  for (const venue of [" ", "Venue TBA", "TBD, Texas", "Site pending", "To be announced"]) {
    assert.deepEqual(getAreaScheduleMissingDetails({...game, venue}), ["confirmed venue"], venue);
  }
  assert.deepEqual(getAreaScheduleMissingDetails({...game, venue: "Bulldog Stadium, McGregor, TX", sourceLabel: " "}), ["source attribution"]);
});
