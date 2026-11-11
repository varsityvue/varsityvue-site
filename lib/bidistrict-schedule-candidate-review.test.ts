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
    assert.ok(result.issues.includes("confirmed venue required"));
    assert.ok(result.issues.includes("source attribution required"));
    assert.ok(result.issues.includes("HTTPS source URL required"));
  }
});

test("rejects unknown bracket positions", () => {
  const [review] = reviewBiDistrictScheduleCandidates([{ ...valid, slot: 99 }], bracket);
  assert.ok(review.issues.includes("unknown bracket slot"));
});
