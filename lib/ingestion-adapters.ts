import { parseGameStatsDraft } from "@/lib/game-stats-import";
import { parseGameStatsCsv } from "@/lib/game-stats-csv";
import { normalizeIngestionDraft, type StatsDraft } from "@/lib/ingestion-contracts";

export type StatsDraftContext = Omit<StatsDraft, "schemaVersion" | "dataClass" | "values">;
/** Legacy verified marker is retained only in exports, never inferred as draft approval. */
export function normalizeLegacyStats(format: "json" | "csv", input: string, context: StatsDraftContext) {
  const parsed = format === "json" ? parseGameStatsDraft(input) : parseGameStatsCsv(input);
  if (!parsed.ok) return parsed;
  const { sourceStatus: _legacyMarker, ...values } = parsed.stats;
  void _legacyMarker;
  const normalized = normalizeIngestionDraft({ ...context, schemaVersion: 1, dataClass: "game_stats", values });
  return normalized.ok ? { ...normalized, notices: parsed.notices } : normalized;
}
