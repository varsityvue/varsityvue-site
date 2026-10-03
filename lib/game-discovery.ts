import type { DiscoveryGame } from "@/types/game-location";
import { approvedLocationPilotSlates } from "@/data/game-location-pilot";
import { distanceMiles, type GeographicPoint } from "./geo-distance";

export const PILOT_SEASON = 2026;
export const NEARBY_RADII = [10, 25, 50, 100, 150] as const;
export type DiscoveryFilter = "all" | "live" | "upcoming" | "final" | "district";
export function realGame(game: Pick<DiscoveryGame, "gameType">) {
  return game.gameType !== "bye" && game.gameType !== "scrimmage";
}
export function pilotGate(games: readonly DiscoveryGame[], week: number) {
  const slate = games.filter(g => g.season === PILOT_SEASON && g.week === week && realGame(g));
  const unresolved = slate.filter(g => g.location.locationQuality !== "verified").length;
  const ids = slate.map(g => g.gameId).sort();
  const approvedSlate = approvedLocationPilotSlates[week];
  const exactSlate = Boolean(approvedSlate && ids.length === approvedSlate.length && ids.every((id, i) => id === approvedSlate[i]));
  return { enabled: exactSlate && unresolved === 0,
    total: slate.length, unresolved };
}

// Central Monday through Sunday, from canonical kickoff dates, independent of Pick 'Em lifecycle.
export function currentScheduleWeek(games: readonly DiscoveryGame[], now = new Date()): number | undefined {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const value = (type: string) => Number(parts.find(p => p.type === type)?.value);
  const today = Date.UTC(value("year"), value("month") - 1, value("day"));
  const monday = (date: number) => date - ((new Date(date).getUTCDay() + 6) % 7) * 86400000;
  return games.find(g => {
    if (!g.kickoff || !realGame(g)) return false;
    const day = g.kickoff.includes("T") ? new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(g.kickoff)) : g.kickoff;
    return monday(Date.parse(day + "T12:00:00Z") - 43200000) === monday(today);
  })?.week;
}

export function nearbyGames(games: readonly DiscoveryGame[], center: GeographicPoint, radius: number,
  week: number, query = "", filter: DiscoveryFilter = "all") {
  const slate = games.filter(g => g.season === PILOT_SEASON && g.week === week && realGame(g));
  const located = slate.flatMap(game => game.location.locationQuality === "verified"
    ? [{ ...game, distance: distanceMiles(center, game.location) }] : []);
  const inRadius = located.filter(g => g.distance <= radius);
  const primary = (g: DiscoveryGame) => ["live", "upcoming"].includes(g.status);
  const eligible = inRadius.filter(g => filter === "final" ? g.status === "final" : primary(g));
  const matching = eligible.filter(g => {
    if (filter === "live" && g.status !== "live") return false;
    if (filter === "upcoming" && g.status !== "upcoming") return false;
    if (filter === "district" && !g.districtGame) return false;
    return `${g.awayTeam} ${g.homeTeam} ${g.location.locationQuality === "verified" ? g.location.venueName + " " + g.location.city : ""} week ${g.week}`.toLowerCase().includes(query.trim().toLowerCase());
  }).sort((a, b) => (a.status === "live" ? 0 : 1) - (b.status === "live" ? 0 : 1)
    || a.distance - b.distance || (Date.parse(a.kickoff ?? "") || Infinity) - (Date.parse(b.kickoff ?? "") || Infinity)
    || a.gameId.localeCompare(b.gameId));
  return { games: matching, nearbyCount: eligible.length, unresolved: slate.length - located.length };
}
