import type { Game } from "@/types/platform";
import { getGamePresentation } from "@/lib/game-presentation";
import { orderPlayedFinals } from "@/lib/recent-results";

// Reuse the season pulse's chronological ordering; never include reports or exceptional outcomes.
export function getSchoolRecentForm(games: Game[], schoolSlug: string) {
  const completed = games.filter(game =>
    (game.homeSchoolSlug === schoolSlug || game.awaySchoolSlug === schoolSlug) &&
    game.publicScoreVerified !== false &&
    getGamePresentation(game).kind === "verified_final" &&
    getGamePresentation(game).authoritativeScore
  ).map(game => ({ ...game, homeScore: game.homeScore ?? game.score?.home, awayScore: game.awayScore ?? game.score?.away }))
    .filter(game => Number.isFinite(game.homeScore) && Number.isFinite(game.awayScore));
  return orderPlayedFinals(completed).slice(-5).map(game => {
    const home = game.homeSchoolSlug === schoolSlug;
    const teamScore = (home ? game.homeScore : game.awayScore)!;
    const opponentScore = (home ? game.awayScore : game.homeScore)!;
    const result: "W" | "L" | "T" = teamScore > opponentScore ? "W" : teamScore < opponentScore ? "L" : "T";
    return { game, result, teamScore, opponentScore, opponent: home ? game.awayTeam : game.homeTeam };
  });
}
