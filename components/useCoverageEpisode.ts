"use client";
import { useEffect, useEffectEvent, useState } from "react";
import { CoverageEpisode, CoveragePreference, COVERAGE_CHOICE_KEY, EPISODE_INACTIVITY_MS, deliverCoverageSummary } from "@/lib/coverage-demand-client";
import type { CoverageChoice, GamesNearMeSearchSummary } from "@/types/coverage-demand";
// One mounted owner in WeeklyGamesExplorer. Score refresh is deliberately not a boundary or inactivity reset.
export function useCoverageEpisode(center: object | null, controls: string, summary: () => GamesNearMeSearchSummary | null) {
  const [choice, setChoice] = useState<CoverageChoice>(null);
  const [preference] = useState(() => new CoveragePreference(() => localStorage.getItem(COVERAGE_CHOICE_KEY)));
  const [episode] = useState(() => new CoverageEpisode(deliverCoverageSummary, () => preference.reconcile() === "enabled"));
  const readSummary = useEffectEvent(summary);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => { if (active) setChoice(preference.reconcile()); });
    const synchronize = (event: StorageEvent) => {
      if (event.key !== null && event.key !== COVERAGE_CHOICE_KEY) return;
      if (event.newValue !== "enabled") {
        episode.discard();
        preference.choose(event.newValue === "disabled" ? "disabled" : null);
      }
      const next = preference.reconcile();
      if (next !== "enabled") episode.discard();
      setChoice(next);
    };
    const finalize = () => episode.finalize();
    const hidden = () => { if (document.visibilityState === "hidden") finalize(); };
    window.addEventListener("storage", synchronize);
    window.addEventListener("pagehide", finalize);
    document.addEventListener("visibilitychange", hidden);
    return () => { active = false; finalize(); window.removeEventListener("storage", synchronize); window.removeEventListener("pagehide", finalize); document.removeEventListener("visibilitychange", hidden); };
  }, [preference, episode]);
  useEffect(() => {
    if (!center) { episode.finalize(); episode.discard(); return; }
    if (choice !== "enabled" || preference.reconcile() !== "enabled" || process.env.NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED !== "true") { episode.discard(); return; }
    episode.observe(center, readSummary(), true);
    const timer = window.setTimeout(() => episode.finalize(), EPISODE_INACTIVITY_MS);
    return () => window.clearTimeout(timer);
  }, [center, controls, choice, preference, episode]);
  function choose(next: "enabled" | "disabled") {
    if (next === "disabled") episode.discard();
    preference.choose(next);
    try { localStorage.setItem(COVERAGE_CHOICE_KEY, next); } catch { /* mounted-page fallback */ }
    setChoice(preference.reconcile());
  }
  return {choice, choose, finish: () => {episode.finalize(); episode.discard();}, select: () => episode.finalize(true)};
}
