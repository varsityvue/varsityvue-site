import { type GameStats } from "@/data/game-stats";
import { parseGameStatsValue } from "@/lib/game-stats-shape";
import { matchPlayerIdentity } from "@/lib/ingestion-matching";
import { getSchoolPlayerProfiles } from "@/lib/player-profiles";

export type GameStatsImportResult =
  | { ok: true; stats: GameStats; notices: string[] }
  | { ok: false; errors: string[] };

export function parseGameStatsDraft(input: string): GameStatsImportResult {
  let parsed: unknown;
  try { parsed = JSON.parse(input); } catch { return { ok: false, errors: ["The pasted content is not valid JSON."] }; }
  const result = parseGameStatsValue(parsed);
  return result.ok ? { ...result, notices: [] } : result;
}

export function resolveKnownPlayerIds(stats: GameStats) {
  const notices: string[] = [];
  function resolveLine<T extends { player: string; schoolSlug: string; playerId?: string }>(line: T): T {
    if (line.playerId) return line;
    const identity = matchPlayerIdentity({ schoolSlug: line.schoolSlug, season: stats.season, name: line.player }, getSchoolPlayerProfiles(line.schoolSlug, stats.season));
    if (identity.match.state === "ambiguous") { notices.push(`Ambiguous roster identity for ${line.player}; manual resolution required.`); return line; }
    const rosterId = identity.identities[0]?.publicPlayerId;
    if (rosterId) { notices.push(`Matched ${line.player} to roster playerId ${rosterId}.`); return { ...line, playerId: rosterId }; }
    const fallbackId = identity.temporary!.publicPlayerId!;
    notices.push(`No roster match for ${line.player}; using temporary derived playerId ${fallbackId}.`);
    return { ...line, playerId: fallbackId };
  }

  return { stats: { ...stats, rushing: stats.rushing.map(resolveLine), passing: stats.passing.map(resolveLine), receiving: stats.receiving.map(resolveLine) }, notices };
}

export function formatGameStatsForDataFile(stats: GameStats) { return JSON.stringify(stats, null, 2); }
