import type { StatCompletenessDetail } from "@/data/game-stats";
import { getPublicCompletenessLabel } from "@/lib/stat-completeness";

export default function StatCompletenessBadge({
  completeness,
  hasValues = true,
  compact = false,
}: {
  completeness: StatCompletenessDetail;
  hasValues?: boolean;
  compact?: boolean;
}) {
  const tone = completeness.status === "complete"
    ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100/70"
    : completeness.status === "partial"
      ? "border-amber-300/20 bg-amber-300/10 text-amber-100/75"
      : "border-white/10 bg-white/5 text-white/40";
  const label = compact
    ? completeness.status === "complete" ? "Complete" : completeness.status === "partial" ? "Partial" : completeness.status === "unavailable" ? "Unavailable" : "Unclassified"
    : getPublicCompletenessLabel(completeness.status, hasValues);

  return <span className={`inline-flex rounded-full border px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] sm:px-2.5 sm:text-[9px] ${tone}`}>{label}</span>;
}
