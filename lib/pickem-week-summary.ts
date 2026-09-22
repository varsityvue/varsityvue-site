export type PickemWeekSummaryGame = {
  id: string;
  weekId: string;
  resultWinnerSchoolSlug: string | null;
  gradedAt: string | null;
};

export type PickemWeekSummaryPick = {
  pickemGameId: string;
  userId: string;
  isCorrect: boolean | null;
};

export type PickemWeekSummary = {
  picksSaved: number;
  resultsGraded: number;
  eligibleGames: number;
  pointsEarned: number;
};

export function summarizePickemWeeks({
  userId,
  games,
  picks,
}: {
  userId: string;
  games: PickemWeekSummaryGame[];
  picks: PickemWeekSummaryPick[];
}) {
  const summaries = new Map<string, PickemWeekSummary>();
  const gamesById = new Map(games.map((game) => [game.id, game]));

  for (const game of games) {
    const summary = summaries.get(game.weekId) ?? {
      picksSaved: 0,
      resultsGraded: 0,
      eligibleGames: 0,
      pointsEarned: 0,
    };
    if (game.resultWinnerSchoolSlug && game.gradedAt) summary.eligibleGames += 1;
    summaries.set(game.weekId, summary);
  }

  for (const pick of picks) {
    if (pick.userId !== userId) continue;
    const game = gamesById.get(pick.pickemGameId);
    if (!game) continue;
    const summary = summaries.get(game.weekId)!;
    summary.picksSaved += 1;
    if (game.resultWinnerSchoolSlug && game.gradedAt && pick.isCorrect !== null) {
      summary.resultsGraded += 1;
      if (pick.isCorrect) summary.pointsEarned += 1;
    }
  }

  return summaries;
}

export function pickemWeekDisclosureLabel(expanded: boolean) {
  return expanded ? "Hide picks" : "View picks";
}

export function formatPickemWeekSummary(summary: PickemWeekSummary) {
  const hasEligibleResults = summary.eligibleGames > 0;

  return {
    picksSaved: `${summary.picksSaved} picks saved`,
    results: hasEligibleResults
      ? `Results graded: ${summary.resultsGraded} of ${summary.eligibleGames}`
      : "Results pending",
    points: `Points earned ${hasEligibleResults ? summary.pointsEarned : "—"}`,
  };
}
