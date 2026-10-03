import type { CoverageChoice, GamesNearMeSearchSummary } from "@/types/coverage-demand";
import { validSummary } from "./coverage-demand-summary";

export const COVERAGE_CHOICE_KEY = "coverage_measurement_v2";
export const EPISODE_INACTIVITY_MS = 60000;
export class CoveragePreference {
  private choice: CoverageChoice = null;
  constructor(private read: () => string | null) {}
  choose(choice: CoverageChoice) { this.choice = choice; }
  reconcile(): CoverageChoice {
    try {
      const stored = this.read();
      this.choice = stored === "enabled" || stored === "disabled" ? stored : null;
    } catch { /* unreadable storage: preserve explicit mounted-page choice */ }
    return this.choice;
  }
}
export function deliverCoverageSummary(summary: GamesNearMeSearchSummary): void {
  if (process.env.NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED !== "true" || !validSummary(summary)) return;
  // fetch, rather than sendBeacon, explicitly omits credentials and referrer.
  // No retry: avoiding duplicate counting is preferable to guaranteed delivery.
  try {
    void fetch("/api/coverage-demand", { method: "POST", credentials: "omit", referrerPolicy: "no-referrer",
      headers: { "Content-Type": "application/json" }, body: JSON.stringify(summary), keepalive: true,
      signal: AbortSignal.timeout(2000) }).catch(() => {});
  } catch { /* delivery is optional */ }
}

export class CoverageEpisode {
  private center: object | null = null;
  private week = 0;
  private latest: GamesNearMeSearchSummary | null = null;
  private finalized = false;
  constructor(private send: (summary: GamesNearMeSearchSummary) => void, private permitted: () => boolean = () => true) {}
  observe(center: object, summary: GamesNearMeSearchSummary | null, enabled: boolean) {
    if (!enabled || !summary) { this.discard(); return; }
    if (this.center !== center || this.week !== summary.week) {
      this.finalize(); this.center = center; this.week = summary.week; this.finalized = false; this.latest = null;
    }
    if (this.finalized) return;
    const initial = this.latest?.initial_radius_miles ?? summary.initial_radius_miles;
    const steps = Math.min(4, (this.latest?.radius_expansion_steps ?? 0)
      + (this.latest && summary.final_radius_miles > this.latest.final_radius_miles ? 1 : 0));
    this.latest = { ...summary, initial_radius_miles: initial, radius_expansion_steps: steps, radius_expanded: steps > 0 };
  }
  finalize(selected = false) {
    if (!this.permitted()) { this.discard(); return; }
    if (!this.latest || this.finalized) return;
    this.finalized = true;
    const summary = { ...this.latest, game_selected: selected };
    this.latest = null;
    try { this.send(summary); } catch { /* discovery and navigation never depend on delivery */ }
  }
  discard() { this.latest = null; this.center = null; this.week = 0; this.finalized = false; }
}
