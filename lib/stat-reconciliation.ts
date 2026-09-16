import type { GameStats } from "@/data/game-stats";
import type { ExtendedGameStats } from "@/data/extended-game-stats";
import type { PlayerProfile } from "@/data/player-profiles";
import { normalizePlayerName } from "@/lib/player-identity";
import type { Game } from "@/types/platform";

export type StatReconciliationIssueKind =
  | "canonical"
  | "duplicate"
  | "reconciliation"
  | "partial"
  | "unavailable"
  | "identity"
  | "contradiction"
  | "provenance";

export type StatReconciliationIssue = {
  severity: "error" | "warning";
  kind: StatReconciliationIssueKind;
  gameId?: string;
  message: string;
};

export type StatReconciliationReport = {
  coreRecordsChecked: number;
  extendedRecordsChecked: number;
  issues: StatReconciliationIssue[];
  errors: StatReconciliationIssue[];
  warnings: StatReconciliationIssue[];
  counts: {
    canonicalIdFailures: number;
    duplicateFailures: number;
    hardReconciliationFailures: number;
    partialWarnings: number;
    unavailableWarnings: number;
    identityWarnings: number;
    coreExtendedContradictions: number;
    provenanceFailures: number;
  };
};

type ReconciliationInput = {
  coreStats: GameStats[];
  extendedStats: ExtendedGameStats[];
  canonicalGames: Game[];
  playerProfiles: PlayerProfile[];
};

type NumericTotals = Record<string, number>;

function sumBy<T>(lines: T[], fields: Record<string, (line: T) => number>) {
  return Object.fromEntries(
    Object.entries(fields).map(([key, read]) => [
      key,
      lines.reduce((total, line) => total + read(line), 0),
    ]),
  ) as NumericTotals;
}

function formatTotals(totals: NumericTotals) {
  return Object.entries(totals).map(([key, value]) => `${key}=${value}`).join(", ");
}

function sameTotals(expected: NumericTotals, actual: NumericTotals) {
  return Object.keys(expected).every((key) => expected[key] === actual[key]);
}

function participants(game: Game) {
  return [game.awaySchoolSlug, game.homeSchoolSlug].filter((slug): slug is string => Boolean(slug));
}

function finalScoreForSchool(game: Game, schoolSlug: string) {
  if (schoolSlug === game.awaySchoolSlug) return game.awayScore ?? game.score?.away;
  if (schoolSlug === game.homeSchoolSlug) return game.homeScore ?? game.score?.home;
  return undefined;
}

function editDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length];
}

function suspiciousIdentityCandidate(name: string, candidates: string[]) {
  const tokens = normalizePlayerName(name).split("-").filter(Boolean);
  if (tokens.length !== 2) return undefined;

  return candidates.find((candidate) => {
    const candidateTokens = normalizePlayerName(candidate).split("-").filter(Boolean);
    if (candidateTokens.length !== 2 || normalizePlayerName(candidate) === normalizePlayerName(name)) return false;
    const shared = tokens.find((token) => candidateTokens.includes(token));
    if (!shared) return false;
    const unmatched = tokens.find((token) => token !== shared);
    const candidateUnmatched = candidateTokens.find((token) => token !== shared);
    return Boolean(unmatched && candidateUnmatched && editDistance(unmatched, candidateUnmatched) <= 2);
  });
}

