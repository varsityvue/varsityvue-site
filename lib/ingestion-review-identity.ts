import { createHash } from "node:crypto";
import { isPlainRecord } from "@/lib/game-stats-shape";
import { normalizeIngestionDraft, type IngestionDraft, type CorrectionDraft } from "@/lib/ingestion-contracts";

export const REVIEW_HASH_VERSION = "vv-review-v1";
const unordered = new Set(["sources", "sourceIds", "evidence", "issues", "candidates", "rows", "quarterScores", "teamStats", "rushing", "passing", "receiving", "completeness", "positions", "identityMatches", "availability"]);
/** Object keys and set-like catalog rows are sorted; quarter splits and scoring plays retain order. */
function canonical(value: unknown, key = ""): unknown {
  if (Array.isArray(value)) {
    const list = value.map(v => canonical(v));
    return unordered.has(key) ? list.sort((a, b) => {
      const left = JSON.stringify(a), right = JSON.stringify(b);
      return left < right ? -1 : left > right ? 1 : 0;
    }) : list;
  }
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([k, v]) => [k, canonical(v, k)]));
  return value;
}
function validateHashInput(value: unknown, inArray = false): void {
  if (value === undefined) { if (inArray) throw new Error("Review hashes cannot contain missing array elements."); return; }
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (Array.isArray(value)) { Array.from(value).forEach(v => validateHashInput(v, true)); return; }
  if (isPlainRecord(value) && Object.getOwnPropertySymbols(value).length === 0) { Object.values(value).forEach(v => validateHashInput(v)); return; }
  throw new Error("Review hashes require finite JSON-domain values.");
}
/** Server-side hashing only. No browser crypto polyfill or new client dependency. */
export function canonicalRevisionHash(value: unknown): string {
  validateHashInput(value);
  return `${REVIEW_HASH_VERSION}:${createHash("sha256").update(JSON.stringify({ presence: value === undefined ? "omitted" : "present", value: canonical(value) })).digest("hex")}`;
}
export function draftReviewHash(draft: IngestionDraft): string {
  const parsed = normalizeIngestionDraft(draft);
  if (!parsed.ok) throw new Error(parsed.errors.join("\n"));
  // Disposition is the result of a review, not input to its identity. All normalized data,
  // matching, expected target revision and source/evidence/reason changes invalidate it.
  const { disposition: _disposition, issues: _derivedIssues, ...reviewed } = parsed.draft;
  void _disposition; void _derivedIssues;
  const pathToStableRow = (path: string) => {
    const tokens = path.replace(/\[(\d+)\]/g, ".$1").split(".");
    let current: unknown = parsed.draft.values;
    const stable: string[] = [];
    for (const token of tokens) {
      if (Array.isArray(current) && /^\d+$/.test(token)) {
        const row = current[Number(token)];
        const category = stable[stable.length - 1];
        if (unordered.has(category) && row && typeof row === "object") {
          const r = row as Record<string, unknown>;
          stable.push(JSON.stringify(r.rowId ?? [r.schoolSlug, r.playerId ?? r.player ?? ""]));
        } else stable.push(token);
        current = row;
      } else { stable.push(token); current = current && typeof current === "object" ? (current as Record<string, unknown>)[token] : undefined; }
    }
    return stable.join(".");
  };
  return canonicalRevisionHash({ ...reviewed,
    evidence: reviewed.evidence.map(e => ({ ...e, path: pathToStableRow(e.path) })),
    identityMatches: reviewed.identityMatches.map(e => ({ ...e, path: pathToStableRow(e.path) })),
    availability: reviewed.availability.map(e => ({ ...e, path: pathToStableRow(e.path) })),
  });
}
export type ReviewBinding = { hashVersion: typeof REVIEW_HASH_VERSION; draftHash: string; canonicalHash: string };
export function bindReview(draft: IngestionDraft, currentCanonical: unknown): ReviewBinding {
  return { hashVersion: REVIEW_HASH_VERSION, draftHash: draftReviewHash(draft), canonicalHash: canonicalRevisionHash(currentCanonical) };
}
export function isReviewCurrent(binding: ReviewBinding, draft: IngestionDraft, currentCanonical: unknown): boolean {
  try { return binding.hashVersion === REVIEW_HASH_VERSION && binding.draftHash === draftReviewHash(draft) && binding.canonicalHash === canonicalRevisionHash(currentCanonical); }
  catch { return false; }
}
export type ValuePresence = { state: "present"; value: unknown } | { state: "omitted" };
export type CorrectionDifference = { path: string; before: ValuePresence; proposed: ValuePresence };
export function correctionDifferences(draft: CorrectionDraft): CorrectionDifference[] {
  const result: CorrectionDifference[] = [];
  const walk = (before: unknown, proposed: unknown, path: string, hasBefore = true, hasProposed = true) => {
    if (hasBefore && hasProposed && JSON.stringify(canonical(before)) === JSON.stringify(canonical(proposed))) return;
    if (before && proposed && typeof before === "object" && typeof proposed === "object" && !Array.isArray(before) && !Array.isArray(proposed)) {
      const a = before as Record<string, unknown>, b = proposed as Record<string, unknown>;
      for (const k of [...new Set([...Object.keys(a), ...Object.keys(b)])].sort()) walk(a[k], b[k], path ? `${path}.${k}` : k, Object.hasOwn(a, k), Object.hasOwn(b, k));
    } else result.push({ path, before: hasBefore ? { state: "present", value: before } : { state: "omitted" }, proposed: hasProposed ? { state: "present", value: proposed } : { state: "omitted" } });
  };
  walk(draft.values.current, draft.values.proposed, "");
  return result;
}
