export type PickemSubmissionGame = {
  id: string;
  awaySchoolSlug: string | null;
  homeSchoolSlug: string | null;
  lockAt: string;
};

export type PickemSubmissionRow = {
  pickem_game_id: string;
  user_id: string;
  picked_school_slug: string;
};

export function evaluatePickemSubmission({
  games,
  selections,
  userId,
  nowMs,
}: {
  games: PickemSubmissionGame[];
  selections: ReadonlyMap<string, string>;
  userId: string;
  nowMs: number;
}) {
  const rows: PickemSubmissionRow[] = [];
  const lockedGameIds: string[] = [];
  const invalidGameIds: string[] = [];

  for (const game of games) {
    const pickedSchoolSlug = selections.get(game.id)?.trim() ?? "";
    if (!pickedSchoolSlug) continue;

    if (![game.awaySchoolSlug, game.homeSchoolSlug].includes(pickedSchoolSlug)) {
      invalidGameIds.push(game.id);
      continue;
    }

    const lockAtMs = new Date(game.lockAt).getTime();
    if (!Number.isFinite(lockAtMs) || lockAtMs <= nowMs) {
      lockedGameIds.push(game.id);
      continue;
    }

    rows.push({
      pickem_game_id: game.id,
      user_id: userId,
      picked_school_slug: pickedSchoolSlug,
    });
  }

  return { rows, lockedGameIds, invalidGameIds };
}

export type PickemStanding = {
  user_id: string;
  display_name: string | null;
  username: string | null;
  graded_picks: number;
  correct_picks: number;
  accuracy_pct: number;
};

export function rankPickemStandings(rows: PickemStanding[]) {
  const ordered = [...rows].sort((left, right) => (
      right.correct_picks - left.correct_picks
      || right.accuracy_pct - left.accuracy_pct
      || left.user_id.localeCompare(right.user_id)
    ));

  let previousPoints: number | null = null;
  let currentRank = 0;
  return ordered.map((entry, index) => {
    if (previousPoints === null || entry.correct_picks !== previousPoints) {
      currentRank = index + 1;
      previousPoints = entry.correct_picks;
    }
    return {
      ...entry,
      rank: currentRank,
    };
  });
}
