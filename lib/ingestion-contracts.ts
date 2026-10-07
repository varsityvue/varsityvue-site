import type { GameStats } from "@/data/game-stats";
import { isPlainRecord, validateGameStatsShape } from "@/lib/game-stats-shape";
import { array, enumeration, integer, literal, object, parse, rule, season, slug, text, union, type Infer, type Schema } from "@/lib/ingestion-schema";

export const DRAFT_SCHEMA_VERSION = 1 as const;
export const confidenceSchema = enumeration(["HIGH", "MEDIUM", "LOW", "UNRESOLVED"]);
export function field<S extends Schema<unknown>>(value: S) {
  return union(object({ state: literal("known"), value }), object({ state: enumeration(["unknown", "omitted", "unavailable"]) }));
}
export type Field<T> = { state: "known"; value: T } | { state: "unknown" | "omitted" | "unavailable" };
const sourceSchema = object({ sourceId: text, kind: enumeration(["form", "json", "csv", "text", "image", "document"]), locator: field(text) });
const evidenceSchema = object({ path: text, sourceIds: array(text), confidence: confidenceSchema });
const issueSchema = object({ code: text, path: text, severity: enumeration(["error", "conflict", "limitation", "notice"]), message: text });
const candidateSchema = object({ id: text, label: text, reason: text });
export const matchSchema = union(
  object({ state: enumeration(["unresolved", "ambiguous"]), candidates: array(candidateSchema) }),
  object({ state: literal("confirmed"), id: text, confirmedBy: text }),
);
export type CanonicalMatch = Infer<typeof matchSchema>;
const targetSchema = object({ match: matchSchema, expectedRevision: field(text) });
const base = {
  schemaVersion: literal(DRAFT_SCHEMA_VERSION), draftId: text,
  operation: enumeration(["create", "update"]), schoolSlug: slug, season,
  target: targetSchema, sources: array(sourceSchema), evidence: array(evidenceSchema),
  identityMatches: array(object({ path: text, match: matchSchema })),
  availability: array(object({ path: text, state: enumeration(["unknown", "omitted", "unavailable"]) })),
  issues: array(issueSchema), disposition: enumeration(["pending", "accepted", "rejected"]),
};
const isoDate = rule<string>("real YYYY-MM-DD date", v => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v);
const time = rule<string>("24-hour HH:mm time", v => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v));
export const scheduleRowSchema = object({
  rowId: text, game: matchSchema, week: field(integer), date: field(isoDate),
  kickoffTime: field(time), timeZone: field(text), opponent: matchSchema,
  site: field(enumeration(["home", "away", "neutral"])), location: field(text),
});
export const rosterRowSchema = object({
  rowId: text, name: text, player: matchSchema, jerseyNumber: field(rule<string>("jersey number 0–99", v => typeof v === "string" && /^\d{1,2}$/.test(v))),
  grade: field(enumeration(["Freshman", "Sophomore", "Junior", "Senior"])), positions: field(array(text)),
  height: field(text), weight: field(integer),
});
export type CoreStatsValues = Omit<GameStats, "sourceStatus" | "gameId"> & { gameId: string | null };
const coreStatsSchema: Schema<CoreStatsValues> = { check(v, p, e) {
  if (!isPlainRecord(v)) { e.push(`${p}: expected core statistics object.`); return false; }
  if (Object.hasOwn(v, "sourceStatus")) { e.push(`${p}.sourceStatus: verification belongs to canonical review, not draft values.`); return false; }
  const errors = validateGameStatsShape({ ...v, gameId: v.gameId === null ? "unresolved" : v.gameId, sourceStatus: "verified" });
  e.push(...errors.map(x => `${p}: ${x}`)); return errors.length === 0;
} };
const scheduleValues = object({ rows: array(scheduleRowSchema) });
const rosterValues = object({ rows: array(rosterRowSchema) });
const snapshots = union(
  object({ dataClass: literal("schedule"), current: scheduleValues, proposed: scheduleValues }),
  object({ dataClass: literal("roster"), current: rosterValues, proposed: rosterValues }),
  object({ dataClass: literal("game_stats"), current: coreStatsSchema, proposed: coreStatsSchema }),
);
export const draftSchema = union(
  object({ ...base, dataClass: literal("schedule"), values: scheduleValues }),
  object({ ...base, dataClass: literal("roster"), values: rosterValues }),
  object({ ...base, dataClass: literal("game_stats"), values: coreStatsSchema }),
  object({ ...base, operation: literal("correct"), dataClass: literal("correction"), target: object({ match: object({ state: literal("confirmed"), id: text, confirmedBy: text }), expectedRevision: object({ state: literal("known"), value: text }) }), reason: text, values: snapshots }),
);
export type IngestionDraft = Infer<typeof draftSchema>;
export type StatsDraft = Extract<IngestionDraft, { dataClass: "game_stats" }>;
export type CorrectionDraft = Extract<IngestionDraft, { dataClass: "correction" }>;

