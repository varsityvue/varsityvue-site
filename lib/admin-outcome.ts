export type CanonicalOutcomeType = "played" | "tie" | "forfeit" | "no_contest";
export type ScorelessOutcomeType = "forfeit" | "no_contest";

export type CanonicalOutcomeGame = {
  gameId: string;
  matchup: string;
  awayName: string;
  awaySlug: string;
  homeName: string;
  homeSlug: string;
  awayScore: number | null;
  homeScore: number | null;
  status: string;
  verified: boolean;
  resultType: string | null;
  officialWinnerSlug: string | null;
  outcomeRevision: number;
};

export type ScorelessOutcomeGame = {
  gameId: string;
  matchup: string;
  awayName: string;
  awaySlug: string;
  homeName: string;
  homeSlug: string;
  status: string;
  outcomeRevision: number;
};

export const canonicalOutcomeLabels: Record<CanonicalOutcomeType, string> = {
  played: "Played result",
  tie: "Tie — VOID for Pick ’Em",
  forfeit: "Forfeit",
  no_contest: "No-contest — VOID for Pick ’Em",
};

export function canonicalOutcomeValidation(
  game: CanonicalOutcomeGame | undefined,
  resultType: CanonicalOutcomeType,
  winnerSlug: string,
  reason: string,
  awayScore: number | null = game?.awayScore ?? null,
  homeScore: number | null = game?.homeScore ?? null,
) {
  if (!game) return "Choose a canonical game.";
  if (!game.verified || game.status !== "final") return "Only verified final games are eligible.";
  if (!reason.trim()) return "Enter a reason for the outcome change.";
  if (reason.trim().length > 500) return "Keep the reason to 500 characters or fewer.";

  if (resultType === "played") {
    if (awayScore === null || homeScore === null) return "Played requires both final scores.";
    if (!Number.isSafeInteger(awayScore) || !Number.isSafeInteger(homeScore) || awayScore < 0 || homeScore < 0) return "Played scores must be nonnegative whole numbers.";
    if (awayScore === homeScore) return "Played requires unequal final scores.";
  }
  if (resultType === "tie") {
    if (awayScore === null || homeScore === null) return "Tie requires both final scores.";
    if (!Number.isSafeInteger(awayScore) || !Number.isSafeInteger(homeScore) || awayScore < 0 || homeScore < 0) return "Tie scores must be nonnegative whole numbers.";
    if (awayScore !== homeScore) return "Tie requires equal final scores.";
  }
  if (resultType === "forfeit" && ![game.awaySlug, game.homeSlug].includes(winnerSlug)) {
    return "Choose the authoritative winner from this matchup.";
  }
  return null;
}

export function canonicalOutcomeSummary(
  game: CanonicalOutcomeGame,
  resultType: CanonicalOutcomeType,
  winnerSlug: string,
) {
  const winner = winnerSlug === game.awaySlug
    ? game.awayName
    : winnerSlug === game.homeSlug
      ? game.homeName
      : null;
  const outcome = resultType === "forfeit" && winner
    ? `Forfeit — ${winner} is the authoritative winner`
    : canonicalOutcomeLabels[resultType];
  const grading = resultType === "tie" || resultType === "no_contest"
    ? "The game becomes VOID; grades are cleared and totals are recalculated."
    : "Existing picks are regraded and totals are recalculated.";
  return `${game.matchup}: ${outcome}. ${grading} Saved member selections are preserved.`;
}

export function scorelessOutcomeValidation(
  game: ScorelessOutcomeGame | undefined,
  resultType: ScorelessOutcomeType,
  winnerSlug: string,
  source: string,
  reason: string,
) {
  if (!game) return "Choose a canonical game.";
  if (game.status === "final") return "A final already exists; use the correction workflow.";
  if (!source.trim()) return "Enter the authoritative source.";
  if (source.trim().length > 300) return "Keep the source to 300 characters or fewer.";
  if (!reason.trim()) return "Enter a reason for the exceptional outcome.";
  if (reason.trim().length > 500) return "Keep the reason to 500 characters or fewer.";
  if (resultType === "forfeit" && ![game.awaySlug, game.homeSlug].includes(winnerSlug)) {
    return "Choose the official winner from this matchup.";
  }
  if (resultType === "no_contest" && winnerSlug) {
    return "A no-contest cannot have an official winner.";
  }
  return null;
}

export function scorelessOutcomeSummary(
  game: ScorelessOutcomeGame,
  resultType: ScorelessOutcomeType,
  winnerSlug: string,
) {
  const winner = winnerSlug === game.awaySlug
    ? game.awayName
    : winnerSlug === game.homeSlug
      ? game.homeName
      : null;
  if (resultType === "forfeit") {
    return `${game.matchup}: scoreless forfeit — ${winner ?? "no winner selected"} is the official winner. Existing picks are preserved and graded from that explicit winner. No numeric final-score alert is created.`;
  }
  return `${game.matchup}: scoreless no-contest. Existing picks are preserved, the matchup is VOID for Pick ’Em, and no numeric final-score alert is created.`;
}
