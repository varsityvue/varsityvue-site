import type {
  GameStats,
  PassingStatLine,
  QuarterScore,
  ReceivingStatLine,
  RushingStatLine,
  ScoringPlay,
  TeamStatLine,
} from "@/data/game-stats";

export type GameStatsCsvResult =
  | { ok: true; stats: GameStats; notices: string[] }
  | { ok: false; errors: string[] };

type CsvRow = Record<string, string>;

const TEMPLATE_HEADERS = [
  "section",
  "gameId",
  "season",
  "sourceLabel",
  "schoolSlug",
  "player",
  "playerId",
  "quarter",
  "clock",
  "description",
  "quarters",
  "total",
  "firstDowns",
  "rushingAttempts",
  "rushingYards",
  "passingYards",
  "totalYards",
  "completions",
  "passAttempts",
  "interceptionsThrown",
  "punts",
  "puntAverage",
  "fumbles",
  "fumblesLost",
  "penalties",
  "penaltyYards",
  "attempts",
  "yards",
  "touchdowns",
  "interceptions",
  "receptions",
];

export function getGameStatsCsvTemplate() {
  const rows = [
    TEMPLATE_HEADERS,
    ["meta", "example-game-id", "2026", "Statistics provided by the coaching staff"],
    ["quarterScore", "", "", "", "home-school", "", "", "", "", "", "7|7|0|7", "21"],
    ["quarterScore", "", "", "", "away-school", "", "", "", "", "", "0|7|7|0", "14"],
    ["rushing", "", "", "", "home-school", "Player Name", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "15", "120", "2"],
  ];

  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

export function parseGameStatsCsv(input: string): GameStatsCsvResult {
  const table = parseCsv(input);
  if (!table.ok) return table;
  if (table.rows.length < 2) {
    return { ok: false, errors: ["CSV must contain a header row and at least one data row."] };
  }

  const headers = table.rows[0].map((header) => header.trim());
  if (!headers.includes("section")) {
    return { ok: false, errors: ['CSV must include a "section" column.'] };
  }

  const rows: CsvRow[] = table.rows.slice(1)
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]?.trim() ?? ""])));

  const errors: string[] = [];
  const notices: string[] = [];
  const metaRows = rows.filter((row) => normalizeSection(row.section) === "meta");
  const meta = metaRows[0];

  if (!meta) errors.push('CSV requires one row with section "meta".');
  if (metaRows.length > 1) notices.push("Multiple meta rows found; only the first one was used.");

  const gameId = meta?.gameId?.trim() ?? "";
  const season = parseRequiredInteger(meta?.season, "meta season", errors);
  const sourceLabel = meta?.sourceLabel?.trim() ?? "";

  if (!gameId) errors.push("meta gameId is required.");
  if (!sourceLabel) errors.push("meta sourceLabel is required.");

  const quarterScores: QuarterScore[] = [];
  const scoringPlays: ScoringPlay[] = [];
  const teamStats: TeamStatLine[] = [];
  const rushing: RushingStatLine[] = [];
  const passing: PassingStatLine[] = [];
  const receiving: ReceivingStatLine[] = [];

  rows.forEach((row, index) => {
    const lineNumber = index + 2;
    const section = normalizeSection(row.section);
    if (!section || section === "meta") return;

    if (section === "quarterscore") {
      const schoolSlug = requiredText(row.schoolSlug, `row ${lineNumber} schoolSlug`, errors);
      const quarters = parseQuarterList(row.quarters, `row ${lineNumber} quarters`, errors);
      const total = parseRequiredInteger(row.total, `row ${lineNumber} total`, errors);
      if (schoolSlug && quarters && total !== undefined) quarterScores.push({ schoolSlug, quarters, total });
      return;
    }

    if (section === "scoringplay") {
      const schoolSlug = requiredText(row.schoolSlug, `row ${lineNumber} schoolSlug`, errors);
      const description = requiredText(row.description, `row ${lineNumber} description`, errors);
      const quarter = parseQuarter(row.quarter, `row ${lineNumber} quarter`, errors);
      if (schoolSlug && description && quarter) {
        scoringPlays.push({ quarter, clock: row.clock || undefined, schoolSlug, description });
      }
      return;
    }

    if (section === "teamstats") {
      const schoolSlug = requiredText(row.schoolSlug, `row ${lineNumber} schoolSlug`, errors);
      if (!schoolSlug) return;
      teamStats.push({
        schoolSlug,
        firstDowns: optionalNumber(row.firstDowns, `row ${lineNumber} firstDowns`, errors),
        rushingAttempts: optionalNumber(row.rushingAttempts, `row ${lineNumber} rushingAttempts`, errors),
        rushingYards: optionalNumber(row.rushingYards, `row ${lineNumber} rushingYards`, errors),
        passingYards: optionalNumber(row.passingYards, `row ${lineNumber} passingYards`, errors),
        totalYards: optionalNumber(row.totalYards, `row ${lineNumber} totalYards`, errors),
        completions: optionalNumber(row.completions, `row ${lineNumber} completions`, errors),
        passAttempts: optionalNumber(row.passAttempts, `row ${lineNumber} passAttempts`, errors),
        interceptionsThrown: optionalNumber(row.interceptionsThrown, `row ${lineNumber} interceptionsThrown`, errors),
        punts: optionalNumber(row.punts, `row ${lineNumber} punts`, errors),
        puntAverage: optionalNumber(row.puntAverage, `row ${lineNumber} puntAverage`, errors),
        fumbles: optionalNumber(row.fumbles, `row ${lineNumber} fumbles`, errors),
        fumblesLost: optionalNumber(row.fumblesLost, `row ${lineNumber} fumblesLost`, errors),
        penalties: optionalNumber(row.penalties, `row ${lineNumber} penalties`, errors),
        penaltyYards: optionalNumber(row.penaltyYards, `row ${lineNumber} penaltyYards`, errors),
      });
      return;
    }

    if (section === "rushing") {
      const schoolSlug = requiredText(row.schoolSlug, `row ${lineNumber} schoolSlug`, errors);
      const player = requiredText(row.player, `row ${lineNumber} player`, errors);
      const attempts = parseRequiredInteger(row.attempts, `row ${lineNumber} attempts`, errors);
      const yards = parseRequiredInteger(row.yards, `row ${lineNumber} yards`, errors);
      const touchdowns = optionalNumber(row.touchdowns, `row ${lineNumber} touchdowns`, errors);
      if (schoolSlug && player && attempts !== undefined && yards !== undefined) {
        rushing.push({ player, playerId: row.playerId || undefined, schoolSlug, attempts, yards, touchdowns });
      }
      return;
    }

    if (section === "passing") {
      const schoolSlug = requiredText(row.schoolSlug, `row ${lineNumber} schoolSlug`, errors);
      const player = requiredText(row.player, `row ${lineNumber} player`, errors);
      const completions = parseRequiredInteger(row.completions, `row ${lineNumber} completions`, errors);
      const attempts = parseRequiredInteger(row.attempts, `row ${lineNumber} attempts`, errors);
      const yards = parseRequiredInteger(row.yards, `row ${lineNumber} yards`, errors);
      const interceptions = parseRequiredInteger(row.interceptions, `row ${lineNumber} interceptions`, errors);
      const touchdowns = optionalNumber(row.touchdowns, `row ${lineNumber} touchdowns`, errors);
      if (schoolSlug && player && completions !== undefined && attempts !== undefined && yards !== undefined && interceptions !== undefined) {
        passing.push({ player, playerId: row.playerId || undefined, schoolSlug, completions, attempts, yards, interceptions, touchdowns });
      }
      return;
    }

    if (section === "receiving") {
      const schoolSlug = requiredText(row.schoolSlug, `row ${lineNumber} schoolSlug`, errors);
      const player = requiredText(row.player, `row ${lineNumber} player`, errors);
      const receptions = parseRequiredInteger(row.receptions, `row ${lineNumber} receptions`, errors);
      const yards = parseRequiredInteger(row.yards, `row ${lineNumber} yards`, errors);
      const touchdowns = optionalNumber(row.touchdowns, `row ${lineNumber} touchdowns`, errors);
      if (schoolSlug && player && receptions !== undefined && yards !== undefined) {
        receiving.push({ player, playerId: row.playerId || undefined, schoolSlug, receptions, yards, touchdowns });
      }
      return;
    }

    errors.push(`row ${lineNumber} has unknown section "${row.section}".`);
  });

  if (errors.length || season === undefined) return { ok: false, errors };

  notices.push(`Imported ${rows.length} CSV data rows.`);
  return {
    ok: true,
    stats: {
      gameId,
      season,
      sourceStatus: "verified",
      sourceLabel,
      quarterScores,
      scoringPlays,
      teamStats,
      rushing,
      passing,
      receiving,
    },
    notices,
  };
}

