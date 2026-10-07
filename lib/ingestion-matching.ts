import type { PlayerProfile } from "@/data/player-profiles";
import type { Game } from "@/types/platform";
import type { CanonicalMatch } from "@/lib/ingestion-contracts";
import { getPlayerId } from "@/lib/player-identity";

type Candidate = { id: string; label: string; reason: string };
function candidates(rows: Candidate[]): CanonicalMatch {
  const unique = [...new Map(rows.map(row => [row.id, row])).values()].sort((a, b) => a.id.localeCompare(b.id));
  return { state: unique.length > 1 ? "ambiguous" : "unresolved", candidates: unique };
}
/** Even a unique exact match remains a candidate until a human confirms it. */
export function matchSchool(query: string, schools: readonly { slug: string; name: string; aliases?: readonly string[] }[]): CanonicalMatch {
  const key = query.trim().toLowerCase();
  return candidates(schools.filter(s => [s.slug, s.name, ...(s.aliases ?? [])].some(n => n.trim().toLowerCase() === key)).map(s => ({ id: s.slug, label: s.name, reason: "Exact supplied school name/slug/alias" })));
}
export function matchGame(query: { season: number; schoolSlugs: readonly string[]; gameId?: string; week?: number; date?: string }, games: readonly Game[]): CanonicalMatch {
  return candidates(games.filter(g => g.season === query.season && g.gameType !== "bye" &&
    (query.week === undefined || g.week === query.week) && (query.date === undefined || g.date === query.date) &&
    query.schoolSlugs.every(s => [g.homeSchoolSlug, g.awaySchoolSlug].includes(s)) &&
    (query.schoolSlugs.length > 0 || query.gameId === g.id))
    .map(g => ({ id: g.id, label: `${g.awayTeam ?? g.awaySchoolSlug} at ${g.homeTeam ?? g.homeSchoolSlug}`, reason: query.gameId === g.id ? "Existing game ID and scope agree; confirmation required" : "Season and supplied matchup fields agree" })));
}
export function confirmCanonicalMatch(match: CanonicalMatch, id: string, confirmedBy: string): CanonicalMatch {
  if (match.state === "confirmed" || !confirmedBy.trim() || !match.candidates.some(c => c.id === id)) throw new Error("Confirmation requires an offered canonical candidate and reviewer.");
  return { state: "confirmed", id, confirmedBy: confirmedBy.trim() };
}

/** Managed UUID is an internal reference, not a public route identifier. */
export type ManagedPlayerIdentity = { internalId: string; schoolSlug: string; season: number; name: string; publicPlayerId?: string; active: boolean };
export type PlayerIdentityReference = {
  kind: "static" | "managed" | "temporary";
  schoolSlug: string; season: number; name: string;
  publicPlayerId?: string; managedRecordId?: string;
};
export type PlayerIdentityMatch = { match: CanonicalMatch; identities: PlayerIdentityReference[]; temporary?: PlayerIdentityReference };
export function matchPlayerIdentity(query: { schoolSlug: string; season: number; name: string }, profiles: readonly PlayerProfile[], managed: readonly ManagedPlayerIdentity[] = []): PlayerIdentityMatch {
  const exact = (row: { schoolSlug: string; season: number; name: string }) => row.schoolSlug === query.schoolSlug && row.season === query.season && row.name.trim().toLowerCase() === query.name.trim().toLowerCase();
  const identities: PlayerIdentityReference[] = profiles.filter(exact).map(p => ({ kind: "static", schoolSlug: p.schoolSlug, season: p.season, name: p.name, publicPlayerId: p.playerId }));
  for (const p of managed.filter(p => p.active && exact(p))) {
    // A verified explicit profile link bridges representations; names alone never do.
    const linked = p.publicPlayerId && identities.find(i => i.publicPlayerId === p.publicPlayerId);
    if (linked && !linked.managedRecordId) linked.managedRecordId = p.internalId;
    else identities.push({ kind: "managed", schoolSlug: p.schoolSlug, season: p.season, name: p.name, ...(p.publicPlayerId ? { publicPlayerId: p.publicPlayerId } : {}), managedRecordId: p.internalId });
  }
  const match = candidates(identities.map(i => ({ id: i.kind === "managed" ? `managed:${i.managedRecordId}` : `public:${i.publicPlayerId}`, label: i.name, reason: i.kind === "static" ? "Exact school/season/profile name" : "Exact school/season managed roster name" })));
  if (identities.length) return { match, identities };
  return { match, identities, temporary: { kind: "temporary", ...query, publicPlayerId: getPlayerId(query.schoolSlug, query.name, query.season) } };
}
