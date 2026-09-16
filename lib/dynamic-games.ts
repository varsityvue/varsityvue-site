import { createClient } from "@/lib/supabase/server";
import { getGames } from "@/lib/games";
import { clearInheritedSchoolBroadcasts } from "@/data/school-broadcasts";
import type { Game, GameStatus } from "@/types/platform";

type GameStateRow = {
  game_id: string;
  status: GameStatus;
  home_score: number | null;
  away_score: number | null;
  period: string | null;
  clock: string | null;
  verified: boolean;
};

function applyGameState(game: Game, state?: GameStateRow): Game {
  if (!state?.verified) return game;

  const hasScore =
    typeof state.home_score === "number" &&
    typeof state.away_score === "number";

  const dynamicGame: Game = {
    ...game,
    status: state.status,
    sourceStatus: state.verified ? "verified" : game.sourceStatus,
    homeScore: state.home_score ?? game.homeScore,
    awayScore: state.away_score ?? game.awayScore,
    score: hasScore
      ? {
          home: state.home_score as number,
          away: state.away_score as number,
          period: state.period ?? undefined,
        }
      : game.score,
  };

  return state.status === "final"
    ? clearInheritedSchoolBroadcasts(dynamicGame)
    : dynamicGame;
}

export async function getDynamicGames(): Promise<Game[]> {
  const baseGames = getGames();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("game_state")
    .select("game_id,status,home_score,away_score,period,clock,verified")
    .eq("verified", true);

  if (error || !data?.length) return baseGames;

  const states = new Map(
    (data as GameStateRow[]).map((state) => [state.game_id, state]),
  );

  return baseGames.map((game) => applyGameState(game, states.get(game.id)));
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
