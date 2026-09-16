import { gameStats } from "@/lib/all-game-stats";
import { getPlayerId } from "@/lib/player-identity";
import { getPlayerProfile } from "@/lib/player-profiles";
import { getSchoolBySlug } from "@/lib/schools";
import { addOptionalStatTotal, compareOptionalStatsDescending } from "@/lib/stat-values";
import { getAggregateCompleteness, getSeasonCategoryCompleteness, type PublicCompleteness } from "@/lib/stat-completeness-public";

export { getPlayerId } from "@/lib/player-identity";

export type PlayerSeasonStats = {
  playerId: string;
  player: string;
  schoolSlug: string;
  season: number;
  gamesRecorded: number;
  coverage: { rushing: PublicCompleteness; passing: PublicCompleteness; receiving: PublicCompleteness; totalTouchdowns: PublicCompleteness };
  rushing: { attempts: number; yards: number; touchdowns?: number; yardsPerCarry: number };
  passing: { completions: number; attempts: number; yards: number; touchdowns?: number; interceptions: number; completionPercentage: number };
  receiving: { receptions: number; yards: number; touchdowns?: number; yardsPerReception: number };
};

export type RushingLeaderboardEntry = Pick<PlayerSeasonStats, "playerId" | "player" | "schoolSlug" | "season" | "gamesRecorded" | "coverage" | "rushing">;
export type PassingLeaderboardEntry = Pick<PlayerSeasonStats, "playerId" | "player" | "schoolSlug" | "season" | "gamesRecorded" | "coverage" | "passing">;
export type ReceivingLeaderboardEntry = Pick<PlayerSeasonStats, "playerId" | "player" | "schoolSlug" | "season" | "gamesRecorded" | "coverage" | "receiving">;

function round(value: number, decimals = 1) { const factor = 10 ** decimals; return Math.round(value * factor) / factor; }

function coverageFor(schoolSlug: string, season: number): PlayerSeasonStats["coverage"] {
  const rushing = getSeasonCategoryCompleteness(gameStats, schoolSlug, "rushing", season);
  const passing = getSeasonCategoryCompleteness(gameStats, schoolSlug, "passing", season);
  const receiving = getSeasonCategoryCompleteness(gameStats, schoolSlug, "receiving", season);
  return {
    rushing: rushing.status,
    passing: passing.status,
    receiving: receiving.status,
    totalTouchdowns: getAggregateCompleteness([rushing, passing, receiving]).status,
  };
}

function emptyPlayerSeasonStats({ playerId, player, schoolSlug, season }: { playerId: string; player: string; schoolSlug: string; season: number }): PlayerSeasonStats {
  return {
    playerId, player, schoolSlug, season, gamesRecorded: 0,
    coverage: coverageFor(schoolSlug, season),
    rushing: { attempts: 0, yards: 0, touchdowns: 0, yardsPerCarry: 0 },
    passing: { completions: 0, attempts: 0, yards: 0, touchdowns: 0, interceptions: 0, completionPercentage: 0 },
    receiving: { receptions: 0, yards: 0, touchdowns: 0, yardsPerReception: 0 },
  };
}

export function getPlayerSeasonStats(season = 2026): PlayerSeasonStats[] {
  const players = new Map<string, PlayerSeasonStats>();
  const gamesByPlayer = new Map<string, Set<string>>();
  function ensurePlayer(player: string, schoolSlug: string, explicitPlayerId?: string) {
    const playerId = explicitPlayerId ?? getPlayerId(schoolSlug, player, season);
    const existing = players.get(playerId); if (existing) return existing;
    const created = emptyPlayerSeasonStats({ playerId, player, schoolSlug, season }); players.set(playerId, created); gamesByPlayer.set(playerId, new Set<string>()); return created;
  }
  for (const game of gameStats) {
    if (game.season !== season) continue;
    for (const line of game.rushing) { const player = ensurePlayer(line.player, line.schoolSlug, line.playerId); player.rushing.attempts += line.attempts; player.rushing.yards += line.yards; player.rushing.touchdowns = addOptionalStatTotal(player.rushing.touchdowns, line.touchdowns); gamesByPlayer.get(player.playerId)?.add(game.gameId); }
    for (const line of game.passing) { const player = ensurePlayer(line.player, line.schoolSlug, line.playerId); player.passing.completions += line.completions; player.passing.attempts += line.attempts; player.passing.yards += line.yards; player.passing.touchdowns = addOptionalStatTotal(player.passing.touchdowns, line.touchdowns); player.passing.interceptions += line.interceptions; gamesByPlayer.get(player.playerId)?.add(game.gameId); }
    for (const line of game.receiving) { const player = ensurePlayer(line.player, line.schoolSlug, line.playerId); player.receiving.receptions += line.receptions; player.receiving.yards += line.yards; player.receiving.touchdowns = addOptionalStatTotal(player.receiving.touchdowns, line.touchdowns); gamesByPlayer.get(player.playerId)?.add(game.gameId); }
  }
  for (const player of players.values()) {
    player.gamesRecorded = gamesByPlayer.get(player.playerId)?.size ?? 0;
    player.rushing.yardsPerCarry = player.rushing.attempts ? round(player.rushing.yards / player.rushing.attempts) : 0;
    player.passing.completionPercentage = player.passing.attempts ? round((player.passing.completions / player.passing.attempts) * 100) : 0;
    player.receiving.yardsPerReception = player.receiving.receptions ? round(player.receiving.yards / player.receiving.receptions) : 0;
  }
  return Array.from(players.values());
}

