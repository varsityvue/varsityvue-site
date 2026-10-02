import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import EvidenceReviewForm from "../app/internal/score-intelligence/EvidenceReviewForm";
import { scoutEvidenceSnapshot, scoutExpectedState, scoutReviewArguments, scoutReviewError, type ScoutState } from "./score-scout-review";
const snapshot = scoutEvidenceSnapshot({ id: "evidence", away_score: 28, home_score: 21, source_name: "Source", source_type: "score_service", source_url: "https://example.invalid", ingestion_method: "automated", evidence_note: "Excerpt", captured_at: "2026-10-02T11:00:00+00:00", review_status: "pending" }, { id: "candidate", game_id: "game", away_school_slug: "away", home_school_slug: "home" });
const state: ScoutState = { game_id: "game", updated_at: "2026-10-02T10:00:00+00:00", score_revision: 7, status: "live", home_score: 14, away_score: 21, result_type: null };
function form(decision = "approve", current?: ScoutState) {
  const f = new FormData(); const e = scoutExpectedState(current);
  for (const [k, v] of Object.entries({ evidence_id: snapshot.id, game_id: snapshot.game_id, decision, evidence_snapshot: JSON.stringify(snapshot), expected_updated_at: e.updatedAt, expected_revision: e.revision, expected_absent: String(e.absent), confirm_final: "yes" })) f.set(k, v);
  return f;
}
test("page-origin state is forwarded exactly; absent state is explicit", () => {
  assert.equal(scoutReviewArguments(form("approve", state)).p_expected_state_revision, 7);
  assert.equal(scoutReviewArguments(form("approve", state)).p_expected_state_updated_at, state.updated_at);
  assert.equal(scoutReviewArguments(form()).p_expected_state_absent, true);
  assert.equal(scoutReviewArguments(form()).p_expected_state_revision, null);
});
test("only locked-evidence snapshot is supplied, never arbitrary publication scores or actor", () => {
  const f = form(); f.set("home_score", "99"); f.set("away_score", "0"); f.set("reviewed_by", "forged"); f.set("result_type", "live");
  const args = scoutReviewArguments(f);
  assert.deepEqual(args.p_evidence_snapshot, snapshot);
  assert.equal(args.p_result_type, "played");
  assert.equal("reviewed_by" in args, false); assert.equal("p_home_score" in args, false);
});
test("confirmation and consistent revision are required for publication", () => {
  const f = form(); f.delete("confirm_final"); assert.throws(() => scoutReviewArguments(f), /Confirm/);
  const inconsistent = form(); inconsistent.set("expected_revision", "7"); assert.throws(() => scoutReviewArguments(inconsistent), /Game changed/);
});
test("changed mapping cannot be silently submitted", () => { const f = form(); f.set("game_id", "other"); assert.throws(() => scoutReviewArguments(f), /mapping changed/); });
test("reject/defer preserve evidence and mapping without final confirmation", () => {
  for (const d of ["reject", "defer"]) { const f = form(d); f.delete("confirm_final"); const args = scoutReviewArguments(f); assert.equal(args.decision, d); assert.equal(args.p_confirm_final, false); assert.deepEqual(args.p_evidence_snapshot, snapshot); }
});
test("bounded error messages preserve stale/evidence/mapping/resolved/terminal/tie semantics", () => {
  for (const message of ["Game changed — review the current score.", "Evidence changed — review the evidence again.", "Game mapping changed — review the evidence again.", "This missing-score item is no longer open.", "Approval blocked: this game already has a verified terminal state.", "Tied results require the existing authorized outcome workflow.", "Exceptional outcomes require the existing authorized outcome workflow."]) assert.equal(scoutReviewError({ message }), message);
  assert.doesNotMatch(scoutReviewError({ message: "private database details" }), /private database/);
  assert.match(scoutReviewError({ code: "42501" }), /active moderator/);
});
test("rendered approval preserves orientation, required ordinary FINAL confirmation and snapshots", () => {
  const html = renderToStaticMarkup(<EvidenceReviewForm action={async () => {}} snapshot={snapshot} state={state} decision="approve" awayTeam="Away Team" homeTeam="Home Team" />);
  assert.match(html, /Away Team 28 — Home Team 21/); assert.match(html, /required=""/); assert.match(html, /Publish this canonical FINAL/);
  assert.match(html, /name="expected_revision" value="7"/); assert.match(html, /name="expected_absent" value="false"/);
  assert.doesNotMatch(html, /name="(actor_id|reviewed_by|home_score|away_score)"/);
});
test("reject/defer forms do not require publication confirmation", () => {
  for (const decision of ["reject", "defer"] as const) assert.doesNotMatch(renderToStaticMarkup(<EvidenceReviewForm action={async () => {}} snapshot={snapshot} decision={decision} awayTeam="Away" homeTeam="Home" />), /name="confirm_final"/);
});