export function reconcileStatCatalogs({ coreStats, extendedStats, canonicalGames, playerProfiles }: ReconciliationInput): StatReconciliationReport {
  const issues: StatReconciliationIssue[] = [];
  const add = (issue: StatReconciliationIssue) => issues.push(issue);
  const gamesById = new Map(canonicalGames.map((game) => [game.id, game]));
  const coreById = new Map<string, GameStats>();
  const coreIdCounts = new Map<string, number>();
  const extendedIdCounts = new Map<string, number>();
  const profilesBySchool = new Map<string, Map<string, PlayerProfile>>();

  for (const profile of playerProfiles) {
    const schoolProfiles = profilesBySchool.get(profile.schoolSlug) ?? new Map<string, PlayerProfile>();
    schoolProfiles.set(normalizePlayerName(profile.name), profile);
    profilesBySchool.set(profile.schoolSlug, schoolProfiles);
  }

  add({
    severity: "warning",
    kind: "unavailable",
    message: "Core GameStats records do not yet declare category-level attribution completeness; player/team mismatches are reported as partial warnings rather than blocking failures.",
  });
  add({
    severity: "warning",
    kind: "unavailable",
    message: "TeamStatLine does not store passing or rushing touchdown totals; team/category touchdown reconciliation is deferred except when complete receiving and passing attribution can be compared directly.",
  });

  for (const stats of coreStats) {
    coreIdCounts.set(stats.gameId, (coreIdCounts.get(stats.gameId) ?? 0) + 1);
    if (!coreById.has(stats.gameId)) coreById.set(stats.gameId, stats);
  }

  for (const [gameId, count] of coreIdCounts) {
    if (count > 1) add({ severity: "error", kind: "duplicate", gameId, message: `${count} core records use the same canonical game ID.` });
  }

  for (const stats of coreStats) {
    const game = gamesById.get(stats.gameId);
    if (!game) {
      add({ severity: "error", kind: "canonical", gameId: stats.gameId, message: "Core stat record does not resolve to a canonical game ID." });
      continue;
    }

    if (stats.sourceStatus !== "verified" || !stats.sourceLabel.trim()) {
      add({ severity: "error", kind: "provenance", gameId: stats.gameId, message: "Core stat record must retain verified status and a non-empty source label." });
    }

    const gameParticipants = new Set(participants(game));
    const representedSchools = new Set([
      ...stats.quarterScores.map((line) => line.schoolSlug),
      ...stats.teamStats.map((line) => line.schoolSlug),
      ...stats.rushing.map((line) => line.schoolSlug),
      ...stats.passing.map((line) => line.schoolSlug),
      ...stats.receiving.map((line) => line.schoolSlug),
    ]);
    for (const schoolSlug of representedSchools) {
      if (!gameParticipants.has(schoolSlug)) {
        add({ severity: "error", kind: "canonical", gameId: stats.gameId, message: `${schoolSlug} appears in stats but is not a canonical participant.` });
      }
    }

    const quarterBySchool = new Map(stats.quarterScores.map((line) => [line.schoolSlug, line]));
    for (const schoolSlug of gameParticipants) {
      const line = quarterBySchool.get(schoolSlug);
      if (!line) {
        add({ severity: "warning", kind: "unavailable", gameId: stats.gameId, message: `${schoolSlug} has no quarter-scoring record; missing scoring is not treated as zero.` });
        continue;
      }

      const canonicalFinal = finalScoreForSchool(game, schoolSlug);
      if (canonicalFinal !== undefined && line.total !== canonicalFinal) {
        add({ severity: "error", kind: "reconciliation", gameId: stats.gameId, message: `${schoolSlug} stat final ${line.total} contradicts canonical final ${canonicalFinal}.` });
      }

      if (line.quarters.length === 0) {
        add({ severity: "warning", kind: "unavailable", gameId: stats.gameId, message: `${schoolSlug} quarter splits are unavailable; verified final ${line.total} is preserved.` });
      } else if (line.quarters.length < 4) {
        add({ severity: "warning", kind: "partial", gameId: stats.gameId, message: `${schoolSlug} has ${line.quarters.length} quarter splits; the incomplete array is not padded with zeroes.` });
      } else {
        const quarterTotal = line.quarters.reduce((total, value) => total + value, 0);
        if (quarterTotal !== line.total) {
          add({ severity: "error", kind: "reconciliation", gameId: stats.gameId, message: `${schoolSlug} complete quarter splits sum to ${quarterTotal}, but the stat final is ${line.total}.` });
        }
      }
    }

    const teamStatCounts = new Map<string, number>();
    for (const line of stats.teamStats) teamStatCounts.set(line.schoolSlug, (teamStatCounts.get(line.schoolSlug) ?? 0) + 1);
    for (const [schoolSlug, count] of teamStatCounts) {
      if (count > 1) add({ severity: "error", kind: "duplicate", gameId: stats.gameId, message: `${schoolSlug} has ${count} team-stat lines.` });
    }

    for (const [category, lines] of [["rushing", stats.rushing], ["passing", stats.passing], ["receiving", stats.receiving]] as const) {
      const seen = new Set<string>();
      for (const line of lines) {
        const identity = `${line.schoolSlug}:${line.playerId ?? normalizePlayerName(line.player)}`;
        if (seen.has(identity)) add({ severity: "error", kind: "duplicate", gameId: stats.gameId, message: `${category} contains duplicate ${line.schoolSlug} player line ${line.player}.` });
        seen.add(identity);

        const schoolProfiles = profilesBySchool.get(line.schoolSlug);
        const normalizedName = normalizePlayerName(line.player);
        if (schoolProfiles && !schoolProfiles.has(normalizedName)) {
          add({ severity: "warning", kind: "identity", gameId: stats.gameId, message: `${line.player} (${line.schoolSlug}) does not match a verified profile identity.` });
        }
        if (line.playerId) {
          const profile = playerProfiles.find((candidate) => candidate.playerId === line.playerId && candidate.season === stats.season);
          if (!profile || profile.schoolSlug !== line.schoolSlug || normalizePlayerName(profile.name) !== normalizedName) {
            add({ severity: "warning", kind: "identity", gameId: stats.gameId, message: `${line.player} uses playerId ${line.playerId}, which does not resolve consistently.` });
          }
        }
      }
    }

    for (const schoolSlug of gameParticipants) {
      const team = stats.teamStats.find((line) => line.schoolSlug === schoolSlug);
      const rushing = stats.rushing.filter((line) => line.schoolSlug === schoolSlug);
      const passing = stats.passing.filter((line) => line.schoolSlug === schoolSlug);
      const receiving = stats.receiving.filter((line) => line.schoolSlug === schoolSlug);

      if (!team) {
        add({ severity: "warning", kind: "unavailable", gameId: stats.gameId, message: `${schoolSlug} team totals are unavailable; player attribution cannot be reconciled.` });
        continue;
      }

      const rushingExpected = team.rushingAttempts !== undefined && team.rushingYards !== undefined
        ? { attempts: team.rushingAttempts, yards: team.rushingYards }
        : undefined;
      if (rushingExpected) {
        const rushingActual = sumBy(rushing, { attempts: (line) => line.attempts, yards: (line) => line.yards });
        if (!sameTotals(rushingExpected, rushingActual)) add({ severity: "warning", kind: "partial", gameId: stats.gameId, message: `${schoolSlug} rushing attribution is incomplete or inconsistent (team ${formatTotals(rushingExpected)}; players ${formatTotals(rushingActual)}).` });
      } else if (rushing.length > 0) {
        add({ severity: "warning", kind: "unavailable", gameId: stats.gameId, message: `${schoolSlug} has player rushing lines without comparable team rushing totals.` });
      }

      const passingExpected = team.completions !== undefined && team.passAttempts !== undefined && team.passingYards !== undefined && team.interceptionsThrown !== undefined
        ? { completions: team.completions, attempts: team.passAttempts, yards: team.passingYards, interceptions: team.interceptionsThrown }
        : undefined;
      const passingActual = sumBy(passing, { completions: (line) => line.completions, attempts: (line) => line.attempts, yards: (line) => line.yards, interceptions: (line) => line.interceptions });
      const passingComplete = Boolean(passingExpected && sameTotals(passingExpected, passingActual));
      if (passingExpected && !passingComplete) add({ severity: "warning", kind: "partial", gameId: stats.gameId, message: `${schoolSlug} passing attribution is incomplete or inconsistent (team ${formatTotals(passingExpected)}; players ${formatTotals(passingActual)}).` });
      if (!passingExpected && passing.length > 0) add({ severity: "warning", kind: "unavailable", gameId: stats.gameId, message: `${schoolSlug} has player passing lines without comparable team passing totals.` });

      const receivingExpected = team.completions !== undefined && team.passingYards !== undefined
        ? { receptions: team.completions, yards: team.passingYards }
        : undefined;
      const receivingActual = sumBy(receiving, { receptions: (line) => line.receptions, yards: (line) => line.yards });
      const receivingComplete = Boolean(receivingExpected && sameTotals(receivingExpected, receivingActual));
      if (receivingExpected && !receivingComplete) add({ severity: "warning", kind: "partial", gameId: stats.gameId, message: `${schoolSlug} receiving attribution is incomplete or inconsistent (team ${formatTotals(receivingExpected)}; players ${formatTotals(receivingActual)}).` });
      if (!receivingExpected && receiving.length > 0) add({ severity: "warning", kind: "unavailable", gameId: stats.gameId, message: `${schoolSlug} has player receiving lines without comparable team passing totals.` });

      if (passingComplete && receivingComplete) {
        const hasPassingTouchdowns = passing.every((line) => line.touchdowns !== undefined);
        const hasReceivingTouchdowns = receiving.every((line) => line.touchdowns !== undefined);
        if (hasPassingTouchdowns && hasReceivingTouchdowns) {
          const passingTouchdowns = passing.reduce((total, line) => total + line.touchdowns!, 0);
          const receivingTouchdowns = receiving.reduce((total, line) => total + line.touchdowns!, 0);
          if (passingTouchdowns !== receivingTouchdowns) add({ severity: "error", kind: "reconciliation", gameId: stats.gameId, message: `${schoolSlug} complete passing/receiving attribution disagrees on touchdowns (${passingTouchdowns} passing; ${receivingTouchdowns} receiving).` });
        } else {
          add({ severity: "warning", kind: "unavailable", gameId: stats.gameId, message: `${schoolSlug} passing/receiving touchdowns cannot be reconciled because at least one attributed line omits touchdown data; omitted values are not treated as zero.` });
        }
      }
    }
  }

  for (const stats of extendedStats) extendedIdCounts.set(stats.gameId, (extendedIdCounts.get(stats.gameId) ?? 0) + 1);
  for (const [gameId, count] of extendedIdCounts) {
    if (count > 1) add({ severity: "error", kind: "duplicate", gameId, message: `${count} extended records use the same canonical game ID.` });
  }

  for (const extended of extendedStats) {
    const game = gamesById.get(extended.gameId);
    if (!game) {
      add({ severity: "error", kind: "canonical", gameId: extended.gameId, message: "Extended stat record does not resolve to a canonical game ID." });
      continue;
    }
    if (!extended.sourceLabel.trim()) add({ severity: "error", kind: "provenance", gameId: extended.gameId, message: "Extended stat record has no source label." });

    const gameParticipants = new Set(participants(game));
    const core = coreById.get(extended.gameId);
    const coreNamesBySchool = new Map<string, string[]>();
    if (core) {
      for (const line of [...core.rushing, ...core.passing, ...core.receiving]) {
        const names = coreNamesBySchool.get(line.schoolSlug) ?? [];
        if (!names.includes(line.player)) names.push(line.player);
        coreNamesBySchool.set(line.schoolSlug, names);
      }
    }

    for (const table of extended.tables) {
      const seen = new Set<string>();
      for (const row of table.rows) {
        if (!gameParticipants.has(row.schoolSlug)) add({ severity: "error", kind: "canonical", gameId: extended.gameId, message: `${table.title} row for ${row.player} uses nonparticipant ${row.schoolSlug}.` });
        if (row.values.length !== table.headers.length - 1) add({ severity: "error", kind: "reconciliation", gameId: extended.gameId, message: `${table.title} row for ${row.player} has ${row.values.length} values for ${table.headers.length - 1} stat columns.` });
        const identity = `${row.schoolSlug}:${normalizePlayerName(row.player)}`;
        if (seen.has(identity)) add({ severity: "error", kind: "duplicate", gameId: extended.gameId, message: `${table.title} contains duplicate ${row.schoolSlug} player row ${row.player}.` });
        seen.add(identity);

        const candidate = suspiciousIdentityCandidate(row.player, coreNamesBySchool.get(row.schoolSlug) ?? []);
        if (candidate) add({ severity: "warning", kind: "identity", gameId: extended.gameId, message: `${row.player} in ${table.title} suspiciously resembles core identity ${candidate}; manual identity review required.` });
      }
    }

    if (!core) continue;
    const turnoverMetric = extended.teamMetrics.find((metric) => metric.label.trim().toLowerCase() === "turnovers");
    if (turnoverMetric) {
      for (const [side, schoolSlug] of [["away", game.awaySchoolSlug], ["home", game.homeSchoolSlug]] as const) {
        if (!schoolSlug) continue;
        const team = core.teamStats.find((line) => line.schoolSlug === schoolSlug);
        const extendedValue = turnoverMetric[side];
        if (!team || team.interceptionsThrown === undefined || team.fumblesLost === undefined || typeof extendedValue !== "number") continue;
        const coreValue = team.interceptionsThrown + team.fumblesLost;
        if (coreValue !== extendedValue) add({ severity: "error", kind: "contradiction", gameId: extended.gameId, message: `${schoolSlug} turnovers disagree: core=${coreValue} (INT thrown + fumbles lost), extended=${extendedValue}.` });
      }
    }
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  return {
    coreRecordsChecked: coreStats.length,
    extendedRecordsChecked: extendedStats.length,
    issues,
    errors,
    warnings,
    counts: {
      canonicalIdFailures: errors.filter((issue) => issue.kind === "canonical").length,
      duplicateFailures: errors.filter((issue) => issue.kind === "duplicate").length,
      hardReconciliationFailures: errors.filter((issue) => issue.kind === "reconciliation").length,
      partialWarnings: warnings.filter((issue) => issue.kind === "partial").length,
      unavailableWarnings: warnings.filter((issue) => issue.kind === "unavailable").length,
      identityWarnings: warnings.filter((issue) => issue.kind === "identity").length,
      coreExtendedContradictions: errors.filter((issue) => issue.kind === "contradiction").length,
      provenanceFailures: errors.filter((issue) => issue.kind === "provenance").length,
    },
  };
}