/** Every adapter enters here. Input issues/disposition are review data, never publication authority. */
export function normalizeIngestionDraft(input: unknown): { ok: true; draft: IngestionDraft } | { ok: false; errors: string[] } {
  const result = parse(draftSchema, input);
  if (!result.ok) return result;
  const draft = result.value;
  const errors: string[] = [];
  const ids = new Set(draft.sources.map(s => s.sourceId));
  if (ids.size !== draft.sources.length) errors.push("Duplicate sourceId.");
  for (const evidence of draft.evidence) for (const id of evidence.sourceIds) if (!ids.has(id)) errors.push(`Evidence ${evidence.path} references missing source ${id}.`);
  const inspectMatches = (value: unknown) => {
    if (!isPlainRecord(value)) { if (Array.isArray(value)) value.forEach(inspectMatches); return; }
    if ((value.state === "ambiguous" || value.state === "unresolved") && Array.isArray(value.candidates)) {
      const ids = value.candidates.map(c => (c as { id: string }).id);
      if (new Set(ids).size !== ids.length || (value.state === "ambiguous" && ids.length < 2)) errors.push("Match candidates must be unique; ambiguous matches require at least two candidates.");
    }
    Object.values(value).forEach(inspectMatches);
  };
  inspectMatches(draft);
  const identityPaths = new Set<string>();
  for (const entry of draft.identityMatches) {
    if (identityPaths.has(entry.path)) errors.push(`Duplicate identity match ${entry.path}.`);
    identityPaths.add(entry.path);
    const prefix = draft.dataClass === "correction" ? "proposed." : "";
    const path = entry.path.startsWith(prefix) ? entry.path.slice(prefix.length) : "";
    const values = draft.dataClass === "game_stats" ? draft.values : draft.dataClass === "correction" && draft.values.dataClass === "game_stats" ? draft.values.proposed : undefined;
    const parts = path.split(".");
    if (!values || !/^(rushing|passing|receiving)\.\d+$/.test(path) || !values[parts[0] as "rushing" | "passing" | "receiving"][Number(parts[1])]) errors.push(`Identity match ${entry.path} must reference an existing statistical player row.`);
  }
  const availabilityPaths = new Set<string>();
  for (const entry of draft.availability) {
    if (availabilityPaths.has(entry.path)) errors.push(`Duplicate availability path ${entry.path}.`);
    availabilityPaths.add(entry.path);
    const values = draft.dataClass === "game_stats" ? draft.values : draft.dataClass === "correction" && draft.values.dataClass === "game_stats" ? (entry.path.startsWith("current.") ? draft.values.current : entry.path.startsWith("proposed.") ? draft.values.proposed : undefined) : undefined;
    const path = draft.dataClass === "correction" ? entry.path.slice(entry.path.indexOf(".") + 1) : entry.path;
    const parts = path.split(".");
    // Availability is for absent optional scalar metrics. It cannot hide a supplied number.
    if (!values || !/^(teamStats|rushing|passing|receiving)\.\d+\.[a-zA-Z]+$/.test(path)) { errors.push(`Unsupported metric availability path ${entry.path}.`); continue; }
    const category = parts[0] as "teamStats" | "rushing" | "passing" | "receiving";
    const row = values[category][Number(parts[1])];
    const optional = category === "teamStats" ? ["firstDowns", "rushingAttempts", "rushingYards", "passingYards", "totalYards", "completions", "passAttempts", "interceptionsThrown", "punts", "puntAverage", "fumbles", "fumblesLost", "penalties", "penaltyYards"] : category === "passing" ? ["touchdowns", "interceptions"] : ["touchdowns"];
    if (!row || !optional.includes(parts[2]) || (row as unknown as Record<string, unknown>)[parts[2]] !== undefined) errors.push(`Availability ${entry.path} requires an absent optional metric on an existing row.`);
  }
  const checkRows = (rows: { rowId: string }[]) => { if (new Set(rows.map(r => r.rowId)).size !== rows.length) errors.push("Duplicate rowId."); };
  if (draft.dataClass === "schedule" || draft.dataClass === "roster") checkRows(draft.values.rows);
  if (draft.dataClass === "game_stats") {
    if (draft.values.season !== draft.season) errors.push("Statistics season differs from draft scope.");
    if (draft.target.match.state === "confirmed" && draft.values.gameId !== draft.target.match.id) errors.push("Statistics gameId differs from confirmed target.");
    const schools = [...draft.values.quarterScores, ...draft.values.teamStats, ...draft.values.rushing, ...draft.values.passing, ...draft.values.receiving, ...draft.values.scoringPlays, ...(draft.values.completeness ?? [])].map(r => r.schoolSlug);
    if (!schools.includes(draft.schoolSlug)) errors.push("Draft school is not represented in statistics.");
  }
  if (draft.operation === "update" && draft.target.expectedRevision.state !== "known") errors.push("Updates require an expected canonical revision.");
  if (draft.dataClass === "correction") {
    if (!draft.sources.length) errors.push("Corrections require source evidence.");
    if (draft.values.dataClass === "game_stats") {
      const { current, proposed } = draft.values;
      if (current.gameId !== draft.target.match.id || proposed.gameId !== current.gameId || current.season !== draft.season || proposed.season !== draft.season) errors.push("Correction cannot change canonical game identity or season.");
    } else {
      checkRows(draft.values.current.rows); checkRows(draft.values.proposed.rows);
      const before = draft.values.current.rows.map(r => r.rowId).sort().join("\n");
      const after = draft.values.proposed.rows.map(r => r.rowId).sort().join("\n");
      if (before !== after) errors.push("Correction cannot change snapshot row identities; use explicit create/update drafts.");
      for (const current of draft.values.current.rows) {
        const proposed = draft.values.proposed.rows.find(r => r.rowId === current.rowId);
        if (!proposed) continue;
        const a = "game" in current ? current.game : current.player;
        const b = "game" in proposed ? proposed.game : proposed.player;
        if (a.state === "confirmed" && (b.state !== "confirmed" || a.id !== b.id)) errors.push(`Correction cannot retarget canonical row ${current.rowId}.`);
      }
    }
  }
  // Detach mutable adapter objects so editing the original input cannot mutate this revision.
  return errors.length ? { ok: false, errors } : { ok: true, draft: JSON.parse(JSON.stringify(draft)) as IngestionDraft };
}
