import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { assignedLivePayload, assignedLiveError, eligibleAssignedLiveState, validScorekeeperClock, type LiveScoreState } from "./assigned-scorekeeper";
const state: LiveScoreState = { game_id: "game", status: "live", verified: true, home_score: 14, away_score: 21, home_school_slug: "home", away_school_slug: "away", result_type: null, official_winner_school_slug: null, updated_at: "2026-10-02T10:00:00.123456+00:00", score_revision: 7, period: "3rd", clock: "04:00" };
const assignment = { school_slug: "away", active: true, assignment_role: "scorekeeper" };
function form() { const f = new FormData(); for (const [key, value] of Object.entries({ game_id: "game", home_score: "14", away_score: "21", period: "OT2", clock: "02:15", expected_state_updated_at: state.updated_at, expected_state_revision: "7" })) f.set(key, value); return f; }
test("role AND current matching active scorekeeper assignment qualify either participant", () => {
  assert.equal(eligibleAssignedLiveState(true, [assignment], state), true);
  assert.equal(eligibleAssignedLiveState(true, [{ ...assignment, school_slug: "home" }], state), true);
  for (const [role, list] of [[false, [assignment]], [true, []], [true, [{ ...assignment, active: false }]], [true, [{ ...assignment, assignment_role: "coach" }]], [true, [{ ...assignment, school_slug: "other" }]]] as const) assert.equal(eligibleAssignedLiveState(role, [...list], state), false);
});
test("only existing verified numeric LIVE played state displays trusted controls", () => {
  for (const patch of [{ status: "scheduled" }, { status: "final" }, { status: "cancelled" }, { verified: false }, { home_score: null }, { away_score: null }, { result_type: "forfeit" }, { official_winner_school_slug: "home" }]) assert.equal(eligibleAssignedLiveState(true, [assignment], { ...state, ...patch }), false);
});
test("page-origin microsecond timestamp and revision forwarded exactly; orientation preserved", () => {
  const p = assignedLivePayload(form()); assert.equal(p.p_expected_state_updated_at, state.updated_at); assert.equal(p.p_expected_state_revision, 7); assert.equal(p.p_away_score, 21); assert.equal(p.p_home_score, 14); assert.equal(p.p_period, "OT2");
});
test("no client actor, school, status, result, assignment, or source claim is forwarded", () => {
  const f = form(); for (const key of ["actor_id", "reviewed_by", "updated_by", "school_slug", "assignment_id", "game_status", "result_type", "official_winner_school_slug", "source_submission_id", "kickoff_override", "verified"]) f.set(key, "forged");
  assert.deepEqual(Object.keys(assignedLivePayload(f)).sort(), ["p_game_id", "p_home_score", "p_away_score", "p_period", "p_clock", "p_expected_state_updated_at", "p_expected_state_revision", "p_confirm_score_decrease"].sort());
});
test("empty/invalid scores, missing tokens, invalid period and clock rejected", () => {
  for (const [key, value] of [["home_score", ""], ["away_score", "151"], ["home_score", "-1"], ["away_score", "7.5"], ["expected_state_revision", ""], ["expected_state_updated_at", ""], ["period", "half"], ["clock", "99:99"]]) { const f = form(); f.set(key, value); assert.throws(() => assignedLivePayload(f)); }
});
test("bounded optional clock; existing quarter and overtime semantics", () => {
  for (const value of ["", "0:00", "00:59", "12:00", "14:59", "15:00"]) assert.ok(validScorekeeperClock(value));
  for (const value of ["15:01", "16:00", "12:60", "12", "00:000", "abc", "-1:00"]) assert.equal(validScorekeeperClock(value), false);
  for (const value of ["1st", "2nd", "3rd", "4th", "OT", "OT2", "OT3", "OT20"]) { const f = form(); f.set("period", value); assert.equal(assignedLivePayload(f).p_period, value); }
});
test("score decrease confirmation explicit; bounded stale/revoked/suspended errors", () => {
  const f = form(); assert.equal(assignedLivePayload(f).p_confirm_score_decrease, false); f.set("confirm_score_decrease", "on"); assert.equal(assignedLivePayload(f).p_confirm_score_decrease, true);
  assert.match(assignedLiveError({ code: "40001" }), /Another scorekeeper/); assert.match(assignedLiveError({ code: "42501" }), /role, assignment, or account status/); assert.match(assignedLiveError({ code: "55000" }), /already exist/); assert.doesNotMatch(assignedLiveError({ message: "Private detail" }), /Private/);
});
test("UI keeps pending FINAL reporting separate, decrease confirmation and no private snapshots", () => {
  const page = readFileSync("app/report-score/page.tsx", "utf8"); const client = readFileSync("app/report-score/TrustedLiveScoreForm.tsx", "utf8"); const action = readFileSync("app/report-score/actions.ts", "utf8");
  assert.match(page, /Pending Score Report \/ FINAL Request/); assert.match(client, /Trusted LIVE Update/); assert.match(client, /confirm_score_decrease/); assert.match(client, /expected_state_updated_at/); assert.match(client, /useFormStatus/);
  assert.doesNotMatch(client, /actor_id|reviewed_by|assignment_id|assigned_scorekeeper_authority_v1/); assert.match(action, /submit_score_submission/); assert.match(action, /submit_assigned_scorekeeper_update/);
});
