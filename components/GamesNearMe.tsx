"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { DiscoveryGame, SchoolCenter } from "@/types/game-location";
import { approvedLocationPilotSlates } from "@/data/game-location-pilot";
import { currentScheduleWeek, nearbyGames, pilotGate, NEARBY_RADII, type DiscoveryFilter } from "@/lib/game-discovery";
import { distanceLabel, validPoint, type GeographicPoint } from "@/lib/geo-distance";

import { buildSearchSummary } from "@/lib/coverage-demand-summary";
import { CoverageEpisode, CoveragePreference, COVERAGE_CHOICE_KEY, EPISODE_INACTIVITY_MS, deliverCoverageSummary } from "@/lib/coverage-demand-client";
import type { CoverageChoice, CenterSource } from "@/types/coverage-demand";

type Center = GeographicPoint & { label: string; source: CenterSource };
const control = "min-h-11 rounded-xl border border-white/25 bg-black/40 px-3 py-2 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white";
const errors: Record<number, string> = {
  1: "Location permission was denied. Choose a school instead, or retry after changing your browser permission.",
  2: "Your location is unavailable. Choose a school instead or try again.",
  3: "Location timed out. Choose a school instead or try again.",
};

export default function GamesNearMe({ games, centers, initialQuery = "", initialFilter = "all", now,
  recruitment }: { games: DiscoveryGame[]; centers: SchoolCenter[]; initialQuery?: string;
  initialFilter?: DiscoveryFilter; now: string; recruitment: ReactNode }) {
  const [week, setWeek] = useState(() => currentScheduleWeek(games, new Date(now)) ?? 7);
  const [center, setCenter] = useState<Center | null>(null);
  const [radius, setRadius] = useState(50);
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<DiscoveryFilter>(initialFilter);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [school, setSchool] = useState("");
  const [measurement, setMeasurement] = useState<CoverageChoice>(null);
  const [preference] = useState(() => new CoveragePreference(() => { return localStorage.getItem(COVERAGE_CHOICE_KEY); }));
  const [episode] = useState(() => new CoverageEpisode(deliverCoverageSummary,
    () => preference.reconcile() === "enabled"));
  const request = useRef(0);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      setMeasurement(preference.reconcile());
    });
    const synchronize = (event: StorageEvent) => {
      if (event.key !== null && event.key !== COVERAGE_CHOICE_KEY) return;
      // Withdrawal remains authoritative even if storage becomes unreadable.
      if (event.newValue !== "enabled") {
        episode.discard();
        preference.choose(event.newValue === "disabled" ? "disabled" : null);
      }
      const choice = preference.reconcile();
      if (choice !== "enabled") episode.discard();
      setMeasurement(choice);
    };
    window.addEventListener("storage", synchronize);
    const finalize = () => episode.finalize();
    const hidden = () => { if (document.visibilityState === "hidden") finalize(); };
    window.addEventListener("pagehide", finalize);
    document.addEventListener("visibilitychange", hidden);
    return () => { active = false; finalize(); window.removeEventListener("storage", synchronize); window.removeEventListener("pagehide", finalize); document.removeEventListener("visibilitychange", hidden); };
  }, [episode, preference]);
  function chooseMeasurement(choice: Exclude<CoverageChoice, null>) {
    if (choice === "disabled") episode.discard();
    preference.choose(choice);
    setMeasurement(choice);
    try { localStorage.setItem(COVERAGE_CHOICE_KEY, choice); } catch { /* preference remains in memory */ }
  }
  useEffect(() => () => { request.current++; }, []);
  const gate = pilotGate(games, week);
  const weeks = [...new Set(games.filter(g => g.season === 2026 && g.week !== undefined).map(g => g.week!))].sort((a,b) => a-b);
  const result = center && gate.enabled ? nearbyGames(games, center, radius, week, query, filter) : null;

  useEffect(() => {
    if (!center || !gate.enabled || (measurement !== "enabled" || preference.reconcile() !== "enabled") || process.env.NEXT_PUBLIC_COVERAGE_DEMAND_ENABLED !== "true") {
      episode.discard(); return;
    }
    episode.observe(center, buildSearchSummary(games, center, center.source, week, radius, query, filter), true);
    const timer = window.setTimeout(() => episode.finalize(), EPISODE_INACTIVITY_MS);
    return () => window.clearTimeout(timer);
  }, [center, week, radius, query, filter, games, measurement, gate.enabled, episode, preference]);

  function clear() {
    episode.finalize();
    episode.discard();
    request.current++;
    setCenter(null); setSchool(""); setMessage(""); setLoading(false); setChoosing(false);
  }
  function locate() {
    if (!gate.enabled) return;
    episode.finalize(); episode.discard();
    const token = ++request.current;
    setCenter(null); setSchool(""); setChoosing(true);
    if (!navigator.geolocation) { setMessage("This browser does not support location. Choose a school instead."); return; }
    setLoading(true); setMessage("Finding your location…");
    navigator.geolocation.getCurrentPosition(position => {
      if (token !== request.current) return;
      setLoading(false);
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      if (!validPoint(point) || !Number.isFinite(position.coords.accuracy) || position.coords.accuracy > 1000) {
        setMessage("Your location is too approximate for reliable nearby results. Choose a school instead or retry."); return;
      }
      setCenter({ ...point, label: "Near your location", source: "browser_location" }); setMessage("Location ready."); setChoosing(false);
    }, error => {
      if (token !== request.current) return;
      setLoading(false); setMessage(errors[error.code] ?? errors[2]);
    }, { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 });
  }
  function chooseSchool(slug: string) {
    episode.finalize(); episode.discard();
    request.current++; setLoading(false); setSchool(slug);
    const selected = centers.find(c => c.schoolSlug === slug);
    setCenter(selected ? { latitude: selected.latitude, longitude: selected.longitude, label: `Searching near ${selected.schoolName}`, source: "school_center" } : null);
    setMessage(selected ? "School center selected." : "");
  }

  return <section id="nearby-games" aria-labelledby="nearby-heading" className="mt-7 scroll-mt-24 rounded-2xl border border-white/15 bg-white/[0.04] p-4 sm:mt-10 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h2 id="nearby-heading" className="text-xl font-bold">Games Near Me</h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-white/75">Find tracked games within a straight-line radius. Your precise location stays in this browser’s memory and is cleared when you leave or select Clear.</p>
      </div>
      <a href="#all-matchups" className={`${control} inline-flex items-center`}>Browse normal schedule</a>
    </div>
    <div className="mt-3 rounded-xl border border-white/15 p-3">
      <p id="coverage-disclosure" className="text-sm leading-6 text-white/75">Optional approximate regional usage helps VarsityVue decide where to expand coverage. Precise location is not saved. Games Near Me works without sharing.</p>
      <div aria-describedby="coverage-disclosure" className="mt-2 flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={measurement === "enabled"} onClick={() => chooseMeasurement("enabled")} className={control}>Allow regional measurement</button>
        <button type="button" aria-pressed={measurement === "disabled"} onClick={() => chooseMeasurement("disabled")} className={control}>Don’t share regional usage</button>
        {measurement && <span role="status" className="text-sm text-white/75">Regional measurement {measurement === "enabled" ? "allowed" : "off"}.</span>}
      </div>
    </div>
    <div className="mt-4 flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-sm" htmlFor="nearby-week">Schedule week
        <select id="nearby-week" value={week} onChange={e => { clear(); setWeek(Number(e.target.value)); }} className={control}>
          {weeks.map(w => <option key={w} value={w}>Week {w}{approvedLocationPilotSlates[w] ? " · Venue pilot" : ""}</option>)}
        </select>
      </label>
      <button type="button" onClick={locate} disabled={!gate.enabled || loading} className={`${control} bg-white/10 disabled:opacity-50`}>{loading ? "Finding location…" : "Games Near Me"}</button>
      <button type="button" onClick={() => setChoosing(true)} disabled={!gate.enabled} className={`${control} disabled:opacity-50`}>Choose a school instead</button>
      {loading && <button type="button" onClick={clear} className={control}>Cancel location request</button>}
    </div>
    {!gate.enabled && <p className="mt-3 text-sm leading-6 text-white/80">Nearby discovery is disabled for Week {week}: venue information is incomplete or this week is outside the verified pilot. No complete nearby coverage is claimed. Select Week 7, Week 8 or Week 9 for the venue pilot, or browse the normal schedule.{gate.unresolved > 0 && ` ${gate.unresolved} of ${gate.total} games have unavailable venue information.`}</p>}
    <p role="status" className="mt-2 text-sm text-white/80">{message}</p>
    {gate.enabled && (choosing || school) && <label htmlFor="nearby-center" className="mt-3 flex max-w-lg flex-col gap-1 text-sm">Search center
      <select id="nearby-center" className={control} value={school} onChange={e => chooseSchool(e.target.value)}>
        <option value="">Choose a verified school venue</option>
        {centers.map(c => <option key={c.schoolSlug} value={c.schoolSlug}>{c.schoolName} · {c.venueName}</option>)}
      </select>
    </label>}
    {center && gate.enabled && <>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-sm font-semibold">{center.label} · Within {radius} miles</p>
        <button className={control} type="button" onClick={() => setChoosing(true)}>Change center</button>
        <button className={control} type="button" onClick={clear}>Clear</button>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label htmlFor="nearby-radius" className="flex min-w-0 flex-col gap-1 text-sm">Radius
          <select id="nearby-radius" className={control} value={radius} onChange={e => setRadius(Number(e.target.value))}>{NEARBY_RADII.map(r => <option key={r} value={r}>{r} miles</option>)}</select>
        </label>
        <label htmlFor="nearby-search" className="flex min-w-0 flex-col gap-1 text-sm">Search nearby matchups
          <input id="nearby-search" className={`${control} w-full min-w-0`} type="search" value={query} onChange={e => setQuery(e.target.value)} />
        </label>
        <label htmlFor="nearby-status" className="flex min-w-0 flex-col gap-1 text-sm">Game filter
          <select id="nearby-status" className={control} value={filter} onChange={e => setFilter(e.target.value as DiscoveryFilter)}>
            <option value="all">LIVE + upcoming</option><option value="live">LIVE</option><option value="upcoming">Upcoming</option><option value="district">District</option><option value="final">Final results separately</option>
          </select>
        </label>
      </div>
      <h3 className="mt-5 text-lg font-bold">{filter === "final" ? "Nearby final results" : "Nearby games"}</h3>
      <p className="mt-1 text-sm text-white/75">{result?.games.length ?? 0} matching games · Week {week}</p>
      {result && result.games.length === 0 && <p className="mt-3 text-sm text-white/80">{result.nearbyCount === 0 ? "No nearby tracked games in this radius and result category. Try a larger radius, another week, or the normal schedule." : "No matches with these filters. Clear your search or change the game filter."}</p>}
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {result?.games.map(g => <Link prefetch={false} key={g.gameId} href={`/games/${g.gameId}`} onClick={() => episode.finalize(true)} onAuxClick={e => { if (e.button === 1) episode.finalize(true); }} className="rounded-xl border border-white/15 bg-black/30 p-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
          <p className="text-xs font-semibold text-white/80">{g.status === "live" ? (g.livePresentation === "kickoff_inferred" ? "Kickoff window · live score not confirmed" : "LIVE · verified score") : g.status === "final" ? "FINAL" : "Upcoming"}</p>
          <h4 className="mt-2 text-lg font-bold">{g.awayTeam} at {g.homeTeam}</h4>
          {g.homeScore !== undefined && g.awayScore !== undefined && <p className="mt-1 text-lg font-bold">{g.awayScore}–{g.homeScore}{g.period ? ` · ${g.period}` : ""}{g.clock ? ` · ${g.clock}` : ""}</p>}
          <p className="mt-1 text-sm text-white/80">{g.kickoff ? new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric", ...(g.kickoff.includes("T") ? { hour: "numeric", minute: "2-digit" } : {}) }).format(new Date(g.kickoff.includes("T") ? g.kickoff : `${g.kickoff}T12:00:00Z`)) : "Kickoff TBD"}</p>
          <p className="mt-2 text-sm font-semibold">{distanceLabel(g.distance)}</p>
          {g.location.locationQuality === "verified" && <p className="mt-1 text-xs leading-5 text-white/75">{g.location.venueName} · {g.location.city}</p>}
        </Link>)}
      </div>
      {recruitment}
    </>}
    <noscript><p className="mt-3">Nearby discovery needs JavaScript. The normal schedule below remains available.</p></noscript>
  </section>;
}
