import assert from "node:assert/strict";
import test from "node:test";
import { gameStats, type GameStats } from "@/data/game-stats";
import { parseGameStatsDraft, formatGameStatsForDataFile, resolveKnownPlayerIds } from "@/lib/game-stats-import";
import { parseGameStatsCsv, getGameStatsCsvTemplate } from "@/lib/game-stats-csv";
import { normalizeIngestionDraft, type IngestionDraft, type StatsDraft, type CorrectionDraft } from "@/lib/ingestion-contracts";
import { normalizeLegacyStats } from "@/lib/ingestion-adapters";
import { matchGame, matchPlayerIdentity, matchSchool, confirmCanonicalMatch } from "@/lib/ingestion-matching";
import { bindReview, canonicalRevisionHash, correctionDifferences, draftReviewHash, isReviewCurrent } from "@/lib/ingestion-review-identity";
import { reviewStatsDraft } from "@/lib/ingestion-stats-review";
import { validateGameStats } from "@/lib/game-stats-validation";
import { reconcileStatCatalogs } from "@/lib/stat-reconciliation";
import { getPlayerId } from "@/lib/player-identity";
import { getSchoolRoster, getRosterPlayer } from "@/lib/rosters";
import type { PlayerProfile } from "@/data/player-profiles";
import type { Game } from "@/types/platform";

const missing = { state: "omitted" } as const;
const unresolved = { state: "unresolved", candidates: [] } as const;
const known = <T>(value: T) => ({ state: "known" as const, value });
function stats(): GameStats {
  return { gameId: "a-at-b-2026-week-1", season: 2026, sourceStatus: "verified", sourceLabel: "Retained coach sheet",
    quarterScores: [], scoringPlays: [], teamStats: [{ schoolSlug: "a", completions: 1, passAttempts: 2, passingYards: 10 }], rushing: [],
    passing: [{ schoolSlug: "a", player: "Alex Smith", completions: 1, attempts: 2, yards: 10 }],
    receiving: [{ schoolSlug: "a", player: "Taylor Jones", receptions: 1, yards: 10 }],
    completeness: [{ schoolSlug: "a", categories: { passing: { status: "partial", note: "Coach supplied a partial sheet" }, receiving: { status: "partial" }, rushing: { status: "unavailable" } } }] };
}
function draft(): StatsDraft {
  const { sourceStatus: _status, ...values } = stats(); void _status;
  return { schemaVersion: 1, draftId: "draft-1", dataClass: "game_stats", operation: "create", schoolSlug: "a", season: 2026,
    target: { match: { state: "confirmed", id: values.gameId!, confirmedBy: "reviewer" }, expectedRevision: missing },
    values, sources: [{ sourceId: "source-1", kind: "form", locator: missing }], evidence: [], identityMatches: [], availability: [], issues: [], disposition: "pending" };
}
const game: Game = { id: "a-at-b-2026-week-1", season: 2026, week: 1, gameType: "regular", status: "scheduled", awaySchoolSlug: "a", homeSchoolSlug: "b", districtGame: false };
const profile = (playerId: string, name = "Alex Smith"): PlayerProfile => ({ playerId, name, schoolSlug: "a", season: 2026, verificationStatus: "verified" });
const catalog = () => ({ coreStats: [] as GameStats[], extendedStats: [], canonicalGames: [game], playerProfiles: [profile("alex"), profile("taylor", "Taylor Jones")] });
function normalized(input: unknown): IngestionDraft { const r = normalizeIngestionDraft(input); assert.equal(r.ok, true, r.ok ? "" : r.errors.join("\n")); if (!r.ok) throw new Error("invalid fixture"); return r.draft; }
function correction(): CorrectionDraft {
  const d = draft(); return { ...d, dataClass: "correction", operation: "correct", reason: "Corrected coach sheet", target: { match: { state: "confirmed", id: game.id, confirmedBy: "reviewer" }, expectedRevision: known(canonicalRevisionHash(stats())) }, values: { dataClass: "game_stats", current: d.values, proposed: { ...d.values, passing: d.values.passing.map(r => ({ ...r, yards: 12 })) } } };
}

