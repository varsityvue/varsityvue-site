import { cache } from "react";
import { createPublicReadClient } from "@/lib/supabase/server";
import { getGames } from "@/lib/games";
import { applyGameState } from "@/lib/resolve-game-score-state";
import { loadPublicScoreStatesResult, type PublicScoreLoadStatus } from "@/lib/public-score-loader";
import type { Game } from "@/types/platform";

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
