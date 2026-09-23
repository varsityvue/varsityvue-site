import type { Game } from "@/types/platform";

export type SchoolScoringAverages = {
  scoredGames: number;
  pointsFor: number;
  pointsAllowed: number;
  pointsPerGame: number | null;
  pointsAllowedPerGame: number | null;
};

function isScoredPlayedFinal(game: Game) {
  if (game.status !== "final" || game.gameType === "bye" || game.gameType === "scrimmage") return false;
  if (game.resultType === "forfeit" || game.resultType === "tie" || game.resultType === "no_contest") return false;
  if (typeof game.homeScore !== "number" || typeof game.awayScore !== "number") return false;
  return Number.isFinite(game.homeScore) && Number.isFinite(game.awayScore) && game.homeScore !== game.awayScore;
}

export function getSchoolScoringAverages(schoolSlug: string, games: Game[], season = 2026): SchoolScoringAverages {
  const canonicalGames = new Map(games.map((game) => [game.id, game]));
  let scoredGames = 0;
  let pointsFor = 0;
  let pointsAllowed = 0;

  for (const game of canonicalGames.values()) {
    if (game.season !== season || !isScoredPlayedFinal(game)) continue;

    const isHome = game.homeSchoolSlug === schoolSlug;
    const isAway = game.awaySchoolSlug === schoolSlug;
    if (isHome === isAway) continue;

    scoredGames += 1;
    pointsFor += isHome ? game.homeScore as number : game.awayScore as number;
    pointsAllowed += isHome ? game.awayScore as number : game.homeScore as number;
  }

  return {
    scoredGames,
    pointsFor,
    pointsAllowed,
    pointsPerGame: scoredGames > 0 ? pointsFor / scoredGames : null,
    pointsAllowedPerGame: scoredGames > 0 ? pointsAllowed / scoredGames : null,
  };
}

export function formatScoringAverage(value: number | null) {
  return value === null ? "—" : value.toFixed(1);
}