test("legacy static fixture round-trips without modifying its values", () => {
  const r = parseGameStatsDraft(formatGameStatsForDataFile(gameStats[0])); assert.equal(r.ok, true); if (r.ok) assert.deepEqual(r.stats, gameStats[0]);
  const resolved = resolveKnownPlayerIds(gameStats[0]); assert.ok(resolved.stats.rushing.every(r => r.playerId));
});
test("all legacy base fixtures satisfy nested structural contract", () => {
  for (const input of gameStats) { const r = parseGameStatsDraft(JSON.stringify(input)); assert.equal(r.ok, true, r.ok ? "" : `${input.gameId}: ${r.errors}`); }
});
for (const [name, mutate] of Object.entries<(s: Record<string, unknown>) => void>({
  team: s => { s.teamStats = [null]; }, rushing: s => { s.rushing = ["invalid"]; },
  passing: s => { s.passing = [{ schoolSlug: "a", player: {}, completions: 1, attempts: 2, yards: 10 }]; },
  receiving: s => { s.receiving = [{ schoolSlug: "a", player: "P", receptions: "1", yards: 2 }]; },
  quarters: s => { s.quarterScores = [{ schoolSlug: "a", quarters: [0, null], total: 0 }]; },
  scoring: s => { s.scoringPlays = [{ schoolSlug: "a", quarter: 5, description: [] }]; },
  school: s => { s.teamStats = [{ schoolSlug: ["a"] }]; },
  negativeCount: s => { s.rushing = [{ schoolSlug: "a", player: "P", attempts: -1, yards: -2 }]; },
  fraction: s => { s.passing = [{ schoolSlug: "a", player: "P", completions: 1.5, attempts: 2, yards: 10 }]; },
  unsafeInteger: s => { s.teamStats = [{ schoolSlug: "a", firstDowns: Number.MAX_SAFE_INTEGER + 1 }]; },
  optionalNull: s => { s.passing = [{ schoolSlug: "a", player: "P", completions: 1, attempts: 2, yards: 10, interceptions: null }]; },
  completeness: s => { s.completeness = [{ schoolSlug: "a", categories: { passing: { status: "partial", note: 3 } } }]; },
  unknownKey: s => { s.rushing = [{ schoolSlug: "a", player: "P", attempts: 1, yards: 2, invented: 1 }]; },
})) test(`malformed nested ${name} returns deterministic review errors`, () => {
  const s = stats() as unknown as Record<string, unknown>; mutate(s); const raw = JSON.stringify(s);
  const r = parseGameStatsDraft(raw); assert.equal(r.ok, false); assert.deepEqual(parseGameStatsDraft(raw), r); if (!r.ok) assert.ok(r.errors.length);
});
test("structured NaN/Infinity are rejected; signed yards remain valid", () => {
  const d = draft(); d.values.passing[0].yards = Infinity; assert.equal(normalizeIngestionDraft(d).ok, false);
  const s = stats(); s.passing[0].yards = -2; assert.equal(parseGameStatsDraft(JSON.stringify(s)).ok, true);
});
test("CSV template remains supported", () => assert.equal(parseGameStatsCsv(getGameStatsCsvTemplate()).ok, true));
const csv = "section,gameId,season,sourceLabel,schoolSlug,player,completions,attempts,yards,interceptions,touchdowns\nmeta,a-at-b-2026-week-1,2026,Coach\npassing,,,,a,Alex Smith,1,2,10,,";
test("optional CSV interceptions and touchdowns remain unknown/omitted", () => {
  const r = parseGameStatsCsv(csv); assert.equal(r.ok, true); if (r.ok) { assert.equal(r.stats.passing[0].interceptions, undefined); assert.equal(r.stats.passing[0].touchdowns, undefined); assert.ok(!JSON.stringify(r.stats).includes('"interceptions":0')); }
  const r0 = parseGameStatsCsv(csv.replace('10,,', '10,0,0')); assert.equal(r0.ok, true); if (r0.ok) assert.equal(r0.stats.passing[0].interceptions, 0);
});
test("CSV uses shared safe numeric shape boundary", () => assert.equal(parseGameStatsCsv(csv.replace('1,2,10,,', '1.5,2,10,,')).ok, false));
test("JSON and CSV converge through common draft boundary", () => {
  const { values: _values, schemaVersion: _version, dataClass: _class, ...context } = draft(); void _values; void _version; void _class;
  const a = normalizeLegacyStats("json", JSON.stringify(stats()), context), b = normalizeLegacyStats("csv", csv, context);
  assert.equal(a.ok, true); assert.equal(b.ok, true); if (a.ok && b.ok) { assert.deepEqual(a.draft.dataClass, b.draft.dataClass); assert.equal(a.draft.disposition, "pending"); assert.ok(!Object.hasOwn(a.draft.values, "sourceStatus")); }
});
test("zero, unknown, omitted and unavailable remain distinct", () => {
  const d = draft(); d.availability = [{ path: "passing.0.interceptions", state: "unknown" }, { path: "passing.0.touchdowns", state: "unavailable" }];
  assert.equal(normalizeIngestionDraft(d).ok, true); const hash = draftReviewHash(d);
  d.availability[0].state = "omitted"; assert.notEqual(draftReviewHash(d), hash);
  d.values.passing[0].interceptions = 0; assert.equal(normalizeIngestionDraft(d).ok, false);
  d.availability = []; assert.equal(normalizeIngestionDraft(d).ok, true);
  for (const state of ["complete", "partial", "unavailable", "unknown"] as const) { d.values.completeness![0].categories.passing = { status: state }; assert.equal(normalizeIngestionDraft(d).ok, true); }
});
test("strict schema version and malformed contracts are rejected", () => {
  const d = draft(); assert.equal(normalizeIngestionDraft({ ...d, schemaVersion: 2 }).ok, false);
  assert.equal(normalizeIngestionDraft({ ...d, publicationPermission: true }).ok, false);
  assert.equal(normalizeIngestionDraft({ ...d, sources: [{ sourceId: "s", kind: "image", locator: { state: "unknown", value: "invented" } }] }).ok, false);
});
test("schedule/roster forms normalize through the same contracts", () => {
  const d = draft(); const { values: _values, ...base } = d; void _values;
  const schedule = { ...base, dataClass: "schedule", values: { rows: [{ rowId: "r1", game: unresolved, opponent: unresolved, week: known(1), date: known("2026-10-09"), kickoffTime: known("19:30"), timeZone: known("America/Chicago"), site: known("away"), location: missing }] } };
  assert.equal(normalizeIngestionDraft(schedule).ok, true); schedule.values.rows[0].date.value = "2026-02-30"; assert.equal(normalizeIngestionDraft(schedule).ok, false);
  const roster = { ...base, dataClass: "roster", values: { rows: [{ rowId: "r1", name: "Alex Smith", player: unresolved, jerseyNumber: known("0"), grade: known("Junior"), positions: known(["QB"]), height: missing, weight: { state: "unknown" } }] } };
  assert.equal(normalizeIngestionDraft(roster).ok, true); roster.values.rows.push(roster.values.rows[0]); assert.equal(normalizeIngestionDraft(roster).ok, false);
});
test("ambiguous school/game match never selects a canonical record", () => {
  const schools = matchSchool("Central", [{ slug: "central-a", name: "Central" }, { slug: "central-b", name: "Central" }]); assert.equal(schools.state, "ambiguous");
  const match = matchGame({ season: 2026, schoolSlugs: ["a", "b"] }, [game, { ...game, id: "rematch", week: 2 }]); assert.equal(match.state, "ambiguous");
  assert.throws(() => confirmCanonicalMatch(match, "invented", "reviewer")); assert.equal(confirmCanonicalMatch(match, game.id, "reviewer").state, "confirmed");
  assert.deepEqual(matchGame({ season: 2025, schoolSlugs: ["a"] }, [game]), { state: "unresolved", candidates: [] });
});
test("same-name players never silently merge; unknown temporary identity is explicit", () => {
  const query = { schoolSlug: "a", season: 2026, name: "Alex Smith" };
  assert.equal(matchPlayerIdentity(query, [profile("one"), profile("two")]).match.state, "ambiguous");
  const temp = matchPlayerIdentity(query, []); assert.equal(temp.temporary?.kind, "temporary"); assert.equal(temp.temporary?.publicPlayerId, getPlayerId("a", query.name, 2026)); assert.deepEqual(matchPlayerIdentity(query, []), temp);
  const bridge = matchPlayerIdentity(query, [profile("one")], [{ ...query, internalId: "private-uuid", publicPlayerId: "one", active: true }]); assert.equal(bridge.identities.length, 1); assert.equal(bridge.identities[0].publicPlayerId, "one");
  assert.equal(matchPlayerIdentity(query, [profile("one")], [{ ...query, internalId: "private-uuid", active: true }]).match.state, "ambiguous");
});
test("roster and player public identity helpers remain compatible", () => {
  const roster = getSchoolRoster("de-leon", 2026); assert.ok(roster.length); assert.deepEqual(getRosterPlayer(roster[0].playerId, 2026), roster[0]);
  assert.equal(getPlayerId("a", " Alex Smith ", 2026), "a-alex-smith-2026");
});
test("hashes ignore source/object order, preserve scoring chronology and invalidate edits", () => {
  const d = draft(); d.sources.push({ sourceId: "source-2", kind: "image", locator: missing }); const h = draftReviewHash(d);
  d.sources.reverse(); assert.equal(draftReviewHash(d), h); d.values.passing[0].yards++; assert.notEqual(draftReviewHash(d), h);
  d.values.scoringPlays = [{ schoolSlug: "a", quarter: 1, description: "First" }, { schoolSlug: "a", quarter: 2, description: "Second" }]; const h2 = draftReviewHash(d); d.values.scoringPlays.reverse(); assert.notEqual(draftReviewHash(d), h2);
  assert.equal(canonicalRevisionHash({ a: 1, b: 2 }), canonicalRevisionHash({ b: 2, a: 1 }));
});
test("stale review detects both draft edits and canonical revision changes", () => {
  const d = draft(), current = stats(), binding = bindReview(d, current); assert.ok(isReviewCurrent(binding, d, current));
  d.disposition = "accepted"; assert.ok(isReviewCurrent(binding, d, current));
  current.passing[0].yards++; assert.equal(isReviewCurrent(binding, d, current), false);
  const d2 = draft(); d2.values.passing[0].interceptions = 0; assert.equal(isReviewCurrent(binding, d2, stats()), false);
});
test("corrections preserve immutable target, differences and reviewed revision", () => {
  const d = correction(); assert.equal(normalizeIngestionDraft(d).ok, true); assert.equal(correctionDifferences(d)[0].path, "passing");
  const hash = draftReviewHash(d); if (d.values.dataClass === "game_stats") d.values.proposed.passing[0].yards++; assert.notEqual(draftReviewHash(d), hash);
  if (d.values.dataClass === "game_stats") d.values.proposed.gameId = "other"; assert.equal(normalizeIngestionDraft(d).ok, false);
});
test("normalization detaches adapter-owned objects and checks source hooks", () => {
  const d = draft(), n = normalized(d); d.values.passing[0].yards = 999; assert.notDeepEqual(n, d);
  d.evidence = [{ path: "passing.0.yards", sourceIds: ["missing"], confidence: "LOW" }]; assert.equal(normalizeIngestionDraft(d).ok, false);
});
test("review boundary invokes real affected reconciliation without mutating catalogs", () => {
  const d = draft(), c = catalog(), snapshot = JSON.stringify(c); const r = reviewStatsDraft(d, c);
  assert.equal(r.report?.coreRecordsChecked, 1); assert.equal(JSON.stringify(c), snapshot); assert.ok(r.completenessLimitations.length); assert.ok(r.sourceInconsistencies.length);
  const direct = reconcileStatCatalogs({ ...c, coreStats: [{ ...d.values, gameId: game.id, sourceStatus: "verified" }] }); assert.deepEqual(r.report, direct);
});
test("existing target, missing confirmation and ambiguous identities block review", () => {
  const d = draft(), c = catalog(); c.coreStats = [stats()]; assert.ok(reviewStatsDraft(d, c).blocking.some(m => m.includes("already")));
  d.target.match = { state: "unresolved", candidates: [] }; assert.ok(reviewStatsDraft(d, catalog()).blocking.some(m => m.includes("confirmation")));
  c.coreStats = []; c.playerProfiles.push(profile("another")); assert.ok(reviewStatsDraft(d, c).blocking.some(m => m.includes("Ambiguous")));
});
test("correction replaces affected record once and rejects stale canonical snapshots", () => {
  const d = correction(), c = catalog(); c.coreStats = [stats()]; const r = reviewStatsDraft(d, c); assert.equal(r.report?.coreRecordsChecked, 1); assert.deepEqual(r.blocking, []);
  c.coreStats[0].passing[0].yards++; assert.ok(reviewStatsDraft(d, c).blocking.some(m => m.includes("stale")));
  c.coreStats = []; assert.ok(reviewStatsDraft(d, c).blocking.some(m => m.includes("exactly one")));
});
test("impossible completions block; complete reconciliation contradictions remain errors", () => {
  const d = draft(); d.values.passing[0].completions = 3; assert.ok(reviewStatsDraft(d, catalog()).blocking.length);
  d.values.passing[0].completions = 1; d.values.completeness![0].categories.receiving = { status: "complete" }; d.values.receiving[0].yards = 20;
  assert.ok(reviewStatsDraft(d, catalog()).reconciliationConflicts.some(i => i.kind === "reconciliation"));
  assert.ok(validateGameStats({ ...d.values, gameId: game.id, sourceStatus: "verified" }).every(i => i.level === "warning"));
});

