import { gameStats as baseGameStats } from "@/data/game-stats";
import { week2GameStats } from "@/data/week2-game-stats";
import { coachGameStats } from "@/data/coach-game-stats";
import { stamfordGameStats } from "@/data/stamford-game-stats";
import { ciscoGameStats } from "@/data/cisco-game-stats";
import { comancheGameStats } from "@/data/comanche-game-stats";
import { applyDeLeonStatCorrections } from "@/data/de-leon-stat-corrections";

const combinedGameStats = [
  ...baseGameStats,
  ...week2GameStats,
  ...coachGameStats,
  ...stamfordGameStats,
  ...ciscoGameStats,
  ...comancheGameStats,
];

function assertNoDuplicateGameStatIds() {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const game of combinedGameStats) {
    if (seen.has(game.gameId)) duplicates.push(game.gameId);
    seen.add(game.gameId);
  }

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate GameStats records found: ${Array.from(new Set(duplicates)).join(", ")}`
    );
  }
}

assertNoDuplicateGameStatIds();

export const gameStats = combinedGameStats.map((game) => {
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
