import type {
  CoreStatCategory,
  GameStats,
  StatCompletenessDetail,
  StatCompletenessStatus,
} from "@/data/game-stats";
import { gameStats } from "@/lib/all-game-stats";
import { getCategoryCompleteness } from "@/data/stat-completeness";

export type AggregateStatCompleteness = StatCompletenessDetail & {
  gamesConsidered: number;
  gamesWithValues: number;
  hasUnknownCoverage: boolean;
  hasUnavailableCoverage: boolean;
};

function gameHasSchool(game: GameStats, schoolSlug: string) {
  return game.completeness?.some((entry) => entry.schoolSlug === schoolSlug)
    || game.quarterScores.some((line) => line.schoolSlug === schoolSlug)
    || game.scoringPlays.some((line) => line.schoolSlug === schoolSlug)
    || game.teamStats.some((line) => line.schoolSlug === schoolSlug)
    || game.rushing.some((line) => line.schoolSlug === schoolSlug)
    || game.passing.some((line) => line.schoolSlug === schoolSlug)
    || game.receiving.some((line) => line.schoolSlug === schoolSlug);
}

export function gameHasCategoryValues(game: GameStats, schoolSlug: string, category: CoreStatCategory) {
  if (category === "quarterScoring") return game.quarterScores.some((line) => line.schoolSlug === schoolSlug);
  if (category === "scoringPlays") return game.scoringPlays.some((line) => line.schoolSlug === schoolSlug);
  if (category === "teamStats") return game.teamStats.some((line) => line.schoolSlug === schoolSlug);
  return game[category].some((line) => line.schoolSlug === schoolSlug);
}

export function combineStatCompleteness(
  details: StatCompletenessDetail[],
  gamesWithValues: number
): AggregateStatCompleteness {
  const statuses = details.map((detail) => detail.status);
  const hasPartial = statuses.includes("partial");
  const hasUnavailable = statuses.includes("unavailable");
  const hasUnknown = statuses.includes("unknown");
  let status: StatCompletenessStatus;

  if (details.length === 0) status = "unknown";
  else if (hasPartial || (hasUnavailable && (gamesWithValues > 0 || hasUnknown))) status = "partial";
  else if (hasUnavailable) status = "unavailable";
  else if (hasUnknown) status = "unknown";
  else status = "complete";

  return {
    status,
    gamesConsidered: details.length,
    gamesWithValues,
    hasUnknownCoverage: hasUnknown || details.length === 0,
    hasUnavailableCoverage: hasUnavailable,
  };
}

export function getSchoolSeasonCategoryCompleteness(
  schoolSlug: string,
  season: number,
  category: CoreStatCategory,
  catalog: GameStats[] = gameStats
): AggregateStatCompleteness {
  const relevantGames = catalog.filter((game) => game.season === season && gameHasSchool(game, schoolSlug));
  const details = relevantGames.map((game) => getCategoryCompleteness(game, schoolSlug, category));
  const gamesWithValues = relevantGames.filter((game) => gameHasCategoryValues(game, schoolSlug, category)).length;
  return combineStatCompleteness(details, gamesWithValues);
}

export function getGameCategoryCompleteness(game: GameStats, schoolSlug: string, category: CoreStatCategory) {
  return getCategoryCompleteness(game, schoolSlug, category);
}

export function combineCategoryStates(details: StatCompletenessDetail[], hasVerifiedValues = true) {
  return combineStatCompleteness(details, hasVerifiedValues ? 1 : 0);
}

export function getPublicCompletenessLabel(status: StatCompletenessStatus, verifiedValues = true) {
  if (status === "complete") return verifiedValues ? "Verified · Complete" : "Complete";
  if (status === "partial") return verifiedValues ? "Verified · Partial" : "Partial coverage";
  if (status === "unavailable") return "Unavailable";
  return verifiedValues ? "Verified · Coverage unclassified" : "Coverage unclassified";
}

export function isDefinitiveRanking<T extends { completeness: StatCompletenessDetail }>(entries: T[]) {
  return entries.length > 0 && entries.every((entry) => entry.completeness.status === "complete");
}