test("sparse structured arrays are rejected before normalization", () => {
  const d = draft(); d.values.passing = new Array(1); assert.equal(normalizeIngestionDraft(d).ok, false);
  d.values.passing = stats().passing; d.evidence = new Array(1); assert.equal(normalizeIngestionDraft(d).ok, false);
});
test("unresolved game is representable without an invented canonical ID", () => {
  const d = draft(); d.values.gameId = null; d.target.match = { state: "unresolved", candidates: [] };
  assert.equal(normalizeIngestionDraft(d).ok, true); assert.equal(reviewStatsDraft(d, catalog()).reviewable, false);
});
test("duplicate managed records are ambiguous even with identical profile links", () => {
  const q = { schoolSlug: "a", season: 2026, name: "Alex Smith" };
  const r = matchPlayerIdentity(q, [profile("one")], ["uuid-1", "uuid-2"].map(internalId => ({ ...q, internalId, publicPlayerId: "one", active: true })));
  assert.equal(r.match.state, "ambiguous");
});

test("hash binds positional evidence to stable statistical row identity", () => {
  const d = draft(); d.values.passing.push({ ...d.values.passing[0], player: "Another Player", yards: 20 });
  d.evidence = [{ path: "passing.0.yards", sourceIds: ["source-1"], confidence: "HIGH" }];
  const h = draftReviewHash(d); d.values.passing.reverse(); assert.notEqual(draftReviewHash(d), h);
  d.evidence[0].path = "passing.1.yards"; assert.equal(draftReviewHash(d), h);
});

