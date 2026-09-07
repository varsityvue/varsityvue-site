import { gameStats as baseGameStats } from "@/data/game-stats";
import { week2GameStats } from "@/data/week2-game-stats";
import { coachGameStats } from "@/data/coach-game-stats";
import { stamfordGameStats } from "@/data/stamford-game-stats";
import { ciscoGameStats } from "@/data/cisco-game-stats";
import { comancheGameStats } from "@/data/comanche-game-stats";
import { albanyGameStats } from "@/data/albany-game-stats";
import { stephenvilleGameStats } from "@/data/stephenville-game-stats";
import { applyDeLeonStatCorrections } from "@/data/de-leon-stat-corrections";

const combinedGameStats = [
  ...baseGameStats,
  ...week2GameStats,
  ...coachGameStats,
  ...stamfordGameStats,
  ...ciscoGameStats,
  ...comancheGameStats,
  ...albanyGameStats,
  ...stephenvilleGameStats,
];

// Some pilot games existed in the legacy dataset before their audited stat files
// were added. Keep exactly one record per game and let later, audited datasets
// override earlier legacy entries with the same gameId.
const uniqueGameStats = Array.from(
  combinedGameStats.reduce((games, game) => {
    games.set(game.gameId, game);
    return games;
  }, new Map<string, (typeof combinedGameStats)[number]>()).values()
);

export const gameStats = uniqueGameStats.map((game) => {
  const correctedGame = applyDeLeonStatCorrections(game);

  if (correctedGame.gameId !== "hawley-at-albany-2026-week-1") return correctedGame;

  return {
    ...correctedGame,
    quarterScores: correctedGame.quarterScores.map((line) =>
      line.schoolSlug === "hawley"
        ? { ...line, quarters: [13, 6, 0, 8], total: 27 }
        : line
    ),
  };
});
