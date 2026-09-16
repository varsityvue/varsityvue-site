import { gameStats } from "@/lib/all-game-stats";

export function getAllGameStats() {
  return gameStats;
}

export function getGameStats(gameId: string) {
  return gameStats.find((entry) => entry.gameId === gameId);
}
