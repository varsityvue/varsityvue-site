import assert from "node:assert/strict";

import { extendedGameStats } from "@/data/extended-game-stats";
import { playerProfiles } from "@/data/player-profiles";
import { getGameStatsCsvTemplate, parseGameStatsCsv } from "@/lib/game-stats-csv";
import { getAllGameStats } from "@/lib/game-stats";
import { formatGameStatsForDataFile, parseGameStatsDraft } from "@/lib/game-stats-import";
import { getGames } from "@/lib/games";
import { reconcileStatCatalogs, type StatReconciliationIssue } from "@/lib/stat-reconciliation";

const coreStats = getAllGameStats();
const report = reconcileStatCatalogs({
  coreStats,
  extendedStats: extendedGameStats,
  canonicalGames: getGames(),
  playerProfiles,
});

const albanyHawley = coreStats.find((stats) => stats.gameId === "hawley-at-albany-2026-week-1");
assert.ok(albanyHawley, "Synthetic completeness check requires the Albany-Hawley record.");
const syntheticCompleteClaim = {
  ...albanyHawley,
  completeness: albanyHawley.completeness?.map((team) => team.schoolSlug === "albany"
    ? { ...team, categories: { ...team.categories, rushing: { status: "complete" as const, note: "Synthetic false completeness claim." } } }
    : team),
};
const syntheticReport = reconcileStatCatalogs({
  coreStats: [syntheticCompleteClaim],
  extendedStats: [],
  canonicalGames: getGames(),
  playerProfiles,
});
assert.ok(
  syntheticReport.errors.some((issue) => issue.kind === "reconciliation"
    && issue.gameId === syntheticCompleteClaim.gameId
    && issue.message.includes("albany rushing attribution")
    && issue.message.includes("contradicts the complete claim")),
  "A falsely complete mismatched category must fail reconciliation."
);

const jsonRoundTrip = parseGameStatsDraft(formatGameStatsForDataFile(albanyHawley));
assert.ok(jsonRoundTrip.ok, "The correction workflow must parse an authoritative stat record with completeness metadata.");
assert.deepEqual(jsonRoundTrip.stats.completeness, albanyHawley.completeness, "The correction workflow must preserve completeness metadata.");

const csvRoundTrip = parseGameStatsCsv(getGameStatsCsvTemplate());
assert.ok(csvRoundTrip.ok, "The correction CSV template must remain parseable.");
assert.equal(csvRoundTrip.stats.completeness?.[0]?.categories.rushing?.status, "complete", "The correction CSV workflow must preserve completeness metadata.");

function printIssues(title: string, issues: StatReconciliationIssue[]) {
  if (issues.length === 0) return;
  console.log(`\n${title}`);
  for (const issue of issues) {
    const game = issue.gameId ? ` [${issue.gameId}]` : "";
    console.log(`- ${issue.kind.toUpperCase()}${game}: ${issue.message}`);
  }
}

console.log("VarsityVue statistics reconciliation");
console.log("=====================================");
console.log(`Core records checked: ${report.coreRecordsChecked}`);
console.log(`Extended records checked: ${report.extendedRecordsChecked}`);
console.log(`Canonical-ID failures: ${report.counts.canonicalIdFailures}`);
console.log(`Duplicate failures: ${report.counts.duplicateFailures}`);
console.log(`Hard reconciliation failures: ${report.counts.hardReconciliationFailures}`);
console.log(`Partial/incomplete warnings: ${report.counts.partialWarnings}`);
console.log(`Unavailable/unverifiable warnings: ${report.counts.unavailableWarnings}`);
console.log(`Unknown/unclassified warnings: ${report.counts.unclassifiedWarnings}`);
console.log(`Identity warnings: ${report.counts.identityWarnings}`);
console.log(`Core/extended contradictions: ${report.counts.coreExtendedContradictions}`);
console.log(`Provenance failures: ${report.counts.provenanceFailures}`);
console.log("Synthetic false complete claim: rejected");
console.log("Correction workflow completeness round-trip: passed");

printIssues("Blocking failures", report.errors);
printIssues("Non-blocking warnings", report.warnings);

console.log(`\nResult: ${report.errors.length > 0 ? `FAILED (${report.errors.length} blocking issue${report.errors.length === 1 ? "" : "s"})` : "PASSED"}`);
if (report.errors.length > 0) process.exitCode = 1;
