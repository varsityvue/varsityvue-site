export type AdminPickemSubmissionRow = {
  week_id: string;
  season: number;
  week: number;
  week_title: string;
  week_status: string;
  entrant_user_id: string;
  entrant_display_name: string | null;
  entrant_username: string | null;
  entrant_saved_picks: number;
  week_game_count: number;
  entrant_complete: boolean;
  entrant_last_submitted_at: string | null;
  entrant_graded_picks: number;
  entrant_points: number;
  pickem_game_id: string;
  game_id: string;
  sort_order: number;
  lock_at: string;
  is_locked: boolean;
  away_school_slug: string | null;
  home_school_slug: string | null;
  picked_school_slug: string | null;
  pick_submitted_at: string | null;
  game_status: string | null;
  result_type: string | null;
  result_winner_school_slug: string | null;
  graded_at: string | null;
  is_correct: boolean | null;
};

export type AdminPickemEntrant = {
  userId: string;
  displayName: string;
  savedPicks: number;
  gameCount: number;
  complete: boolean;
  lastSubmittedAt: string | null;
  gradedPicks: number;
  points: number;
  games: AdminPickemSubmissionRow[];
};

export function groupAdminPickemSubmissions(rows: AdminPickemSubmissionRow[]) {
  const entrants = new Map<string, AdminPickemEntrant>();

  for (const row of rows) {
    const entrant = entrants.get(row.entrant_user_id) ?? {
      userId: row.entrant_user_id,
      displayName: row.entrant_display_name?.trim()
        || row.entrant_username?.trim()
        || "VarsityVue Member",
      savedPicks: row.entrant_saved_picks,
      gameCount: row.week_game_count,
      complete: row.entrant_complete,
      lastSubmittedAt: row.entrant_last_submitted_at,
      gradedPicks: row.entrant_graded_picks,
      points: row.entrant_points,
      games: [],
    };
    entrant.games.push(row);
    entrants.set(row.entrant_user_id, entrant);
  }

  return [...entrants.values()].map((entrant) => ({
    ...entrant,
    games: entrant.games.sort((left, right) => (
      left.sort_order - right.sort_order
      || left.pickem_game_id.localeCompare(right.pickem_game_id)
    )),
  }));
}

export function adminPickemSelectionLabel(row: AdminPickemSubmissionRow) {
  if (!row.is_locked) return "Concealed until lock";
  return row.picked_school_slug ? "Selection available" : "No pick";
}

export function adminPickemGradeLabel(row: AdminPickemSubmissionRow) {
  if (!row.is_locked) return "Open";
  if (row.result_type === "tie" || row.result_type === "no_contest" || row.game_status === "cancelled") {
    return "Void";
  }
  if (!row.picked_school_slug) return "No pick";
  if (row.graded_at && row.is_correct === true) return "Correct";
  if (row.graded_at && row.is_correct === false) return "Incorrect";
  return "Result pending";
}

export function adminPickemPointsLabel(gradedPicks: number, points: number) {
  if (gradedPicks === 0) return "Points pending";
  return `${points} point${points === 1 ? "" : "s"} · ${gradedPicks} graded`;
}
