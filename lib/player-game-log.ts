import { gameStats } from "@/lib/all-game-stats";
import { getDynamicGames } from "@/lib/dynamic-games";
import { getPlayerId } from "@/lib/player-identity";
import { getGameCategoryCompleteness } from "@/lib/stat-completeness";
import type { StatCompletenessDetail } from "@/data/game-stats";
import type { Game } from "@/types/platform";

export type PlayerGameLogEntry = {
  gameId: string;
  opponent: string;
  week?: number;
  kickoff?: string;
  result?: string;
  rushing?: {
    attempts: number;
    yards: number;
    touchdowns?: number;
    yardsPerCarry: number;
  };
  passing?: {
    completions: number;
    attempts: number;
    yards: number;
    touchdowns?: number;
    interceptions: number;
  };
  receiving?: {
    receptions: number;
    yards: number;
    touchdowns?: number;
  };
  completeness: {
    rushing: StatCompletenessDetail;
    passing: StatCompletenessDetail;
    receiving: StatCompletenessDetail;
  };
};

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function lineMatchesPlayer(
  line: { schoolSlug: string; player: string; playerId?: string },
  playerId: string,
  season: number
) {
  return (line.playerId ?? getPlayerId(line.schoolSlug, line.player, season)) === playerId;
}

export async function getPlayerGameLog(playerId: string, season = 2026, games?: Game[]): Promise<PlayerGameLogEntry[]> {
  const dynamicGames = games ?? await getDynamicGames();
  const entries: PlayerGameLogEntry[] = [];

  for (const stats of gameStats) {
    if (stats.season !== season) continue;

    const allLines = [...stats.rushing, ...stats.passing, ...stats.receiving];
    const identity = allLines.find((line) => lineMatchesPlayer(line, playerId, season));
    if (!identity) continue;

    const schoolSlug = identity.schoolSlug;
    const game = dynamicGames.find((candidate) => candidate.id === stats.gameId);
    const isHome = game?.homeSchoolSlug === schoolSlug;
    const opponent = isHome ? game?.awayTeam : game?.homeTeam;

    const rushing = stats.rushing.find((line) => lineMatchesPlayer(line, playerId, season));
    const passing = stats.passing.find((line) => lineMatchesPlayer(line, playerId, season));
    const receiving = stats.receiving.find((line) => lineMatchesPlayer(line, playerId, season));

    let result: string | undefined;
    if (game?.status === "final" && game.homeScore !== undefined && game.awayScore !== undefined) {
      const teamScore = isHome ? game.homeScore : game.awayScore;
      const opponentScore = isHome ? game.awayScore : game.homeScore;
      result = `${teamScore > opponentScore ? "W" : teamScore < opponentScore ? "L" : "T"} ${teamScore}-${opponentScore}`;
    }

    entries.push({
      gameId: stats.gameId,
      opponent: opponent ?? "Opponent TBD",
      week: game?.week,
      kickoff: game?.kickoff,
      result,
      completeness: {
        rushing: getGameCategoryCompleteness(stats, schoolSlug, "rushing"),
        passing: getGameCategoryCompleteness(stats, schoolSlug, "passing"),
        receiving: getGameCategoryCompleteness(stats, schoolSlug, "receiving"),
      },
      rushing: rushing
        ? {
            attempts: rushing.attempts,
            yards: rushing.yards,
            touchdowns: rushing.touchdowns,
            yardsPerCarry: rushing.attempts ? round(rushing.yards / rushing.attempts) : 0,
          }
        : undefined,
      passing: passing
        ? {
            completions: passing.completions,
            attempts: passing.attempts,
            yards: passing.yards,
            touchdowns: passing.touchdowns,
            interceptions: passing.interceptions,
          }
        : undefined,
      receiving: receiving
        ? {
            receptions: receiving.receptions,
            yards: receiving.yards,
            touchdowns: receiving.touchdowns,
          }
        : undefined,
    });
  }

  return entries.sort((a, b) => (a.week ?? 99) - (b.week ?? 99));
}
