import { cache } from "react";
import { createPublicReadClient } from "@/lib/supabase/server";
import { getGames, normalizeGameStatus } from "@/lib/games";
import { clearInheritedSchoolBroadcasts } from "@/data/school-broadcasts";
import { loadPublicScoreStatesResult, type PublicScoreLoadStatus } from "@/lib/public-score-loader";
import { getScoreAttribution, type PublicScoreState } from "@/lib/public-score-state";
import type { Game } from "@/types/platform";

function applyGameState(game: Game, state?: PublicScoreState): Game {
  if (!state?.verified) return game;

  const hasScore =
    typeof state.home_score === "number" &&
    typeof state.away_score === "number";

  const dynamicGame: Game = {
    ...game,
    status: state.status,
    scoreAttribution: getScoreAttribution(state),
    publicScoreVerified: true,
    kickoff: state.kickoff_override ?? game.kickoff,
    date: state.kickoff_override ? state.kickoff_override.slice(0, 10) : game.date,
    sourceStatus: state.verified ? "verified" : game.sourceStatus,
    homeScore: state.home_score ?? game.homeScore,
    awayScore: state.away_score ?? game.awayScore,
    resultType: state.result_type ?? game.resultType,
    officialWinnerSchoolSlug:
      state.official_winner_school_slug ?? game.officialWinnerSchoolSlug,
    score: hasScore
      ? {
          home: state.home_score as number,
          away: state.away_score as number,
          period: state.period ?? undefined,
          clock: state.clock ?? undefined,
        }
      : game.score,
  };

  const normalizedGame = normalizeGameStatus(dynamicGame);

  return normalizedGame.status === "upcoming" || normalizedGame.status === "live"
    ? normalizedGame
    : clearInheritedSchoolBroadcasts(normalizedGame);
}

export type DynamicGamesSnapshot = {
  games: Game[];
  scoreLoadStatus: PublicScoreLoadStatus;
};

export const getDynamicGamesSnapshot = cache(async (): Promise<DynamicGamesSnapshot> => {
  const baseGames = getGames();
  const supabase = await createPublicReadClient();
  const result = await loadPublicScoreStatesResult(supabase);
  if (!result.states.length) return { games: baseGames, scoreLoadStatus: result.status };
  const states = new Map(result.states.map((state) => [state.game_id, state]));

  return {
    games: baseGames.map((game) => applyGameState(game, states.get(game.id))),
    scoreLoadStatus: result.status,
  };
});

export async function getDynamicGames(): Promise<Game[]> {
  return (await getDynamicGamesSnapshot()).games;
}

export async function getDynamicGameById(id: string): Promise<Game | undefined> {
  const games = await getDynamicGames();
  return games.find((game) => game.id === id);
}

export async function getDynamicGamesForSchool(slug: string): Promise<Game[]> {
  const games = await getDynamicGames();
  return games.filter(
    (game) => game.homeSchoolSlug === slug || game.awaySchoolSlug === slug,
  );
}
