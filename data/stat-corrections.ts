export type StatCorrectionAudit = {
  auditId: string;
  gameId: string;
  season: number;
  reviewedAt: string;
  reviewedBy: string;
  promptedBy: string;
  note: string;
  changedSections: string[];
};

// Internal-only audit records for approved stat corrections.
// Add an entry here whenever an existing GameStats record is intentionally replaced.
export const statCorrectionAudits: StatCorrectionAudit[] = [
  {
    auditId: "stamford-slayden-young-week2-receiving-2026-10-07",
    gameId: "de-leon-at-stamford-2026-week-2",
    season: 2026,
    reviewedAt: "2026-10-07T07:18:07Z",
    reviewedBy: "Owner",
    promptedBy: "Owner-supplied MaxPreps game-by-game receiving screenshots",
    note: "Correct Slayden Young's Week 2 receiving line from 5 receptions for 28 yards to 6 receptions for 30 yards and restore the line omitted by the De Leon correction layer. The six verified game lines reconcile to 34 receptions for 474 yards. Owner source review confirms Week 2 reports 21 completions for 271 yards but attributes only 20 receptions for 271 yards; no evidence identifies the remaining receiver. Preserve the supported values and partial receiving attribution.",
    changedSections: ["receiving"],
  },
];
