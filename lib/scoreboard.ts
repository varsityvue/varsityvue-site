import { games } from "@/data/games";
import type { Game } from "@/types/platform";

export type ScoreboardGame = Game & {
  displayStatus: "Upcoming" | "Live" | "Final";
  isFeatured: boolean;
};

function getDisplayStatus(game: Game): ScoreboardGame["displayStatus"] {
  if (game.status === "live") return "Live";
  if (game.status === "final") return "Final";
  return "Upcoming";
}

function getGameTimestamp(game: Game) {
  if (!game.kickoff) return Number.MAX_SAFE_INTEGER;

  const timestamp = new Date(game.kickoff).getTime();

  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

function isGameFeatured(game: Game) {
  return (
    game.featured === true ||
    game.districtGame === true ||
    game.specialEvent !== undefined ||
    game.week === 1
  );
}

export function getScoreboardGames(): ScoreboardGame[] {
  return games
    .filter((game) => game.gameType !== "bye")
    .map((game) => ({
      ...game,
      displayStatus: getDisplayStatus(game),
      isFeatured: isGameFeatured(game),
    }))
    .sort((a, b) => getGameTimestamp(a) - getGameTimestamp(b));
}

export function getFeaturedScoreboardGame(): ScoreboardGame | undefined {
  const scoreboardGames = getScoreboardGames();

  return (
    scoreboardGames.find((game) => game.status === "live") ??
    scoreboardGames.find(
      (game) => game.status === "upcoming" && game.isFeatured
    ) ??
    scoreboardGames.find((game) => game.status === "upcoming") ??
    scoreboardGames[0]
  );
}

export function getLiveGames(): ScoreboardGame[] {
  return getScoreboardGames().filter((game) => game.status === "live");
}

export function getUpcomingScoreboardGames(limit = 5): ScoreboardGame[] {
  return getScoreboardGames()
    .filter((game) => game.status === "upcoming")
    .slice(0, limit);
}

export function getFinalScoreboardGames(limit = 5): ScoreboardGame[] {
  return getScoreboardGames()
    .filter((game) => game.status === "final")
    .slice(0, limit);
}