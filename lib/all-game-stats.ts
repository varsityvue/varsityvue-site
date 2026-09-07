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

function getGameIdentity(game: (typeof combinedGameStats)[number]) {
  const weekMatch = game.gameId.match(/-week-(\d+)(?:$|-)/);
  const week = weekMatch?.[1];
  const participants = Array.from(
    new Set(game.quarterScores.map((line) => line.schoolSlug))
  ).sort();

  // A few legacy stat records use opposite home/away wording in gameId for the
  // same matchup. Prefer season + week + participants so those records cannot
  // be counted twice. Fall back to gameId when a full matchup cannot be proved.
  if (week && participants.length === 2) {
    return `${game.season}|week-${week}|${participants.join("|")}`;
  }

  return `${game.season}|${game.gameId}`;
}

// Legacy data and newer audited files can contain the same game under different
// gameIds (for example, reversed home/away wording). Keep exactly one statistical
// record per actual matchup. Later sources are the audited sources and therefore
// intentionally override earlier legacy records.
const uniqueGameStats = Array.from(
  combinedGameStats.reduce((games, game) => {
    games.set(getGameIdentity(game), game);
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
