import type { CoreStatCategory, GameStats, StatCompletenessDetail, StatCompletenessStatus } from "@/data/game-stats";
import { getCategoryCompleteness } from "@/data/stat-completeness";

export type PublicCompleteness = StatCompletenessStatus;

export const PUBLIC_COMPLETENESS_LABELS: Record<PublicCompleteness, string> = {
  complete: "Complete",
  partial: "Partial coverage",
  unavailable: "Unavailable",
  unknown: "Coverage unclassified",
};

export function getPublicCompletenessLabel(status: PublicCompleteness) {
  return PUBLIC_COMPLETENESS_LABELS[status];
}

export function getPublicCompletenessNote(status: PublicCompleteness) {
  if (status === "complete") return "The retained source establishes complete attribution for this category.";
  if (status === "partial") return "Verified statistics are on file, but the retained source does not establish complete category attribution.";
  if (status === "unavailable") return "This category is not available from the retained source.";
  return "Verified values may be on file, but completeness has not been established.";
}

export function combineCompleteness(statuses: PublicCompleteness[]): PublicCompleteness {
  if (statuses.length === 0) return "unknown";
  if (statuses.every((status) => status === "complete")) return "complete";
  if (statuses.every((status) => status === "unavailable")) return "unavailable";
  if (statuses.some((status) => status === "partial" || status === "unavailable")) return "partial";
  return "unknown";
}

function schoolAppearsInGame(game: GameStats, schoolSlug: string) {
  return Boolean(
    game.completeness?.some((entry) => entry.schoolSlug === schoolSlug) ||
      game.quarterScores.some((line) => line.schoolSlug === schoolSlug) ||
      game.teamStats.some((line) => line.schoolSlug === schoolSlug) ||
      game.rushing.some((line) => line.schoolSlug === schoolSlug) ||
      game.passing.some((line) => line.schoolSlug === schoolSlug) ||
      game.receiving.some((line) => line.schoolSlug === schoolSlug)
  );
}

export function getSeasonCategoryCompleteness(
  games: GameStats[],
  schoolSlug: string,
  category: CoreStatCategory,
  season = 2026
): StatCompletenessDetail {
  const relevant = games.filter((game) => game.season === season && schoolAppearsInGame(game, schoolSlug));
  if (relevant.length === 0) return { status: "unknown" };
  const details = relevant.map((game) => getCategoryCompleteness(game, schoolSlug, category));
  const status = combineCompleteness(details.map((entry) => entry.status));
  return { status, note: getPublicCompletenessNote(status) };
}

export function getAggregateCompleteness(details: StatCompletenessDetail[]): StatCompletenessDetail {
  const status = combineCompleteness(details.map((detail) => detail.status));
  return { status, note: getPublicCompletenessNote(status) };
}

export function isDefinitiveRanking(statuses: PublicCompleteness[]) {
  return statuses.length > 0 && statuses.every((status) => status === "complete");
}
