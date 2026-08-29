import { games as scheduledGames } from "@/data/games";
import { applyVerifiedGames } from "@/data/verified-games";
import type { Game } from "@/types/platform";

const games = applyVerifiedGames(scheduledGames);
const RESULT_WINDOW_HOURS = 60;

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

function isRecentFinal(game: Game, now = Date.now()) {
  if (game.status !== "final") return false;

  const timestamp = getGameTimestamp(game);
  if (!Number.isFinite(timestamp) || timestamp === Number.MAX_SAFE_INTEGER) {
    return false;
  }

  const age = now - timestamp;
  return age >= 0 && age <= RESULT_WINDOW_HOURS * 60 * 60 * 1000;
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
  if (selectedGame && isRecentFinal(selectedGame, now)) return selectedGame;

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
    scoreboardGames
      .filter((game) => isRecentFinal(game, now) && game.isFeatured)
      .sort((a, b) => getGameTimestamp(b) - getGameTimestamp(a))[0] ??
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
  const now = Date.now();

  return (
    scoreboardGames.find((game) => game.status === "live") ??
    scoreboardGames
      .filter((game) => isRecentFinal(game, now) && game.isFeatured)
      .sort((a, b) => getGameTimestamp(b) - getGameTimestamp(a))[0] ??
    scoreboardGames.find(
      (game) =>
        game.status === "upcoming" &&
        game.isFeatured &&
        getGameTimestamp(game) >= now
    ) ??
    scoreboardGames.find(
      (game) =>
        game.status === "upcoming" &&
        getGameTimestamp(game) >= now
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

export function getRecentFinalScoreboardGames(limit = 8): ScoreboardGame[] {
  const now = Date.now();

  return getScoreboardGames()
    .filter((game) => isRecentFinal(game, now))
    .sort((a, b) => {
      if (a.week !== b.week) return (b.week ?? -1) - (a.week ?? -1);
      if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
      return getGameTimestamp(b) - getGameTimestamp(a);
    })
    .slice(0, limit);
}

export function getHomepageScoreboardGames(limit = 8) {
  const recentFinals = getRecentFinalScoreboardGames(limit);

  if (recentFinals.length > 0) {
    return {
      mode: "finals" as const,
      games: recentFinals,
    };
  }

  return {
    mode: "upcoming" as const,
    games: getUpcomingScoreboardGames(limit),
  };
}

export function getFinalScoreboardGames(limit = 5): ScoreboardGame[] {
  return getScoreboardGames()
    .filter((game) => game.status === "final")
    .sort((a, b) => getGameTimestamp(b) - getGameTimestamp(a))
    .slice(0, limit);
}
