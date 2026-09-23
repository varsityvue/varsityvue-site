import { CORE_STAT_CATEGORIES, type CoreStatCategory, type GameStats } from "@/data/game-stats";
import type { ExtendedGameStats } from "@/data/extended-game-stats";
import type { PlayerProfile } from "@/data/player-profiles";
import { getCategoryCompleteness } from "@/data/stat-completeness";
import { normalizePlayerName } from "@/lib/player-identity";
import type { Game } from "@/types/platform";

export type StatReconciliationIssueKind =
  | "canonical"
  | "duplicate"
  | "reconciliation"
  | "partial"
  | "unavailable"
  | "unclassified"
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
    unclassifiedWarnings: number;
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
    const shared = tokens.find((token, index) => {
      const candidateIndex = candidateTokens.indexOf(token);
      return candidateIndex !== -1 && candidateIndex !== index;
    });
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

    const completenessSchools = new Set<string>();
    for (const entry of stats.completeness ?? []) {
      if (completenessSchools.has(entry.schoolSlug)) {
        add({ severity: "error", kind: "duplicate", gameId: stats.gameId, message: `${entry.schoolSlug} has duplicate completeness metadata.` });
      }
      completenessSchools.add(entry.schoolSlug);
      if (!gameParticipants.has(entry.schoolSlug)) {
        add({ severity: "error", kind: "canonical", gameId: stats.gameId, message: `${entry.schoolSlug} has completeness metadata but is not a canonical participant.` });
      }
      for (const [category, completeness] of Object.entries(entry.categories)) {
        if (!CORE_STAT_CATEGORIES.includes(category as CoreStatCategory)) {
          add({ severity: "error", kind: "provenance", gameId: stats.gameId, message: `${entry.schoolSlug} uses unsupported completeness category ${category}.` });
          continue;
        }
        if (!completeness || !["complete", "partial", "unavailable", "unknown"].includes(completeness.status)) {
          add({ severity: "error", kind: "provenance", gameId: stats.gameId, message: `${entry.schoolSlug} ${category} has an invalid completeness status.` });
        }
      }
    }

    for (const schoolSlug of gameParticipants) {
      const unknownCategories = CORE_STAT_CATEGORIES.filter(
        (category) => getCategoryCompleteness(stats, schoolSlug, category).status === "unknown"
      );
      if (unknownCategories.length > 0) {
        add({
          severity: "warning",
          kind: "unclassified",
          gameId: stats.gameId,
          message: `${schoolSlug} completeness remains unclassified for: ${unknownCategories.join(", ")}. No complete claim is inferred.`,
        });
      }
      for (const category of CORE_STAT_CATEGORIES) {
        const completeness = getCategoryCompleteness(stats, schoolSlug, category);
        if (completeness.status === "partial") {
          add({ severity: "warning", kind: "partial", gameId: stats.gameId, message: `${schoolSlug} ${category} is explicitly partial.${completeness.note ? ` ${completeness.note}` : ""}` });
        } else if (completeness.status === "unavailable") {
          add({ severity: "warning", kind: "unavailable", gameId: stats.gameId, message: `${schoolSlug} ${category} is unavailable.${completeness.note ? ` ${completeness.note}` : ""}` });
        }
      }
    }

    const quarterBySchool = new Map(stats.quarterScores.map((line) => [line.schoolSlug, line]));
    for (const schoolSlug of gameParticipants) {
      const line = quarterBySchool.get(schoolSlug);
      const completeness = getCategoryCompleteness(stats, schoolSlug, "quarterScoring");
      if (!line) {
        add({
          severity: completeness.status === "complete" ? "error" : "warning",
          kind: completeness.status === "complete" ? "reconciliation" : "unavailable",
          gameId: stats.gameId,
          message: `${schoolSlug} has no quarter-scoring record; missing scoring is not treated as zero${completeness.status === "complete" ? ", so the complete claim is false" : ""}.`,
        });
        continue;
      }

      const canonicalFinal = finalScoreForSchool(game, schoolSlug);
      if (canonicalFinal !== undefined && line.total !== canonicalFinal) {
        add({ severity: "error", kind: "reconciliation", gameId: stats.gameId, message: `${schoolSlug} stat final ${line.total} contradicts canonical final ${canonicalFinal}.` });
      }

      if (line.quarters.length === 0) {
        if (completeness.status === "complete") {
          add({ severity: "error", kind: "reconciliation", gameId: stats.gameId, message: `${schoolSlug} quarter scoring claims complete, but quarter splits are unavailable.` });
        }
      } else if (line.quarters.length < 4) {
        if (completeness.status === "complete") {
          add({ severity: "error", kind: "reconciliation", gameId: stats.gameId, message: `${schoolSlug} quarter scoring claims complete, but only ${line.quarters.length} quarter splits are stored.` });
        } else if (completeness.status !== "partial") {
          add({ severity: "warning", kind: "partial", gameId: stats.gameId, message: `${schoolSlug} has ${line.quarters.length} quarter splits; the incomplete array is not padded with zeroes.` });
        }
      } else {
        const quarterTotal = line.quarters.reduce((total, value) => total + value, 0);
        if (quarterTotal !== line.total) {
          add({ severity: "error", kind: "reconciliation", gameId: stats.gameId, message: `${schoolSlug} complete quarter splits sum to ${quarterTotal}, but the stat final is ${line.total}.` });
        }
      }
    }

    for (const schoolSlug of gameParticipants) {
      const scoringCompleteness = getCategoryCompleteness(stats, schoolSlug, "scoringPlays");
      const scoringPlays = stats.scoringPlays.filter((play) => play.schoolSlug === schoolSlug);
      const canonicalFinal = finalScoreForSchool(game, schoolSlug);
      if (scoringCompleteness.status === "complete" && (canonicalFinal ?? 0) > 0 && scoringPlays.length === 0) {
        add({ severity: "error", kind: "reconciliation", gameId: stats.gameId, message: `${schoolSlug} scoring plays claim complete, but no scoring plays are stored for a nonzero final.` });
      }
      if (scoringCompleteness.status === "unavailable" && scoringPlays.length > 0) {
        add({ severity: "error", kind: "reconciliation", gameId: stats.gameId, message: `${schoolSlug} scoring plays are marked unavailable, but ${scoringPlays.length} scoring plays are stored.` });
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
      const teamCompleteness = getCategoryCompleteness(stats, schoolSlug, "teamStats");

      if (!team) {
        if (teamCompleteness.status === "complete") {
          add({ severity: "error", kind: "reconciliation", gameId: stats.gameId, message: `${schoolSlug} team statistics claim complete, but no team-stat line is stored.` });
        } else if (teamCompleteness.status === "unknown") {
          add({ severity: "warning", kind: "unavailable", gameId: stats.gameId, message: `${schoolSlug} team totals are unavailable; player attribution cannot be reconciled.` });
        }
      } else if (teamCompleteness.status === "unavailable") {
        add({ severity: "error", kind: "reconciliation", gameId: stats.gameId, message: `${schoolSlug} team statistics are marked unavailable, but a team-stat line is stored.` });
      }

      const rushingExpected = team?.rushingAttempts !== undefined && team.rushingYards !== undefined
        ? { attempts: team.rushingAttempts, yards: team.rushingYards }
        : undefined;
      const rushingCompleteness = getCategoryCompleteness(stats, schoolSlug, "rushing");
      if (rushingCompleteness.status === "unavailable" && rushing.length > 0) {
        add({ severity: "error", kind: "reconciliation", gameId: stats.gameId, message: `${schoolSlug} rushing is marked unavailable, but ${rushing.length} player lines are stored.` });
      }
      if (rushingExpected) {
        const rushingActual = sumBy(rushing, { attempts: (line) => line.attempts, yards: (line) => line.yards });
        if (!sameTotals(rushingExpected, rushingActual) && rushingCompleteness.status !== "partial") add({ severity: rushingCompleteness.status === "complete" ? "error" : "warning", kind: rushingCompleteness.status === "complete" ? "reconciliation" : "partial", gameId: stats.gameId, message: `${schoolSlug} rushing attribution is incomplete or inconsistent (team ${formatTotals(rushingExpected)}; players ${formatTotals(rushingActual)})${rushingCompleteness.status === "complete" ? "; this contradicts the complete claim" : ""}.` });
      } else if (rushing.length > 0 && rushingCompleteness.status !== "partial") {
        add({ severity: "warning", kind: "unavailable", gameId: stats.gameId, message: `${schoolSlug} has player rushing lines without comparable team rushing totals.` });
      }

      const passingExpected = team?.completions !== undefined && team.passAttempts !== undefined && team.passingYards !== undefined && team.interceptionsThrown !== undefined
        ? { completions: team.completions, attempts: team.passAttempts, yards: team.passingYards, interceptions: team.interceptionsThrown }
        : undefined;
      const passingActual = sumBy(passing, { completions: (line) => line.completions, attempts: (line) => line.attempts, yards: (line) => line.yards, interceptions: (line) => line.interceptions ?? 0 });
      const passingComplete = Boolean(passingExpected && sameTotals(passingExpected, passingActual));
      const passingCompleteness = getCategoryCompleteness(stats, schoolSlug, "passing");
      if (passingCompleteness.status === "unavailable" && passing.length > 0) add({ severity: "error", kind: "reconciliation", gameId: stats.gameId, message: `${schoolSlug} passing is marked unavailable, but ${passing.length} player lines are stored.` });
      if (passingExpected && !passingComplete && passingCompleteness.status !== "partial") add({ severity: passingCompleteness.status === "complete" ? "error" : "warning", kind: passingCompleteness.status === "complete" ? "reconciliation" : "partial", gameId: stats.gameId, message: `${schoolSlug} passing attribution is incomplete or inconsistent (team ${formatTotals(passingExpected)}; players ${formatTotals(passingActual)})${passingCompleteness.status === "complete" ? "; this contradicts the complete claim" : ""}.` });
      if (!passingExpected && passing.length > 0 && passingCompleteness.status !== "partial") add({ severity: "warning", kind: "unavailable", gameId: stats.gameId, message: `${schoolSlug} has player passing lines without comparable team passing totals.` });

      const receivingExpected = team?.completions !== undefined && team.passingYards !== undefined
        ? { receptions: team.completions, yards: team.passingYards }
        : undefined;
      const receivingActual = sumBy(receiving, { receptions: (line) => line.receptions, yards: (line) => line.yards });
      const receivingComplete = Boolean(receivingExpected && sameTotals(receivingExpected, receivingActual));
      const receivingCompleteness = getCategoryCompleteness(stats, schoolSlug, "receiving");
      if (receivingCompleteness.status === "unavailable" && receiving.length > 0) add({ severity: "error", kind: "reconciliation", gameId: stats.gameId, message: `${schoolSlug} receiving is marked unavailable, but ${receiving.length} player lines are stored.` });
      if (receivingExpected && !receivingComplete && receivingCompleteness.status !== "partial") add({ severity: receivingCompleteness.status === "complete" ? "error" : "warning", kind: receivingCompleteness.status === "complete" ? "reconciliation" : "partial", gameId: stats.gameId, message: `${schoolSlug} receiving attribution is incomplete or inconsistent (team ${formatTotals(receivingExpected)}; players ${formatTotals(receivingActual)})${receivingCompleteness.status === "complete" ? "; this contradicts the complete claim" : ""}.` });
      if (!receivingExpected && receiving.length > 0 && receivingCompleteness.status !== "partial") add({ severity: "warning", kind: "unavailable", gameId: stats.gameId, message: `${schoolSlug} has player receiving lines without comparable team passing totals.` });

      if (passingComplete && receivingComplete) {
        const hasPassingTouchdowns = passing.every((line) => line.touchdowns !== undefined);
        const hasReceivingTouchdowns = receiving.every((line) => line.touchdowns !== undefined);
        if (hasPassingTouchdowns && hasReceivingTouchdowns) {
          const passingTouchdowns = passing.reduce((total, line) => total + line.touchdowns!, 0);
          const receivingTouchdowns = receiving.reduce((total, line) => total + line.touchdowns!, 0);
          if (passingTouchdowns !== receivingTouchdowns) add({ severity: "error", kind: "reconciliation", gameId: stats.gameId, message: `${schoolSlug} complete passing/receiving attribution disagrees on touchdowns (${passingTouchdowns} passing; ${receivingTouchdowns} receiving).` });
        } else if (passingCompleteness.status === "complete" || receivingCompleteness.status === "complete") {
          add({ severity: "error", kind: "reconciliation", gameId: stats.gameId, message: `${schoolSlug} passing or receiving claims complete, but at least one attributed line omits touchdown data.` });
        } else if (passingCompleteness.status !== "partial" && receivingCompleteness.status !== "partial") {
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
      const unclassifiedSchools = Array.from(gameParticipants).filter((schoolSlug) => !table.completeness?.[schoolSlug]);
      if (unclassifiedSchools.length > 0) {
        add({ severity: "warning", kind: "unclassified", gameId: extended.gameId, message: `${table.title} extended-table completeness remains unclassified for: ${unclassifiedSchools.join(", ")}.` });
      }
      for (const [schoolSlug, completeness] of Object.entries(table.completeness ?? {})) {
        if (!gameParticipants.has(schoolSlug)) add({ severity: "error", kind: "canonical", gameId: extended.gameId, message: `${table.title} has completeness metadata for nonparticipant ${schoolSlug}.` });
        if (!["complete", "partial", "unavailable", "unknown"].includes(completeness.status)) add({ severity: "error", kind: "provenance", gameId: extended.gameId, message: `${table.title} ${schoolSlug} has an invalid completeness status.` });
        if (completeness.status === "partial") add({ severity: "warning", kind: "partial", gameId: extended.gameId, message: `${table.title} for ${schoolSlug} is explicitly partial.${completeness.note ? ` ${completeness.note}` : ""}` });
        if (completeness.status === "unavailable") {
          add({ severity: "warning", kind: "unavailable", gameId: extended.gameId, message: `${table.title} for ${schoolSlug} is unavailable.${completeness.note ? ` ${completeness.note}` : ""}` });
          if (table.rows.some((row) => row.schoolSlug === schoolSlug)) add({ severity: "error", kind: "reconciliation", gameId: extended.gameId, message: `${table.title} for ${schoolSlug} is marked unavailable but contains player rows.` });
        }
      }
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
      unclassifiedWarnings: warnings.filter((issue) => issue.kind === "unclassified").length,
      identityWarnings: warnings.filter((issue) => issue.kind === "identity").length,
      coreExtendedContradictions: errors.filter((issue) => issue.kind === "contradiction").length,
      provenanceFailures: errors.filter((issue) => issue.kind === "provenance").length,
    },
  };
}
