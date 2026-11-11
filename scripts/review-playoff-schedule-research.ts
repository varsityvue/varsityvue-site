import fs from "node:fs";
import path from "node:path";
import { getBiDistrictReadiness } from "../lib/bidistrict-readiness";
import { reviewBiDistrictScheduleCandidates } from "../lib/bidistrict-schedule-candidate-review";
import { getGames } from "../lib/games";
import { getResearchBaselineSchools as getSchools } from "./playoff-research-catalog-baseline";

// Offline research only. No Supabase client, network request, or game-writing API.
const root = path.resolve(process.cwd(), "docs/playoffs/research-20261110");
const class2a = JSON.parse(fs.readFileSync(path.join(root, "class-2a.json"), "utf8"));
const class3a4a = JSON.parse(fs.readFileSync(path.join(root, "class-3a-4a.json"), "utf8"));
type ResearchRow = {
  division: string; region: string; slot: number; teams: [string, string];
  kickoff: string | null; proposedKickoff?: string; venue: string; city?: string;
  sourceLabel: string; sourceUrl: string; verificationStatus: string;
  neutralSite?: boolean | null; timezoneBasis?: string; timeZoneBasis?: string; missingInformation?: string[]; conflicts?: unknown[];
};
const remaining = JSON.parse(fs.readFileSync(path.join(root, "remaining-3a-4a.json"), "utf8"));
const rows: ResearchRow[] = [...class2a, ...class3a4a.candidates, ...remaining.candidates];
const inventory = getBiDistrictReadiness(getGames());
const schools = getSchools();
const candidates = rows.map((row) => ({ ...row, kickoff: row.kickoff ?? row.proposedKickoff ?? "" }));
const reviews = reviewBiDistrictScheduleCandidates(candidates, inventory);
const output = reviews.map((review, index) => {
  const research = rows[index];
  const schoolSlugs = research.teams.map((name) => {
    const matches = schools.filter((school) => school.name === name &&
      school.classification.conference === research.division.split(" ")[0] &&
      school.classification.division === (research.division.endsWith(" II") ? "D2" : "D1"));
    return matches.length === 1 ? matches[0].slug : null;
  });
  const entry = inventory.find((item) => item.division === research.division && item.region === research.region && item.slot === research.slot)!;
  const issues = [...review.issues, ...(research.missingInformation ?? [])];
  if (/infer/i.test(research.timezoneBasis ?? research.timeZoneBasis ?? "")) issues.push("timezone offset is inferred; confirm source timezone");
  if (research.verificationStatus !== "source-verified") issues.push("independent source verification still required");
  if (research.neutralSite == null) issues.push("explicit neutral-site designation not verified");
  if (research.conflicts?.length) issues.push("review recorded source discrepancies and resolution notes");
  if (schoolSlugs.some((slug) => slug === null)) issues.push("school slug requires manual identity reconciliation");
  return {
    bracket: { division: research.division, region: research.region, slot: research.slot, teams: research.teams },
    existingGameId: entry.gameId ?? null,
    operation: entry.gameId ? "reconcile-existing-only" : "proposed-new-record",
    proposed: { ...review.candidate, schoolSlugs, city: research.city ?? null, neutralSite: research.neutralSite ?? null },
    provenance: research,
    structuralValidationPassed: review.readyForHumanReview,
    publicationIssues: [...new Set(issues)],
    readyForPublication: false,
  };
});
// Report catalog coverage without guessing aliases or creating school identities.
const unresolvedIdentities = new Map<string, { name: string; division: string; bracketReferences: number }>();
let exactMatchedTeamReferences = 0;
for (const item of output) {
  item.bracket.teams.forEach((name, index) => {
    if (item.proposed.schoolSlugs[index]) {
      exactMatchedTeamReferences += 1;
      return;
    }
    const key = `${item.bracket.division}|${name}`;
    const pending = unresolvedIdentities.get(key);
    if (pending) pending.bracketReferences += 1;
    else unresolvedIdentities.set(key, { name, division: item.bracket.division, bracketReferences: 1 });
  });
}
console.log(JSON.stringify({
  researchDate: "2026-11-10", mode: "offline-read-only", productionWrites: false,
  inventory: { total: inventory.length, scheduled: inventory.filter((item) => item.status === "scheduled").length, missing: inventory.filter((item) => item.status === "missing-record").length },
  researched: output.length,
  missingRecordsResearched: output.filter((item) => item.operation === "proposed-new-record").length,
  structurallyValidNewCandidates: output.filter((item) => item.structuralValidationPassed).length,
  sourceVerifiedSchedules: rows.filter((row) => row.verificationStatus === "source-verified").length,
  readyForPublication: 0,
  identityAudit: {
    catalogSchools: schools.length,
    teamReferences: output.length * 2,
    exactMatchedTeamReferences,
    unresolvedTeamReferences: output.length * 2 - exactMatchedTeamReferences,
    unresolvedDistinctIdentities: unresolvedIdentities.size,
    fullyMatchedGames: output.filter((item) => item.proposed.schoolSlugs.every(Boolean)).length,
    unresolved: [...unresolvedIdentities.values()],
  },
  candidates: output,
  unresearched: inventory.filter((item) => !rows.some((row) => row.division === item.division && row.region === item.region && row.slot === item.slot)),
}, null, 2));
