import type { BiDistrictReadiness } from "@/lib/bidistrict-readiness";

export type BiDistrictScheduleCandidate = {
  division: string;
  region: string;
  slot: number;
  teams: readonly [string, string];
  kickoff: string;
  venue: string;
  sourceLabel: string;
  sourceUrl: string;
};

export type ScheduleCandidateReview = {
  candidate: BiDistrictScheduleCandidate;
  readyForHumanReview: boolean;
  issues: string[];
};

/**
 * Validates proposed schedule research against the existing bracket.
 * This function does not create or publish games, and a passing review
 * never constitutes approval of a schedule or its source.
 */
export function reviewBiDistrictScheduleCandidates(
  candidates: readonly BiDistrictScheduleCandidate[],
  bracket: readonly BiDistrictReadiness[],
): ScheduleCandidateReview[] {
  const slotKey = (division: string, region: string, slot: number) => `${division}|${region}|${slot}`;
  const bySlot = new Map(bracket.map((entry) => [slotKey(entry.division, entry.region, entry.slot), entry]));
  const counts = new Map<string, number>();
  for (const candidate of candidates) {
    const key = slotKey(candidate.division, candidate.region, candidate.slot);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return candidates.map((candidate) => {
    const key = slotKey(candidate.division, candidate.region, candidate.slot);
    const expected = bySlot.get(key);
    const issues: string[] = [];
    if (!expected) issues.push("unknown bracket slot");
    else {
      const actualTeams = [...candidate.teams].map((team) => team.trim().toLowerCase()).sort();
      const expectedTeams = [...expected.teams].map((team) => team.trim().toLowerCase()).sort();
      if (actualTeams.join("|") !== expectedTeams.join("|")) issues.push("teams do not match bracket");
      if (expected.status !== "missing-record" && expected.status !== "needs-details") issues.push("existing game requires manual reconciliation");
    }
    if ((counts.get(key) ?? 0) > 1) issues.push("duplicate candidate for bracket slot");
    const kickoff = Date.parse(candidate.kickoff);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(candidate.kickoff) ||
        !/(?:Z|[+-]\d{2}:\d{2})$/.test(candidate.kickoff) ||
        !Number.isFinite(kickoff)) issues.push("kickoff requires a valid timezone-aware timestamp");
    if (!candidate.venue.trim() || /^(?:tbd|unknown|venue tbd)$/i.test(candidate.venue.trim())) issues.push("confirmed venue required");
    if (!candidate.sourceLabel.trim()) issues.push("source attribution required");
    try {
      const url = new URL(candidate.sourceUrl);
      if (url.protocol !== "https:" || !url.hostname.includes(".")) issues.push("HTTPS source URL required");
    } catch { issues.push("HTTPS source URL required"); }
    return { candidate, readyForHumanReview: issues.length === 0, issues };
  });
}
