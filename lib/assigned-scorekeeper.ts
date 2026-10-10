import { isScoreConflict, scoreConflictMessage } from "./score-conflict";
import { normalizeLivePeriod } from "./live-period";

export type LiveScoreState = {
  game_id: string; status: string; verified: boolean;
  home_score: number | null; away_score: number | null;
  home_school_slug: string | null; away_school_slug: string | null;
  result_type: string | null; official_winner_school_slug: string | null;
  updated_at: string; score_revision: number;
  period: string | null; clock: string | null;
};
export type ScorekeeperAssignment = { school_slug: string; active: boolean; assignment_role: string };

// Display eligibility only. The transaction resolves canonical identity and
// current role/assignment itself; neither these fields nor hidden controls authorize.
export function eligibleAssignedLiveState(hasRole: boolean, assignments: ScorekeeperAssignment[], state: LiveScoreState) {
  return hasRole && state.status === "live" && state.verified && state.home_score !== null && state.away_score !== null
    && !state.result_type && !state.official_winner_school_slug
    && assignments.some((a) => a.active && a.assignment_role === "scorekeeper"
      && (a.school_slug === state.home_school_slug || a.school_slug === state.away_school_slug));
}
export function validScorekeeperClock(clock: string) {
  return !clock || /^((0?[0-9]|1[0-4]):[0-5][0-9]|15:00)$/.test(clock);
}
export function assignedLivePayload(form: FormData) {
  const text = (key: string) => String(form.get(key) ?? "").trim();
  const home = text("home_score"); const away = text("away_score");
  const revision = text("expected_state_revision");
  const timestamp = text("expected_state_updated_at");
  const period = text("period"); const clock = text("clock");
  if (!text("game_id") || !/^\d{1,3}$/.test(home) || !/^\d{1,3}$/.test(away)
    || Number(home) > 150 || Number(away) > 150) throw new Error("Enter valid scores for both teams.");
  if (!/^\d+$/.test(revision) || !Number.isSafeInteger(Number(revision)) || !timestamp || !Number.isFinite(Date.parse(timestamp))) {
    throw new Error("Game changed — review the current score.");
  }
  if (period && !normalizeLivePeriod(period)) throw new Error("Choose a valid quarter or overtime period.");
  if (!validScorekeeperClock(clock)) throw new Error("Use a game clock from 0:00 through 15:00 (minutes:seconds).");
  return {
    p_game_id: text("game_id"), p_home_score: Number(home), p_away_score: Number(away),
    p_period: period || null, p_clock: clock || null,
    p_expected_state_updated_at: timestamp, p_expected_state_revision: Number(revision),
    p_confirm_score_decrease: form.get("confirm_score_decrease") === "on",
  };
}
export function assignedLiveError(error: { code?: string; message?: string }) {
  if (isScoreConflict(error)) return scoreConflictMessage;
  if (error.code === "42501") return "Your active scorekeeper access no longer covers this game. Ask an administrator to review your role, assignment, or account status.";
  if (error.code === "55000") return "A verified numeric LIVE game must already exist. Ask a moderator to start or finalize this game.";
  if (error.code === "22023") return "Check the scores, period, clock, and score-decrease confirmation before publishing.";
  return "The LIVE update could not be published. Refresh the game and try again.";
}
