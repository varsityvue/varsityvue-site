export const evidenceSourceTypes = [
  "official_school",
  "official_team",
  "broadcaster",
  "newspaper",
  "score_service",
  "social",
  "other",
] as const;

export type EvidenceSourceType = (typeof evidenceSourceTypes)[number];

export const evidenceSourceLabels: Record<EvidenceSourceType, string> = {
  official_school: "Official school",
  official_team: "Official team",
  broadcaster: "Game broadcaster",
  newspaper: "Local newspaper",
  score_service: "Score service",
  social: "Social post",
  other: "Other",
};

type ScoredEvidence = {
  away_score: number | null;
  home_score: number | null;
  source_weight: number;
};

export type ScoreConsensus = {
  state: "none" | "single" | "corroborated" | "conflict";
  awayScore: number | null;
  homeScore: number | null;
  confidence: number;
  matchingSources: number;
  candidateCount: number;
};

export function scoreConsensus(evidence: ScoredEvidence[]): ScoreConsensus {
  const groups = new Map<string, { awayScore: number; homeScore: number; weights: number[] }>();
  for (const item of evidence) {
    if (item.away_score === null || item.home_score === null) continue;
    const key = `${item.away_score}:${item.home_score}`;
    const group = groups.get(key) ?? { awayScore: item.away_score, homeScore: item.home_score, weights: [] };
    group.weights.push(item.source_weight);
    groups.set(key, group);
  }

  const ranked = [...groups.values()].sort((a, b) => {
    const aStrength = Math.max(...a.weights) + (a.weights.length - 1) * 10;
    const bStrength = Math.max(...b.weights) + (b.weights.length - 1) * 10;
    return bStrength - aStrength;
  });
  const leader = ranked[0];
  if (!leader) return { state: "none", awayScore: null, homeScore: null, confidence: 0, matchingSources: 0, candidateCount: 0 };

  const confidence = Math.min(99, Math.max(...leader.weights) + (leader.weights.length - 1) * 10);
  return {
    state: ranked.length > 1 ? "conflict" : leader.weights.length > 1 ? "corroborated" : "single",
    awayScore: leader.awayScore,
    homeScore: leader.homeScore,
    confidence,
    matchingSources: leader.weights.length,
    candidateCount: ranked.length,
  };
}
