import type { StatCorrectionAudit } from "@/data/stat-corrections";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createStatCorrectionAudit({
  gameId,
  season,
  reviewedAt,
  reviewedBy,
  promptedBy,
  note,
  changedSections,
}: Omit<StatCorrectionAudit, "auditId">): StatCorrectionAudit {
  return {
    auditId: `${slugify(gameId)}-${reviewedAt.replace(/[^0-9]/g, "")}`,
    gameId,
    season,
    reviewedAt,
    reviewedBy: reviewedBy.trim(),
    promptedBy: promptedBy.trim(),
    note: note.trim(),
    changedSections,
  };
}

export function formatStatCorrectionAudit(audit: StatCorrectionAudit) {
  return JSON.stringify(audit, null, 2);
}
