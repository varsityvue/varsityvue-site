import { gameStats as baseGameStats } from "@/data/game-stats";
import { week2GameStats } from "@/data/week2-game-stats";
import { coachGameStats } from "@/data/coach-game-stats";

const combinedGameStats = [
  ...baseGameStats,
  ...week2GameStats,
  ...coachGameStats,
];

export const gameStats = combinedGameStats.map((game) => {
  if (game.gameId !== "hawley-at-albany-2026-week-1") return game;

  return {
    ...game,
    quarterScores: game.quarterScores.map((line) =>
      line.schoolSlug === "hawley"
        ? { ...line, quarters: [13, 6, 0, 8], total: 27 }
        : line
    ),
  };
});
