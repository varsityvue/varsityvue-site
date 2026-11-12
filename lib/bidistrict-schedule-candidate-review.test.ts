import assert from "node:assert/strict";
import test from "node:test";
import { getBiDistrictReadiness } from "./bidistrict-readiness";
import { reviewBiDistrictScheduleCandidates, type BiDistrictScheduleCandidate } from "./bidistrict-schedule-candidate-review";

const bracket = getBiDistrictReadiness([]);
const valid: BiDistrictScheduleCandidate = {
  division: "2A Division I", region: "Region II", slot: 2,
  teams: ["Bosqueville", "Johnson City"],
  kickoff: "2026-11-12T19:00:00-06:00",
  venue: "Example Stadium, Texas",
  sourceLabel: "School athletic department",
  sourceUrl: "https://example.org/schedule",
};

test("valid matching research is only ready for human review, never published", () => {
  const [review] = reviewBiDistrictScheduleCandidates([valid], bracket);
  assert.equal(review.readyForHumanReview, true);
  assert.deepEqual(review.issues, []);
});

test("rejects mismatched teams, incomplete details, and duplicate slot submissions", () => {
  const invalid = { ...valid, teams: ["Bosqueville", "Not Opponent"] as const,
    kickoff: "2026-11-12T19:00:00", venue: "TBD", sourceLabel: "", sourceUrl: "http://example.org" };
  const results = reviewBiDistrictScheduleCandidates([invalid, invalid], bracket);
  assert.equal(results.length, 2);
  for (const result of results) {
    assert.equal(result.readyForHumanReview, false);
    assert.ok(result.issues.includes("teams do not match bracket"));
    assert.ok(result.issues.includes("duplicate candidate for bracket slot"));
    assert.ok(result.issues.includes("kickoff requires a valid timezone-aware timestamp"));

    assert.ok(result.issues.includes("source attribution required"));
    assert.ok(result.issues.includes("HTTPS source URL required"));
  }
});

test("rejects unknown bracket positions", () => {
  const [review] = reviewBiDistrictScheduleCandidates([{ ...valid, slot: 99 }], bracket);
  assert.ok(review.issues.includes("unknown bracket slot"));
});


test("rejects impossible calendar dates, normalized midnight, and trailing content", () => {
  for (const kickoff of ["2026-02-30T19:00:00-06:00", "2026-11-12T24:00:00-06:00", "2026-11-12T19:00junkZ", "2026-11-12T19:00:00+25:00"]) {
    const [review] = reviewBiDistrictScheduleCandidates([{ ...valid, kickoff }], bracket);
    assert.ok(review.issues.includes("kickoff requires a valid timezone-aware timestamp"), kickoff);
  }
  for (const kickoff of ["2026-11-12T19:00-06:00", "2026-11-13T01:00:00Z"]) {
    assert.equal(reviewBiDistrictScheduleCandidates([{ ...valid, kickoff }], bracket)[0].readyForHumanReview, true);
  }
});

test("every existing record requires reconciliation, including incomplete schedules and verified finals", () => {
  for (const status of ["needs-details", "scheduled", "verified-final", "awaiting-verification", "duplicate-record"] as const) {
    const existing = bracket.map((entry) => entry.division === valid.division && entry.region === valid.region && entry.slot === valid.slot
      ? { ...entry, status, gameId: "existing-game" } : entry);
    assert.ok(reviewBiDistrictScheduleCandidates([valid], existing)[0].issues.includes("existing game requires manual reconciliation"));
  }
});

test("division and region mismatches cannot use another bracket's matchup", () => {
  for (const candidate of [{ ...valid, division: "3A Division I" }, { ...valid, region: "Region I" }]) {
    assert.equal(reviewBiDistrictScheduleCandidates([candidate], bracket)[0].readyForHumanReview, false);
  }
});

 test("unknown secondary fields do not block a source-backed matching kickoff", () => {
  for (const isNeutralSite of [true, false, null]) {
    const [review] = reviewBiDistrictScheduleCandidates([{...valid, venue:null, isNeutralSite}], bracket);
    assert.equal(review.readyForHumanReview,true);
  }
});
