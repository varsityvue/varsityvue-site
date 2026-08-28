import { games } from "@/data/games";
import type { Game } from "@/types/platform";

export type ScoreboardGame = Game & {
  displayStatus: "Upcoming" | "Live" | "Final";
  isFeatured: boolean;
};

function getGameTimestamp(game: Game) {
  if (!game.kickoff) return Number.MAX_SAFE_INTEGER;

  if (!game.kickoff.includes("T")) {
    const [year, month, day] = game.kickoff.split("-").map(Number);
    return new Date(year, month - 1, day).getTime();
  }

  const timestamp = new Date(game.kickoff).getTime();

  return Number.isNaN(timestamp)
    ? Number.MAX_SAFE_INTEGER
    : timestamp;
}

function getDisplayStatus(game: Game): ScoreboardGame["displayStatus"] {
  if (game.status === "live") return "Live";
  if (game.status === "final") return "Final";
  return "Upcoming";
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

export function getGameOfTheWeek(): ScoreboardGame | undefined {
  const scoreboardGames = getScoreboardGames();
  const now = Date.now();

  const selectedGameOfTheWeekId = "cisco-at-clyde-2026-week-1";

  const selectedGame = scoreboardGames.find(
    (game) => game.id === selectedGameOfTheWeekId
  );

  if (selectedGame?.status === "live") return selectedGame;

  if (
    selectedGame?.status === "upcoming" &&
    getGameTimestamp(selectedGame) >= now
  ) {
    return selectedGame;
  }

  return (
    scoreboardGames.find(
      (game) =>
        game.status === "live" &&
        game.featured === true &&
        game.coverageStatus === "planned"
    ) ??
    scoreboardGames.find(
      (game) =>
        game.status === "upcoming" &&
        game.featured === true &&
        game.coverageStatus === "planned" &&
        getGameTimestamp(game) >= now
    ) ??
    scoreboardGames.find(
      (game) =>
        game.status === "upcoming" &&
        game.isFeatured &&
        getGameTimestamp(game) >= now
    )
  );
}

export function getFeaturedScoreboardGame(): ScoreboardGame | undefined {
  const scoreboardGames = getScoreboardGames();

  return (
    scoreboardGames.find((game) => game.status === "live") ??
    scoreboardGames.find(
      (game) =>
        game.status === "upcoming" &&
        game.isFeatured &&
        getGameTimestamp(game) >= Date.now()
    ) ??
    scoreboardGames.find(
      (game) =>
        game.status === "upcoming" &&
        getGameTimestamp(game) >= Date.now()
    ) ??
    scoreboardGames.find((game) => game.status === "final")
  );
}

export function getLiveGames(): ScoreboardGame[] {
  return getScoreboardGames().filter((game) => game.status === "live");
}

export function getUpcomingScoreboardGames(limit = 5): ScoreboardGame[] {
  const now = Date.now();

  return getScoreboardGames()
    .filter(
      (game) =>
        game.status === "upcoming" &&
        getGameTimestamp(game) >= now
    )
    .slice(0, limit);
}

export function getFinalScoreboardGames(limit = 5): ScoreboardGame[] {
  return getScoreboardGames()
    .filter((game) => game.status === "final")
    .sort((a, b) => getGameTimestamp(b) - getGameTimestamp(a))
    .slice(0, limit);
}
