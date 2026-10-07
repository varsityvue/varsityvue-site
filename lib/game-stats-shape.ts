import { CORE_STAT_CATEGORIES, type GameStats } from "@/data/game-stats";

export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

/** Structural boundary only: canonical matching and sports reconciliation are separate. */
export function validateGameStatsShape(value: unknown): string[] {
  const errors: string[] = [];
  if (!isPlainRecord(value)) return ["The import must be a single game-stat object."];
  const text = (v: unknown, path: string, optional = false, slug = false) => {
    if (optional && v === undefined) return;
    if (typeof v !== "string" || !v.trim() || (slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v))) errors.push(`${path} must be ${slug ? "a school slug" : "non-empty text"}.`);
  };
  const number = (v: unknown, path: string, optional = false, signed = false, decimal = false) => {
    if (optional && v === undefined) return;
    if (typeof v !== "number" || !Number.isFinite(v) || (!decimal && !Number.isSafeInteger(v)) || (!signed && v < 0)) errors.push(`${path} must be a finite ${signed ? "" : "non-negative "}${decimal ? "number" : "safe integer"}.`);
  };
  const keys = (row: Record<string, unknown>, allowed: string[], path: string) => {
    for (const key of Object.keys(row)) if (!allowed.includes(key)) errors.push(`${path}.${key} is unsupported.`);
  };
  keys(value, ["gameId", "season", "sourceStatus", "sourceLabel", "completeness", "quarterScores", "scoringPlays", "teamStats", "rushing", "passing", "receiving"], "stats");
  text(value.gameId, "gameId"); text(value.sourceLabel, "sourceLabel");
  number(value.season, "season");
  if (typeof value.season === "number" && (value.season < 2000 || value.season > 9999)) errors.push("season must be a four-digit year from 2000.");
  if (value.sourceStatus !== "verified") errors.push('sourceStatus must be "verified" for the legacy export contract.');
  const rows = (field: string, allowed: string[], check: (row: Record<string, unknown>, path: string) => void, optional = false) => {
    const list = value[field];
    if (optional && list === undefined) return;
    if (!Array.isArray(list)) { errors.push(`${field} must be an array.`); return; }
    Array.from(list).forEach((row, i) => {
      const path = `${field}[${i}]`;
      if (!isPlainRecord(row)) { errors.push(`${path} must be an object.`); return; }
      keys(row, allowed, path); text(row.schoolSlug, `${path}.schoolSlug`, false, true); check(row, path);
    });
  };
  rows("quarterScores", ["schoolSlug", "quarters", "total"], (r, p) => {
    number(r.total, `${p}.total`);
    if (!Array.isArray(r.quarters)) errors.push(`${p}.quarters must be an array.`);
    else Array.from(r.quarters).forEach((v, i) => number(v, `${p}.quarters[${i}]`));
  });
  rows("scoringPlays", ["schoolSlug", "quarter", "clock", "description"], (r, p) => {
    if (![1, 2, 3, 4, "OT"].includes(r.quarter as number | string)) errors.push(`${p}.quarter must be 1, 2, 3, 4 or OT.`);
    text(r.description, `${p}.description`); text(r.clock, `${p}.clock`, true);
  });
  const team = ["firstDowns", "rushingAttempts", "rushingYards", "passingYards", "totalYards", "completions", "passAttempts", "interceptionsThrown", "punts", "puntAverage", "fumbles", "fumblesLost", "penalties", "penaltyYards"];
  rows("teamStats", ["schoolSlug", ...team], (r, p) => team.forEach(k => number(r[k], `${p}.${k}`, true, k.endsWith("Yards") && k !== "penaltyYards", k === "puntAverage")));
  for (const category of ["rushing", "passing", "receiving"] as const) {
    const required = category === "rushing" ? ["attempts", "yards"] : category === "passing" ? ["completions", "attempts", "yards"] : ["receptions", "yards"];
    const optional = category === "passing" ? ["touchdowns", "interceptions"] : ["touchdowns"];
    rows(category, ["schoolSlug", "player", "playerId", ...required, ...optional], (r, p) => {
      text(r.player, `${p}.player`); text(r.playerId, `${p}.playerId`, true);
      required.forEach(k => number(r[k], `${p}.${k}`, false, k === "yards"));
      optional.forEach(k => number(r[k], `${p}.${k}`, true));
    });
  }
  rows("completeness", ["schoolSlug", "categories"], (r, p) => {
    if (!isPlainRecord(r.categories)) { errors.push(`${p}.categories must be an object.`); return; }
    for (const [category, detail] of Object.entries(r.categories)) {
      if (!CORE_STAT_CATEGORIES.includes(category as typeof CORE_STAT_CATEGORIES[number])) errors.push(`${p}.categories.${category} is unsupported.`);
      if (!isPlainRecord(detail)) { errors.push(`${p}.categories.${category} must be an object.`); continue; }
      keys(detail, ["status", "note"], `${p}.categories.${category}`);
      if (typeof detail.status !== "string" || !["complete", "partial", "unavailable", "unknown"].includes(detail.status)) errors.push(`${p}.categories.${category}.status is invalid.`);
      text(detail.note, `${p}.categories.${category}.note`, true);
    }
  }, true);
  return errors;
}

export function parseGameStatsValue(value: unknown): { ok: true; stats: GameStats } | { ok: false; errors: string[] } {
  const errors = validateGameStatsShape(value);
  // The cast is guarded by exhaustive nested validation above, never a shallow shape check.
  return errors.length ? { ok: false, errors } : { ok: true, stats: value as GameStats };
}
