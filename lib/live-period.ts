export const LIVE_PERIODS = ["1st", "2nd", "3rd", "4th", "OT"] as const;

export function normalizeLivePeriod(value: string): string | null {
  const normalized = value.trim();
  if (LIVE_PERIODS.includes(normalized as (typeof LIVE_PERIODS)[number])) return normalized;
  const overtime = /^OT([2-9][0-9]*)$/.exec(normalized);
  return overtime ? `OT${overtime[1]}` : null;
}

export function liveGameContext(period?: string | null, clock?: string | null) {
  return [period?.trim(), clock?.trim()].filter(Boolean).join(" · ") || "Live";
}
