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
export const statCorrectionAudits: StatCorrectionAudit[] = [];