function normalizeSection(value = "") {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function requiredText(value: string | undefined, label: string, errors: string[]) {
  const text = value?.trim();
  if (!text) errors.push(`${label} is required.`);
  return text;
}

function parseRequiredInteger(value: string | undefined, label: string, errors: string[]) {
  const parsed = Number(value);
  if (!value?.trim() || !Number.isInteger(parsed)) {
    errors.push(`${label} must be an integer.`);
    return undefined;
  }
  return parsed;
}

function optionalNumber(value: string | undefined, label: string, errors: string[]) {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    errors.push(`${label} must be a number.`);
    return undefined;
  }
  return parsed;
}

function parseQuarterList(value: string | undefined, label: string, errors: string[]) {
  if (!value?.trim()) {
    errors.push(`${label} is required and should look like 7|0|7|0.`);
    return undefined;
  }
  const values = value.split(/[|;]/).map((part) => Number(part.trim()));
  if (values.some((part) => !Number.isInteger(part) || part < 0)) {
    errors.push(`${label} must contain non-negative integer scores separated by |.`);
    return undefined;
  }
  return values;
}

function parseQuarter(value: string | undefined, label: string, errors: string[]): ScoringPlay["quarter"] | undefined {
  const normalized = value?.trim().toUpperCase();
  if (normalized === "OT") return "OT";
  const parsed = Number(normalized);
  if (parsed === 1 || parsed === 2 || parsed === 3 || parsed === 4) return parsed;
  errors.push(`${label} must be 1, 2, 3, 4, or OT.`);
  return undefined;
}

function escapeCsvCell(value: string) {
  if (!/[",\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function parseCsv(input: string): { ok: true; rows: string[][] } | { ok: false; errors: string[] } {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (quoted) return { ok: false, errors: ["CSV contains an unclosed quoted field."] };
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return { ok: true, rows };
}
