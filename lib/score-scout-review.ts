import { isBusinessConflict } from "./business-conflict";
export type ScoutEvidence = {
  id: string; away_score: number | null; home_score: number | null;
  source_name: string; source_type: string; source_url: string | null;
  ingestion_method: string; evidence_note: string | null; captured_at: string; review_status: string;
};
export type ScoutMapping = { id: string; game_id: string; away_school_slug: string | null; home_school_slug: string | null };
export type ScoutState = { game_id: string; updated_at: string; score_revision: number; status: string; home_score: number | null; away_score: number | null; result_type: string | null };
export function scoutEvidenceSnapshot(e: ScoutEvidence, i: ScoutMapping) {
  return { id: e.id, intelligence_id: i.id, game_id: i.game_id, away_score: e.away_score, home_score: e.home_score,
    source_name: e.source_name, source_type: e.source_type, source_url: e.source_url, ingestion_method: e.ingestion_method,
    evidence_note: e.evidence_note, captured_at: e.captured_at, review_status: e.review_status,
    away_school_slug: i.away_school_slug, home_school_slug: i.home_school_slug };
}
export function scoutExpectedState(state?: ScoutState) {
  return { updatedAt: state?.updated_at ?? "", revision: state ? String(state.score_revision) : "", absent: !state };
}
export function scoutReviewArguments(form: FormData) {
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const decision = text("decision");
  const expectedGame = text("game_id");
  const rawSnapshot = text("evidence_snapshot");
  if (!text("evidence_id") || !expectedGame || !["approve", "reject", "defer"].includes(decision) || rawSnapshot.length > 12000) throw new Error("Invalid evidence decision.");
  const snapshot = JSON.parse(rawSnapshot) as ReturnType<typeof scoutEvidenceSnapshot>;
  if (!snapshot || snapshot.id !== text("evidence_id") || snapshot.game_id !== expectedGame) throw new Error("Game mapping changed — review the evidence again.");
  const absent = text("expected_absent") === "true";
  const updated = text("expected_updated_at");
  const rawRevision = text("expected_revision");
  const revision = rawRevision === "" ? null : Number(rawRevision);
  if (decision === "approve" && ((absent && (updated || revision !== null)) || (!absent && (!updated || !Number.isFinite(Date.parse(updated)) || revision === null || !Number.isSafeInteger(revision) || revision < 0)))) throw new Error("Game changed — review the current score.");
  if (decision === "approve" && text("confirm_final") !== "yes") throw new Error("Confirm the teams, scores, and ordinary FINAL result before publishing.");
  return { target_evidence_id: snapshot.id, decision, note: text("review_note").slice(0, 1000) || null,
    p_expected_game_id: expectedGame, p_expected_state_updated_at: updated || null,
    p_expected_state_revision: revision, p_expected_state_absent: absent, p_evidence_snapshot: snapshot,
    p_confirm_final: text("confirm_final") === "yes", p_result_type: "played" };
}
const messages = new Set([
  "Game changed — review the current score.", "Evidence changed — review the evidence again.",
  "Game mapping changed — review the evidence again.", "This missing-score item is no longer open.",
  "Approval blocked: this game already has a verified terminal state.",
  "Tied results require the existing authorized outcome workflow.",
  "Exceptional outcomes require the existing authorized outcome workflow.",
  "Confirm the teams, scores, and ordinary FINAL result before publishing.",
  "This evidence can no longer be reviewed.", "Score evidence not found.", "Invalid evidence decision.",
]);
export function scoutReviewError(error: { code?: string; message?: string }) {
  if (error.code === "42501") return "An active moderator or administrator is required to review evidence.";
  if (error.message && messages.has(error.message)) return error.message;
  if (isBusinessConflict(error)) return "Game changed — review the current score.";
  return "Score Scout review could not be completed. Refresh and review the current evidence.";
}
