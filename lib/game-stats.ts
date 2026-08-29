import { gameStats } from "@/data/game-stats";

export function getGameStats(gameId: string) {
  return gameStats.find((entry) => entry.gameId === gameId);
}
