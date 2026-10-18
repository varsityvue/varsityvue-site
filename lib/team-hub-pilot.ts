import type { Game } from "@/types/platform";
import { getGamePresentation } from "@/lib/game-presentation";

const PILOT_SLUGS = new Set(["de-leon", "cisco", "goldthwaite", "albany", "stephenville"]);
export const isTeamHubV2Pilot = (slug: string) => PILOT_SLUGS.has(slug);

// Keep one authoritative game in focus; never promote an unverified report to LIVE.
export function getHubGameFocus(games: Game[], slug: string, now = new Date()) {
  const relevant = games.filter(game => game.gameType !== "bye" && game.gameType !== "scrimmage" &&
    (game.homeSchoolSlug === slug || game.awaySchoolSlug === slug));
  const ordered = [...relevant].sort((a, b) =>
    (a.kickoff ?? a.date ?? "").localeCompare(b.kickoff ?? b.date ?? "") || a.id.localeCompare(b.id));
  const live = ordered.find(game => getGamePresentation(game, now).kind === "verified_live");
  const window = ordered.find(game => getGamePresentation(game, now).kind === "kickoff_window");
  const latest = ordered.filter(game => game.status === "final").at(-1);
  const next = [...ordered].sort((a, b) => (a.kickoff ?? a.date ?? "9999").localeCompare(b.kickoff ?? b.date ?? "9999")).find(game => (game.status === "upcoming" || game.status === "scheduled") &&
    getGamePresentation(game, now).kind === "scheduled");
  return { featured: live ?? window ?? latest ?? next, next };
}
