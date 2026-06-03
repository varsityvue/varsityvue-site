import { games } from "@/data/games";
import type { Game } from "@/types/platform";

function getGameTimestamp(game: Game) {
  if (!game.kickoff) return Number.MAX_SAFE_INTEGER;

  if (!game.kickoff.includes("T")) {
    const [year, month, day] = game.kickoff.split("-").map(Number);
    return new Date(year, month - 1, day).getTime();
  }

  const timestamp = new Date(game.kickoff).getTime();

  return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
}

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
      `Duplicate game IDs found in data/games.ts: ${duplicates.join(", ")}`
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
  return getGamesForSchool(slug).filter(
    (game) => game.status === "upcoming" && game.gameType !== "bye"
  );
}

export function getRecentScoresForSchool(slug: string) {
  return getGamesForSchool(slug)
    .filter((game) => game.status === "final" && game.gameType !== "bye")
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