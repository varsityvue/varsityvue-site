/** Explicit presentation contracts: internal identity remains in privileged SQL only. */
export type PublicSeasonStanding = {
  ordinal: number; rank: number; display_name: string | null; username: string | null;
  graded_picks: number; correct_picks: number; accuracy_pct: number;
};
export type PublicWeekStanding = {
  ordinal: number; weekly_rank: number; display_name: string | null; username: string | null;
  correct_picks: number; graded_picks: number; predicted_total: number | null;
  actual_total: number | null; distance: number | null;
};
export type OwnPickemSummary = {
  graded_picks: number; correct_picks: number; incorrect_picks: number; season_rank: number | null;
};
export type OwnScoreReport = {
  id: string; game_id: string; home_score: number; away_score: number; game_status: string;
  period: string | null; clock: string | null; status: string; created_at: string; reviewed_at: string | null;
};
