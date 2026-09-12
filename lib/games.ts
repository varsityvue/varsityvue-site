import { games as scheduledGames } from "@/data/games";
import { applyVerifiedGames } from "@/data/verified-games";
import { week2GameAdditions } from "@/data/week2-game-additions";
import { santoGames } from "@/data/santo-games";
import { liveGameAdditions } from "@/data/live-game-additions";
import { lateWeek3Results } from "@/data/late-week3-results";
import { followedDistrictResults } from "@/data/followed-district-results";
import { getSchoolBySlug } from "@/lib/schools";
import type { Game } from "@/types/platform";

const GAME_OF_THE_WEEK_IDS = new Set(["stamford-at-hawley-2026-week-3"]);
const santoGameIds = new Set(santoGames.map((game) => game.id));
const AUTO_LIVE_WINDOW_MS = 4 * 60 * 60 * 1000;

function applyEditorialGameFlags(game: Game): Game {
  if (!GAME_OF_THE_WEEK_IDS.has(game.id)) return game;

  return {
    ...game,
    featured: true,
    specialEvent: "Game of the Week",
    coverageStatus: "preview-published",
  };
}

const verifiedScheduledGames = applyVerifiedGames(scheduledGames).filter(
  (game) => !santoGameIds.has(game.id),
);

const baseGames = [
  ...verifiedScheduledGames,
  ...week2GameAdditions,
  ...santoGames,
];

const gamesById = new Map(baseGames.map((game) => [game.id, game]));
for (const verifiedGame of [
  ...followedDistrictResults,
  ...liveGameAdditions,
  ...lateWeek3Results,
]) {
  const existing = gamesById.get(verifiedGame.id);
  gamesById.set(
    verifiedGame.id,
    existing ? { ...existing, ...verifiedGame } : verifiedGame,
  );
}

const rawGames = Array.from(gamesById.values()).map(applyEditorialGameFlags);

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

function markPastUnverifiedGame(game: Game): Game {
  return {
    ...game,
    status: "scheduled",
    featured: false,
    specialEvent: undefined,
  };
}

function normalizeGameStatus(game: Game, now = new Date()): Game {
  if (game.status !== "upcoming" || !game.kickoff) return game;

  const todayKey = getCentralDateKey(now);

  if (!game.kickoff.includes("T")) {
    if (todayKey && game.kickoff < todayKey) return markPastUnverifiedGame(game);
    return game;
  }

  const timestamp = getGameTimestamp(game);
  if (timestamp === Number.MAX_SAFE_INTEGER) return game;

  const elapsed = now.getTime() - timestamp;
  if (elapsed >= 0 && elapsed <= AUTO_LIVE_WINDOW_MS) {
    return {
      ...game,
      status: "live",
      coverageStatus: game.coverageStatus === "none" ? "live" : game.coverageStatus,
    };
  }

  if (elapsed > AUTO_LIVE_WINDOW_MS) {
    return markPastUnverifiedGame(game);
  }

  return game;
}

function getNormalizedGames(now = new Date()) {
  return rawGames.map((game) => normalizeGameStatus(game, now));
}

function assertNoDuplicateGameIds() {
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const game of rawGames) {
    if (seen.has(game.id)) duplicates.push(game.id);
    seen.add(game.id);
  }

  if (duplicates.length > 0) {
    throw new Error(
      `Duplicate game IDs found after verified results are applied: ${duplicates.join(", ")}`,
    );
  }
}

function assertGameScoreConsistency() {
  const problems: string[] = [];

  for (const game of rawGames) {
    const hasHomeScore = typeof game.homeScore === "number";
    const hasAwayScore = typeof game.awayScore === "number";

    if (game.status === "final" && (!hasHomeScore || !hasAwayScore)) {
      problems.push(`${game.id}: final without both team scores`);
      continue;
    }

    if (
      game.score &&
      hasHomeScore &&
      hasAwayScore &&
      (game.score.home !== game.homeScore || game.score.away !== game.awayScore)
    ) {
      problems.push(`${game.id}: score fields disagree`);
    }
  }

  if (problems.length > 0) {
    throw new Error(`Game score integrity check failed (${problems.join("; ")})`);
  }
}

function assertDistrictGameSchoolReferences() {
  const problems: string[] = [];

  for (const game of rawGames) {
    if (!game.districtGame) continue;

    const homeSchool = game.homeSchoolSlug
      ? getSchoolBySlug(game.homeSchoolSlug)
      : undefined;
    const awaySchool = game.awaySchoolSlug
      ? getSchoolBySlug(game.awaySchoolSlug)
      : undefined;

    if (!homeSchool || !awaySchool) continue;
    if (homeSchool.districtId === "opponent" || awaySchool.districtId === "opponent") {
      continue;
    }

    if (homeSchool.districtId !== awaySchool.districtId) {
      problems.push(
        `${game.id}: district opponents are assigned to different districts`,
      );
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `District game integrity check failed (${problems.join("; ")})`,
    );
  }
}

assertNoDuplicateGameIds();
assertGameScoreConsistency();
assertDistrictGameSchoolReferences();

export function getGames() {
  return getNormalizedGames();
}

export function getGameById(id: string) {
  return getNormalizedGames().find((game) => game.id === id);
}

export function getGamesForSchool(slug: string) {
  return getNormalizedGames()
    .filter(
      (game) =>
        game.homeSchoolSlug === slug || game.awaySchoolSlug === slug,
    )
    .sort((a, b) => getGameTimestamp(a) - getGameTimestamp(b));
}

export function getUpcomingGamesForSchool(slug: string) {
  const now = new Date();
  const todayKey = getCentralDateKey(now);

  return getGamesForSchool(slug).filter((game) => {
    if (game.status !== "upcoming" || game.gameType === "bye") return false;

    if (game.kickoff && !game.kickoff.includes("T")) {
      return !todayKey || game.kickoff >= todayKey;
    }

    return getGameTimestamp(game) >= now.getTime();
  });
}

export function getRecentScoresForSchool(slug: string) {
  return getGamesForSchool(slug)
    .filter(
      (game) =>
        game.status === "final" &&
        game.gameType !== "bye" &&
        game.gameType !== "scrimmage",
    )
    .sort((a, b) => getGameTimestamp(b) - getGameTimestamp(a));
}

export function getFeaturedGames() {
  return getNormalizedGames()
    .filter((game) => game.featured && game.status === "upcoming")
    .sort((a, b) => getGameTimestamp(a) - getGameTimestamp(b));
}

export function getDistrictGames() {
  return getNormalizedGames()
    .filter((game) => game.districtGame)
    .sort((a, b) => getGameTimestamp(a) - getGameTimestamp(b));
}

export function getNextGameForSchool(slug: string) {
  return getUpcomingGamesForSchool(slug)[0];
}
