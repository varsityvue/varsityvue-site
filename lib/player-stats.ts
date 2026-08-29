import { gameStats } from "@/data/game-stats";
import { getSchoolBySlug } from "@/lib/schools";

export type PlayerSeasonStats = {
  playerId: string;
  player: string;
  schoolSlug: string;
  season: number;
  gamesRecorded: number;
  rushing: {
    attempts: number;
    yards: number;
    touchdowns: number;
    yardsPerCarry: number;
  };
  passing: {
    completions: number;
    attempts: number;
    yards: number;
    touchdowns: number;
    interceptions: number;
    completionPercentage: number;
  };
  receiving: {
    receptions: number;
    yards: number;
    touchdowns: number;
    yardsPerReception: number;
  };
};

export type RushingLeaderboardEntry = Pick<
  PlayerSeasonStats,
  "playerId" | "player" | "schoolSlug" | "season" | "gamesRecorded" | "rushing"
>;

export type PassingLeaderboardEntry = Pick<
  PlayerSeasonStats,
  "playerId" | "player" | "schoolSlug" | "season" | "gamesRecorded" | "passing"
>;

export type ReceivingLeaderboardEntry = Pick<
  PlayerSeasonStats,
  "playerId" | "player" | "schoolSlug" | "season" | "gamesRecorded" | "receiving"
>;

function normalizePlayerName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getPlayerId(schoolSlug: string, player: string, season: number) {
  return `${schoolSlug}-${normalizePlayerName(player)}-${season}`;
}

function inferSeason(gameId: string) {
  const match = gameId.match(/-(20\d{2})-/);
  return match ? Number(match[1]) : undefined;
}

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function getPlayerSeasonStats(season = 2026): PlayerSeasonStats[] {
  const players = new Map<string, PlayerSeasonStats>();
  const gamesByPlayer = new Map<string, Set<string>>();

  function ensurePlayer(player: string, schoolSlug: string) {
    const playerId = getPlayerId(schoolSlug, player, season);
    const existing = players.get(playerId);
    if (existing) return existing;

    const created: PlayerSeasonStats = {
      playerId,
      player,
      schoolSlug,
      season,
      gamesRecorded: 0,
      rushing: { attempts: 0, yards: 0, touchdowns: 0, yardsPerCarry: 0 },
      passing: {
        completions: 0,
        attempts: 0,
        yards: 0,
        touchdowns: 0,
        interceptions: 0,
        completionPercentage: 0,
      },
      receiving: { receptions: 0, yards: 0, touchdowns: 0, yardsPerReception: 0 },
    };

    players.set(playerId, created);
    gamesByPlayer.set(playerId, new Set<string>());
    return created;
  }

  for (const game of gameStats) {
    if (inferSeason(game.gameId) !== season) continue;

    for (const line of game.rushing) {
      const player = ensurePlayer(line.player, line.schoolSlug);
      player.rushing.attempts += line.attempts;
      player.rushing.yards += line.yards;
      player.rushing.touchdowns += line.touchdowns ?? 0;
      gamesByPlayer.get(player.playerId)?.add(game.gameId);
    }

    for (const line of game.passing) {
      const player = ensurePlayer(line.player, line.schoolSlug);
      player.passing.completions += line.completions;
      player.passing.attempts += line.attempts;
      player.passing.yards += line.yards;
      player.passing.touchdowns += line.touchdowns ?? 0;
      player.passing.interceptions += line.interceptions;
      gamesByPlayer.get(player.playerId)?.add(game.gameId);
    }

    for (const line of game.receiving) {
      const player = ensurePlayer(line.player, line.schoolSlug);
      player.receiving.receptions += line.receptions;
      player.receiving.yards += line.yards;
      player.receiving.touchdowns += line.touchdowns ?? 0;
      gamesByPlayer.get(player.playerId)?.add(game.gameId);
    }
  }

  for (const player of players.values()) {
    player.gamesRecorded = gamesByPlayer.get(player.playerId)?.size ?? 0;
    player.rushing.yardsPerCarry = player.rushing.attempts
      ? round(player.rushing.yards / player.rushing.attempts)
      : 0;
    player.passing.completionPercentage = player.passing.attempts
      ? round((player.passing.completions / player.passing.attempts) * 100)
      : 0;
    player.receiving.yardsPerReception = player.receiving.receptions
      ? round(player.receiving.yards / player.receiving.receptions)
      : 0;
  }

  return Array.from(players.values());
}

