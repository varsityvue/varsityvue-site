import { games as scheduledGames } from "@/data/games";
import { applyVerifiedGames } from "@/data/verified-games";
import { week2GameAdditions } from "@/data/week2-game-additions";
import type { Game } from "@/types/platform";

const games = [...applyVerifiedGames(scheduledGames), ...week2GameAdditions];
const CENTRAL_TIME_ZONE = "America/Chicago";

export type ScoreboardGame = Game & {
  displayStatus: "Upcoming" | "Live" | "Final";
  isFeatured: boolean;
};

function getGameTimestamp(game: Game) {
  if (!game.kickoff) return Number.MAX_SAFE_INTEGER;

  if (!game.kickoff.includes("T")) {
    const [year, month, day] = game.kickoff.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day, 12));
    return Number.isNaN(parsed.getTime())
      ? Number.MAX_SAFE_INTEGER
      : parsed.getTime();
  }

  const timestamp = new Date(game.kickoff).getTime();

  return Number.isNaN(timestamp)
    ? Number.MAX_SAFE_INTEGER
    : timestamp;
}

function getCentralDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: CENTRAL_TIME_ZONE,
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : "";
}

function getCentralWeekStartKey(date: Date) {
  const dateKey = getCentralDateKey(date);
  if (!dateKey) return "";

  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: CENTRAL_TIME_ZONE,
  }).format(date);
  const weekdayIndex: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const daysSinceMonday = ((weekdayIndex[weekday] ?? 1) + 6) % 7;
  const [year, month, day] = dateKey.split("-").map(Number);
  const monday = new Date(Date.UTC(year, month - 1, day));
  monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);

  return monday.toISOString().slice(0, 10);
}

function isUpcomingByScheduleDate(game: Game, now = new Date()) {
  if (game.status !== "upcoming") return false;
  if (!game.kickoff) return true;

  if (!game.kickoff.includes("T")) {
    const todayKey = getCentralDateKey(now);
    return !todayKey || game.kickoff >= todayKey;
  }

  const timestamp = getGameTimestamp(game);
  return timestamp !== Number.MAX_SAFE_INTEGER && timestamp >= now.getTime();
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

  if (timestamp > now) return false;

  const weekStartKey = getCentralWeekStartKey(new Date(now));
  const gameDateKey = game.kickoff?.includes("T")
    ? getCentralDateKey(new Date(timestamp))
    : game.kickoff ?? "";

  return Boolean(weekStartKey && gameDateKey && gameDateKey >= weekStartKey);
}

function getHighestWeek(games: ScoreboardGame[]) {
  const weeks = games
    .map((game) => game.week)
    .filter((week): week is number => typeof week === "number");

  return weeks.length > 0 ? Math.max(...weeks) : undefined;
}

export function getScoreboardGames(): ScoreboardGame[] {
  return games
    .filter((game) => game.gameType !== "bye" && game.gameType !== "scrimmage")
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
  const nowDate = new Date(now);

  return (
    scoreboardGames.find(
      (game) => game.status === "live" && game.featured === true
    ) ??
    scoreboardGames
      .filter(
        (game) =>
          isRecentFinal(game, now) &&
          game.featured === true
      )
      .sort((a, b) => getGameTimestamp(b) - getGameTimestamp(a))[0] ??
    scoreboardGames.find(
      (game) => game.featured === true && isUpcomingByScheduleDate(game, nowDate)
    )
  );
}

export function getFeaturedScoreboardGame(): ScoreboardGame | undefined {
  const scoreboardGames = getScoreboardGames();
  const now = Date.now();
  const nowDate = new Date(now);

  return (
    scoreboardGames.find((game) => game.status === "live") ??
    scoreboardGames
      .filter((game) => isRecentFinal(game, now) && game.isFeatured)
      .sort((a, b) => getGameTimestamp(b) - getGameTimestamp(a))[0] ??
    scoreboardGames.find(
      (game) => game.isFeatured && isUpcomingByScheduleDate(game, nowDate)
    ) ??
    scoreboardGames.find((game) => isUpcomingByScheduleDate(game, nowDate))
  );
}

export function getLiveGames(): ScoreboardGame[] {
  return getScoreboardGames().filter((game) => game.status === "live");
}

export function getUpcomingScoreboardGames(limit = 5): ScoreboardGame[] {
  const now = new Date();

  return getScoreboardGames()
    .filter((game) => isUpcomingByScheduleDate(game, now))
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
  const recentFinals = getRecentFinalScoreboardGames(Math.max(limit * 3, 24));
  const finalWeek = getHighestWeek(recentFinals);

  if (recentFinals.length > 0) {
    const currentWeekFinals =
      finalWeek === undefined
        ? recentFinals
        : recentFinals.filter((game) => game.week === finalWeek);

    return {
      mode: "finals" as const,
      games: currentWeekFinals.slice(0, limit),
    };
  }

  const upcomingGames = getUpcomingScoreboardGames(Math.max(limit * 3, 24));
  const upcomingWeeks = upcomingGames
    .map((game) => game.week)
    .filter((week): week is number => typeof week === "number");
  const nextWeek = upcomingWeeks.length > 0 ? Math.min(...upcomingWeeks) : undefined;
  const currentWeekUpcoming =
    nextWeek === undefined
      ? upcomingGames
      : upcomingGames.filter((game) => game.week === nextWeek);

  return {
    mode: "upcoming" as const,
    games: currentWeekUpcoming.slice(0, limit),
  };
}

export function getFinalScoreboardGames(limit = 5): ScoreboardGame[] {
  return getScoreboardGames()
    .filter((game) => game.status === "final")
    .sort((a, b) => getGameTimestamp(b) - getGameTimestamp(a))
    .slice(0, limit);
}
