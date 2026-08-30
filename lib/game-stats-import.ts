import type { GameStats } from "@/data/game-stats";
import { getPlayerId } from "@/lib/player-identity";
import { getSchoolPlayerProfiles } from "@/lib/player-profiles";

export type GameStatsImportResult =
  | { ok: true; stats: GameStats; notices: string[] }
  | { ok: false; errors: string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function parseGameStatsDraft(input: string): GameStatsImportResult {
  let parsed: unknown;
  try { parsed = JSON.parse(input); } catch { return { ok: false, errors: ["The pasted content is not valid JSON."] }; }
  if (!isRecord(parsed)) return { ok: false, errors: ["The import must be a single game-stat object."] };

  const requiredStrings = ["gameId", "sourceStatus", "sourceLabel"] as const;
  const errors: string[] = [];
  for (const key of requiredStrings) {
    if (typeof parsed[key] !== "string" || !String(parsed[key]).trim()) errors.push(`${key} is required.`);
  }
  if (!Number.isInteger(parsed.season)) errors.push("season must be an integer year.");
  if (parsed.sourceStatus !== "verified") errors.push('sourceStatus must be "verified" before review can be approved.');

  const arrayFields = ["quarterScores", "scoringPlays", "teamStats", "rushing", "passing", "receiving"] as const;
  for (const key of arrayFields) if (!isArray(parsed[key])) errors.push(`${key} must be an array.`);
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, stats: parsed as GameStats, notices: [] };
}

export function resolveKnownPlayerIds(stats: GameStats) {
  const notices: string[] = [];
  const profileLookup = new Map<string, string>();
  const schoolSlugs = new Set([...stats.rushing.map((line) => line.schoolSlug), ...stats.passing.map((line) => line.schoolSlug), ...stats.receiving.map((line) => line.schoolSlug)]);

  for (const schoolSlug of schoolSlugs) {
    for (const profile of getSchoolPlayerProfiles(schoolSlug, stats.season)) profileLookup.set(`${schoolSlug}:${profile.name.trim().toLowerCase()}`, profile.playerId);
  }

  function resolveLine<T extends { player: string; schoolSlug: string; playerId?: string }>(line: T): T {
    if (line.playerId) return line;
    const rosterId = profileLookup.get(`${line.schoolSlug}:${line.player.trim().toLowerCase()}`);
    if (rosterId) { notices.push(`Matched ${line.player} to roster playerId ${rosterId}.`); return { ...line, playerId: rosterId }; }
    const fallbackId = getPlayerId(line.schoolSlug, line.player, stats.season);
    notices.push(`No roster match for ${line.player}; using temporary derived playerId ${fallbackId}.`);
    return { ...line, playerId: fallbackId };
  }

  return { stats: { ...stats, rushing: stats.rushing.map(resolveLine), passing: stats.passing.map(resolveLine), receiving: stats.receiving.map(resolveLine) }, notices };
}

export function formatGameStatsForDataFile(stats: GameStats) { return JSON.stringify(stats, null, 2); }