test("ambiguous player requires explicit scoped candidate confirmation", () => {
  const d = draft(), c = catalog(); c.playerProfiles.push(profile("another")); d.values.passing[0].playerId = "alex";
  assert.ok(reviewStatsDraft(d, c).blocking.some(m => m.includes("Ambiguous")));
  d.identityMatches = [{ path: "passing.0", match: { state: "confirmed", id: "public:alex", confirmedBy: "reviewer" } }];
  assert.ok(!reviewStatsDraft(d, c).blocking.some(m => m.includes("Ambiguous")));
  assert.ok(!reviewStatsDraft(d, c).reconciliationConflicts.some(i => i.kind === "identity"));
  d.identityMatches[0].match = { state: "confirmed", id: "public:invented", confirmedBy: "reviewer" };
  assert.ok(reviewStatsDraft(d, c).blocking.some(m => m.includes("confirmation")));
});
test("omitted interceptions never prove a complete passing total of zero", () => {
  const d = draft(); d.values.teamStats[0].interceptionsThrown = 0; d.values.completeness![0].categories.passing = { status: "complete" };
  assert.ok(reviewStatsDraft(d, catalog()).reconciliationConflicts.some(i => i.message.includes("interceptions remain unknown")));
});
test("isolated total-yardage warning is preserved alongside full reconciliation", () => {
  const d = draft(); d.values.teamStats[0].rushingYards = 10; d.values.teamStats[0].totalYards = 999;
  assert.ok(reviewStatsDraft(d, catalog()).notices.some(i => i.message.includes("total yards")));
});

