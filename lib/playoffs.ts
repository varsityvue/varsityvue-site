import { getGamePresentation } from "@/lib/game-presentation";
import type { Game } from "@/types/platform";

export const PLAYOFF_SEASON = 2026;

export function getPlayoffSchedule(games: Game[], now = new Date()) {
  return games
    .filter((game) => game.season === PLAYOFF_SEASON && game.gameType === "playoff")
    .map((game) => ({ game, presentation: getGamePresentation(game, now) }))
    .sort((a, b) => kickoffOrder(a.game) - kickoffOrder(b.game));
}

function kickoffOrder(game: Game) {
  const timestamp = Date.parse(game.kickoff ?? "");
  return Number.isFinite(timestamp) ? timestamp : Number.MAX_SAFE_INTEGER;
}

export function formatPlayoffKickoff(kickoff?: string) {
  if (!kickoff) return "Kickoff TBD";
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(kickoff);
  const date = new Date(dateOnly ? `${kickoff}T12:00:00Z` : kickoff);
  if (Number.isNaN(date.getTime()) || (dateOnly && date.toISOString().slice(0, 10) !== kickoff)) {
    return "Kickoff TBD";
  }
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
  if (dateOnly) return `${day} · Time TBD`;
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(date);
  return `${day} · ${time}`;
}
