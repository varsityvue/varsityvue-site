import type { GameStats } from "@/data/game-stats";
import type { ExtendedGameStats } from "@/data/extended-game-stats";
import type { PlayerProfile } from "@/data/player-profiles";
import type { Game } from "@/types/platform";
import { normalizeIngestionDraft, type StatsDraft, type CorrectionDraft } from "@/lib/ingestion-contracts";
import { validateGameStats } from "@/lib/game-stats-validation";
import { reconcileStatCatalogs, type StatReconciliationIssue } from "@/lib/stat-reconciliation";
import { canonicalRevisionHash } from "@/lib/ingestion-review-identity";
import { matchPlayerIdentity } from "@/lib/ingestion-matching";

export type EffectiveStatCatalog = { coreStats: GameStats[]; extendedStats: ExtendedGameStats[]; canonicalGames: Game[]; playerProfiles: PlayerProfile[] };
/** Pure preview of the affected effective game, never a canonical writer or approval. */
export function reviewStatsDraft(draft: StatsDraft | CorrectionDraft, catalog: EffectiveStatCatalog) {
  const blocking: string[] = [];
  const normalized = normalizeIngestionDraft(draft);
  const empty = { reconciliationConflicts: [] as StatReconciliationIssue[], completenessLimitations: [] as StatReconciliationIssue[], sourceInconsistencies: [] as StatReconciliationIssue[], notices: [] as StatReconciliationIssue[] };
  if (!normalized.ok) return { ...empty, blocking: normalized.errors, reviewable: false };
  const values = draft.dataClass === "game_stats" ? draft.values : draft.values.dataClass === "game_stats" ? draft.values.proposed : undefined;
  if (!values) return { ...empty, blocking: ["This boundary reviews core game statistics only."], reviewable: false };
  if (draft.target.match.state !== "confirmed") blocking.push("Explicit canonical game confirmation is required.");
  const existing = catalog.coreStats.filter(s => s.gameId === values.gameId);
  const correcting = draft.operation === "update" || draft.operation === "correct";
  if (!correcting && existing.length) blocking.push("Canonical game already has statistics; use a revision-bound correction/update.");
  if (correcting && existing.length !== 1) blocking.push("Correction/update requires exactly one effective current record.");
  if (correcting && existing.length === 1 && (draft.target.expectedRevision.state !== "known" || draft.target.expectedRevision.value !== canonicalRevisionHash(existing[0]))) blocking.push("Expected canonical revision is stale or missing.");
  if (draft.dataClass === "correction" && draft.values.dataClass === "game_stats" && existing.length === 1 && canonicalRevisionHash(draft.values.current) !== canonicalRevisionHash(withoutLegacyMarker(existing[0]))) blocking.push("Correction current snapshot differs from effective canonical values.");
  const games = catalog.canonicalGames.filter(g => g.id === values.gameId && g.season === values.season && g.gameType !== "bye");
  const game = games[0];
  if (games.length > 1) blocking.push("Canonical game identity resolves to multiple catalog records.");
  if (!game) blocking.push("Game ID does not resolve in the selected season.");
  if (game && ![game.homeSchoolSlug, game.awaySchoolSlug].includes(draft.schoolSlug)) blocking.push("Draft school is not a canonical participant.");
  const confirmedIdentityMessages = new Set<string>();
  for (const category of ["rushing", "passing", "receiving"] as const) for (const [index, row] of values[category].entries()) {
    const identity = matchPlayerIdentity({ schoolSlug: row.schoolSlug, season: values.season, name: row.player }, catalog.playerProfiles);
    const path = `${draft.dataClass === "correction" ? "proposed." : ""}${category}.${index}`;
    const confirmation = draft.identityMatches.find(m => m.path === path)?.match;
    const confirmed = confirmation?.state === "confirmed" && identity.match.state !== "confirmed" && identity.match.candidates.some(c => c.id === confirmation.id) && identity.identities.some(i => `public:${i.publicPlayerId}` === confirmation.id && i.publicPlayerId === row.playerId);
    if (confirmed) confirmedIdentityMessages.add(`${row.player} uses playerId ${row.playerId}, which does not resolve consistently.`);
    if (confirmation?.state === "confirmed" && !confirmed) blocking.push(`Player confirmation does not agree with scoped canonical identity: ${row.player}.`);
    if (identity.match.state === "ambiguous" && !confirmed) blocking.push(`Ambiguous player identity: ${row.player}. Explicit identity review required.`);
  }
  // Reconciliation's canonical legacy marker is an in-memory bridge, not verification/publication authority.
  if (values.gameId === null) return { ...empty, blocking: [...blocking, "Canonical game is unresolved."], reviewable: false };
  const stats: GameStats = { ...values, gameId: values.gameId, sourceStatus: "verified" };
  const domainIssues = validateGameStats(stats);
  blocking.push(...domainIssues.filter(i => i.level === "error").map(i => i.message));
  const affected = catalog.coreStats.filter(s => s.gameId === stats.gameId);
  const coreStats = correcting && affected.length === 1 ? [stats] : [...affected, stats];
  const report = reconcileStatCatalogs({ coreStats, extendedStats: catalog.extendedStats.filter(s => s.gameId === stats.gameId), canonicalGames: game ? [game] : [], playerProfiles: catalog.playerProfiles.filter(p => p.season === stats.season) });
  const optionalMetricIssues: StatReconciliationIssue[] = [];
  for (const school of new Set(stats.passing.map(r => r.schoolSlug))) {
    const missing = stats.passing.filter(r => r.schoolSlug === school && r.interceptions === undefined);
    if (!missing.length) continue;
    const complete = stats.completeness?.find(c => c.schoolSlug === school)?.categories.passing?.status === "complete";
    optionalMetricIssues.push({ severity: complete ? "error" : "warning", kind: complete ? "reconciliation" : "unavailable", gameId: stats.gameId, message: `${school} passing interceptions remain unknown for ${missing.length} supplied player line(s); legacy reconciliation's zero fallback is not evidence of a known total.${complete ? " Resolve the incomplete complete claim." : ""}` });
  }
  const reconciliationConflicts = [...report.issues, ...optionalMetricIssues].filter(i => i.severity === "error" || (i.kind === "identity" && !confirmedIdentityMessages.has(i.message)) || i.kind === "contradiction");
  const completenessLimitations = [...report.warnings, ...optionalMetricIssues.filter(i => i.severity === "warning")].filter(i => ["partial", "unavailable", "unclassified"].includes(i.kind));
  // Retain documented partial-source notes at their existing severity; never rewrite supplied totals.
  const sourceInconsistencies = report.warnings.filter(i => i.kind === "partial" && /explicitly partial/.test(i.message));
  const notices: StatReconciliationIssue[] = [...report.warnings.filter(i => !completenessLimitations.includes(i) && !reconciliationConflicts.includes(i)).map(i => confirmedIdentityMessages.has(i.message) ? { ...i, message: `${i.message} Scoped explicit confirmation resolves this legacy name-only lookup ambiguity.` } : i), ...domainIssues.filter(i => i.level === "warning").map(i => ({ severity: "warning" as const, kind: "reconciliation" as const, gameId: stats.gameId, message: i.message }))];
  return { blocking, reconciliationConflicts, completenessLimitations, sourceInconsistencies, notices,
    reviewable: !blocking.length && !reconciliationConflicts.length, report };
}

function withoutLegacyMarker({ sourceStatus: _marker, ...values }: GameStats) { void _marker; return values; }
