import { extendedGameStats } from "@/data/extended-game-stats";
import { playerProfiles } from "@/data/player-profiles";
import { getAllGameStats } from "@/lib/game-stats";
import { getGames } from "@/lib/games";
import { reconcileStatCatalogs, type StatReconciliationIssue } from "@/lib/stat-reconciliation";

const report = reconcileStatCatalogs({
  coreStats: getAllGameStats(),
  extendedStats: extendedGameStats,
  canonicalGames: getGames(),
  playerProfiles,
});

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
console.log(`Identity warnings: ${report.counts.identityWarnings}`);
console.log(`Core/extended contradictions: ${report.counts.coreExtendedContradictions}`);
console.log(`Provenance failures: ${report.counts.provenanceFailures}`);

printIssues("Blocking failures", report.errors);
printIssues("Non-blocking warnings", report.warnings);

console.log(`\nResult: ${report.errors.length > 0 ? `FAILED (${report.errors.length} blocking issue${report.errors.length === 1 ? "" : "s"})` : "PASSED"}`);
if (report.errors.length > 0) process.exitCode = 1;