test("correction snapshots preserve unavailable/unknown optional metric semantics", () => {
  const d = correction(); d.availability = [{ path: "current.passing.0.interceptions", state: "unknown" }, { path: "proposed.passing.0.interceptions", state: "unavailable" }];
  assert.equal(normalizeIngestionDraft(d).ok, true); const h = draftReviewHash(d); d.availability[1].state = "omitted"; assert.notEqual(draftReviewHash(d), h);
});
test("schedule and roster corrections cannot retarget a confirmed row", () => {
  const d = correction(); const row = { rowId: "r1", game: { state: "confirmed", id: game.id, confirmedBy: "reviewer" }, opponent: { state: "unresolved", candidates: [] }, week: known(1), date: known("2026-10-09"), kickoffTime: missing, timeZone: missing, site: missing, location: missing };
  const input = { ...d, values: { dataClass: "schedule", current: { rows: [row] }, proposed: { rows: [{ ...row, game: { ...row.game, id: "other" } }] } } };
  assert.equal(normalizeIngestionDraft(input).ok, false);
});
test("malformed nested optional metrics and school slug syntax are rejected", () => {
  const d = stats() as unknown as Record<string, unknown>;
  d.teamStats = [{ schoolSlug: "Wrong School", puntAverage: [1] }]; assert.equal(parseGameStatsDraft(JSON.stringify(d)).ok, false);
  d.teamStats = [{ schoolSlug: "a", punts: 1.1 }]; assert.equal(parseGameStatsDraft(JSON.stringify(d)).ok, false);
  d.teamStats = [{ schoolSlug: "a", puntAverage: 32.5 }]; assert.equal(parseGameStatsDraft(JSON.stringify(d)).ok, true);
});

test("hash boundary rejects values that JSON would silently collapse", () => {
  assert.throws(() => canonicalRevisionHash({ yards: Infinity }));
  assert.throws(() => canonicalRevisionHash({ players: new Array(1) }));
  assert.throws(() => canonicalRevisionHash({ date: new Date() }));
  const d = draft(), binding = bindReview(d, stats()); d.values.passing[0].yards = NaN; assert.equal(isReviewCurrent(binding, d, stats()), false);
  assert.notEqual(canonicalRevisionHash(undefined), canonicalRevisionHash(null));
});