export function getPlayerSeasonStat(playerId: string, season = 2026) {
  const statisticalPlayer = getPlayerSeasonStats(season).find((player) => player.playerId === playerId); if (statisticalPlayer) return statisticalPlayer;
  const profile = getPlayerProfile(playerId, season); if (!profile) return undefined;
  return emptyPlayerSeasonStats({ playerId: profile.playerId, player: profile.name, schoolSlug: profile.schoolSlug, season: profile.season });
}

function matchesScope(player: PlayerSeasonStats, schoolSlug?: string, districtId?: string) {
  if (schoolSlug && player.schoolSlug !== schoolSlug) return false;
  if (districtId) { const school = getSchoolBySlug(player.schoolSlug); if (!school || school.districtId !== districtId) return false; }
  return true;
}

export function getSchoolRushingLeaders(schoolSlug: string, season = 2026) { return getRushingLeaders({ season, schoolSlug }); }
export function getDistrictRushingLeaders(districtId: string, season = 2026) { return getRushingLeaders({ season, districtId }); }
export function getAreaRushingLeaders(season = 2026) { return getRushingLeaders({ season }); }

export function getRushingLeaders({ season = 2026, schoolSlug, districtId, minAttempts = 0, sortBy = "yards" }: { season?: number; schoolSlug?: string; districtId?: string; minAttempts?: number; sortBy?: "yards" | "touchdowns" | "yardsPerCarry" } = {}): RushingLeaderboardEntry[] {
  return getPlayerSeasonStats(season).filter((player) => matchesScope(player, schoolSlug, districtId) && player.rushing.attempts >= minAttempts && (sortBy !== "touchdowns" || player.rushing.touchdowns !== undefined)).sort((a, b) => { const primary = compareOptionalStatsDescending(a.rushing[sortBy], b.rushing[sortBy]); return primary !== 0 ? primary : b.rushing.yards - a.rushing.yards; }).map(({ playerId, player, schoolSlug: slug, season: playerSeason, gamesRecorded, coverage, rushing }) => ({ playerId, player, schoolSlug: slug, season: playerSeason, gamesRecorded, coverage, rushing }));
}

export function getPassingLeaders({ season = 2026, schoolSlug, districtId, minAttempts = 0, sortBy = "yards" }: { season?: number; schoolSlug?: string; districtId?: string; minAttempts?: number; sortBy?: "yards" | "touchdowns" | "completionPercentage" } = {}): PassingLeaderboardEntry[] {
  return getPlayerSeasonStats(season).filter((player) => matchesScope(player, schoolSlug, districtId) && player.passing.attempts >= minAttempts && (sortBy !== "touchdowns" || player.passing.touchdowns !== undefined)).sort((a, b) => { const primary = compareOptionalStatsDescending(a.passing[sortBy], b.passing[sortBy]); return primary !== 0 ? primary : b.passing.yards - a.passing.yards; }).map(({ playerId, player, schoolSlug: slug, season: playerSeason, gamesRecorded, coverage, passing }) => ({ playerId, player, schoolSlug: slug, season: playerSeason, gamesRecorded, coverage, passing }));
}

export function getReceivingLeaders({ season = 2026, schoolSlug, districtId, minReceptions = 0, sortBy = "yards" }: { season?: number; schoolSlug?: string; districtId?: string; minReceptions?: number; sortBy?: "yards" | "touchdowns" | "receptions" | "yardsPerReception" } = {}): ReceivingLeaderboardEntry[] {
  return getPlayerSeasonStats(season).filter((player) => matchesScope(player, schoolSlug, districtId) && player.receiving.receptions >= minReceptions && (sortBy !== "touchdowns" || player.receiving.touchdowns !== undefined)).sort((a, b) => { const primary = compareOptionalStatsDescending(a.receiving[sortBy], b.receiving[sortBy]); return primary !== 0 ? primary : b.receiving.yards - a.receiving.yards; }).map(({ playerId, player, schoolSlug: slug, season: playerSeason, gamesRecorded, coverage, receiving }) => ({ playerId, player, schoolSlug: slug, season: playerSeason, gamesRecorded, coverage, receiving }));
}
