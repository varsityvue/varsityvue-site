import { games as scheduledGames } from "@/data/games";
import { applyVerifiedGames } from "@/data/verified-games";
import { week2GameAdditions } from "@/data/week2-game-additions";
import type { Game } from "@/types/platform";

const rawGames = [...applyVerifiedGames(scheduledGames), ...week2GameAdditions];
const CENTRAL_TIME_ZONE = "America/Chicago";

function getGameTimestamp(game: Game) {
  if (!game.kickoff) return Number.MAX_SAFE_INTEGER;

  if (!game.kickoff.includes("T")) {
    const [year, month, day] = game.kickoff.split("-").map(Number);
    const timestamp = Date.UTC(year, month - 1, day, 12);
    return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
  }

  const timestamp = new Date(game.kickoff).getTime();

  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
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

function normalizeGameStatus(game: Game, now = new Date()): Game {
  if (game.status !== "upcoming" || !game.kickoff) {
    return game;
  }

  const todayKey = getCentralDateKey(now);

  if (!game.kickoff.includes("T")) {
    if (todayKey && game.kickoff < todayKey) {
      return { ...game, status: "scheduled" };
    }

    return game;
  }

  const timestamp = getGameTimestamp(game);

  if (timestamp !== Number.MAX_SAFE_INTEGER && timestamp < now.getTime()) {
    return { ...game, status: "scheduled" };
  }

  return game;
}

const games = rawGames.map((game) => normalizeGameStatus(game));

function assertNoDuplicateGameIds() {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const game of games) {
    if (seen.has(game.id)) {
      duplicates.push(game.id);
    }

    seen.add(game.id);
  }

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate game IDs found after verified results are applied: ${duplicates.join(", ")}`
    );
  }
}

assertNoDuplicateGameIds();

export function getGames() {
  return games;
}

export function getGameById(id: string) {
  return games.find((game) => game.id === id);
}

export function getGamesForSchool(slug: string) {
  return games
    .filter(
      (game) => game.homeSchoolSlug === slug || game.awaySchoolSlug === slug
    )
    .sort((a, b) => getGameTimestamp(a) - getGameTimestamp(b));
}

export function getUpcomingGamesForSchool(slug: string) {
  const now = new Date();
  const todayKey = getCentralDateKey(now);

  return getGamesForSchool(slug).filter((game) => {
    if (game.status !== "upcoming" || game.gameType === "bye") {
      return false;
    }

    if (game.kickoff && !game.kickoff.includes("T")) {
      return !todayKey || game.kickoff >= todayKey;
    }

    const timestamp = getGameTimestamp(game);

    return timestamp >= now.getTime();
  });
}

export function getRecentScoresForSchool(slug: string) {
  return getGamesForSchool(slug)
    .filter(
      (game) =>
        game.status === "final" &&
        game.gameType !== "bye" &&
        game.gameType !== "scrimmage"
    )
    .sort((a, b) => getGameTimestamp(b) - getGameTimestamp(a));
}

export function getFeaturedGames() {
  return games
    .filter((game) => game.featured && game.status === "upcoming")
    .sort((a, b) => getGameTimestamp(a) - getGameTimestamp(b));
}

export function getDistrictGames() {
  return games
    .filter((game) => game.districtGame)
    .sort((a, b) => getGameTimestamp(a) - getGameTimestamp(b));
}

export function getNextGameForSchool(slug: string) {
  return getUpcomingGamesForSchool(slug)[0];
}