export function getPlayerSeasonStat(playerId: string, season = 2026) {
  return getPlayerSeasonStats(season).find((player) => player.playerId === playerId);
}

function matchesScope(player: PlayerSeasonStats, schoolSlug?: string, districtId?: string) {
  if (schoolSlug && player.schoolSlug !== schoolSlug) return false;
  if (districtId) {
    const school = getSchoolBySlug(player.schoolSlug);
    if (!school || school.districtId !== districtId) return false;
  }
  return true;
}

export function getSchoolRushingLeaders(schoolSlug: string, season = 2026) {
  return getRushingLeaders({ season, schoolSlug });
}

export function getDistrictRushingLeaders(districtId: string, season = 2026) {
  return getRushingLeaders({ season, districtId });
}

export function getAreaRushingLeaders(season = 2026) {
  return getRushingLeaders({ season });
}

export function getRushingLeaders({
  season = 2026,
  schoolSlug,
  districtId,
  minAttempts = 0,
  sortBy = "yards",
}: {
  season?: number;
  schoolSlug?: string;
  districtId?: string;
  minAttempts?: number;
  sortBy?: "yards" | "touchdowns" | "yardsPerCarry";
} = {}): RushingLeaderboardEntry[] {
  return getPlayerSeasonStats(season)
    .filter((player) => matchesScope(player, schoolSlug, districtId) && player.rushing.attempts >= minAttempts)
    .sort((a, b) => {
      const primary = b.rushing[sortBy] - a.rushing[sortBy];
      if (primary !== 0) return primary;
      return b.rushing.yards - a.rushing.yards;
    })
    .map(({ playerId, player, schoolSlug: slug, season: playerSeason, gamesRecorded, rushing }) => ({
      playerId,
      player,
      schoolSlug: slug,
      season: playerSeason,
      gamesRecorded,
      rushing,
    }));
}

export function getPassingLeaders({
  season = 2026,
  schoolSlug,
  districtId,
  minAttempts = 0,
  sortBy = "yards",
}: {
  season?: number;
  schoolSlug?: string;
  districtId?: string;
  minAttempts?: number;
  sortBy?: "yards" | "touchdowns" | "completionPercentage";
} = {}): PassingLeaderboardEntry[] {
  return getPlayerSeasonStats(season)
    .filter((player) => matchesScope(player, schoolSlug, districtId) && player.passing.attempts >= minAttempts)
    .sort((a, b) => {
      const primary = b.passing[sortBy] - a.passing[sortBy];
      if (primary !== 0) return primary;
      return b.passing.yards - a.passing.yards;
    })
    .map(({ playerId, player, schoolSlug: slug, season: playerSeason, gamesRecorded, passing }) => ({
      playerId,
      player,
      schoolSlug: slug,
      season: playerSeason,
      gamesRecorded,
      passing,
    }));
}

export function getReceivingLeaders({
  season = 2026,
  schoolSlug,
  districtId,
  minReceptions = 0,
  sortBy = "yards",
}: {
  season?: number;
  schoolSlug?: string;
  districtId?: string;
  minReceptions?: number;
  sortBy?: "yards" | "touchdowns" | "receptions" | "yardsPerReception";
} = {}): ReceivingLeaderboardEntry[] {
  return getPlayerSeasonStats(season)
    .filter((player) => matchesScope(player, schoolSlug, districtId) && player.receiving.receptions >= minReceptions)
    .sort((a, b) => {
      const primary = b.receiving[sortBy] - a.receiving[sortBy];
      if (primary !== 0) return primary;
      return b.receiving.yards - a.receiving.yards;
    })
    .map(({ playerId, player, schoolSlug: slug, season: playerSeason, gamesRecorded, receiving }) => ({
      playerId,
      player,
      schoolSlug: slug,
      season: playerSeason,
      gamesRecorded,
      receiving,
    }));
}
