import { verifiedWinner } from "./playoff-bracket-advancement";
import type { Game } from "@/types/platform";

// Season/week are known even when an archival kickoff is unavailable. Never
// assign an invented date just to keep postseason results ahead of September.
export function compareGameChronology(a: Game, b: Game): number {
  return (a.season ?? 0) - (b.season ?? 0) || (a.week ?? 0) - (b.week ?? 0) ||
    (a.kickoff ?? a.date ?? "").localeCompare(b.kickoff ?? b.date ?? "") || a.id.localeCompare(b.id);
}

// Oldest to newest; the newest played result is at the right edge of Last 5.
export function orderPlayedFinals(games: Game[]): Game[] {
  return games.filter((game) =>
    game.status === "final" &&
    (game.gameType !== "playoff" || (Boolean(verifiedWinner(game)) && game.resultType !== "forfeit")) &&
    game.gameType !== "bye" && game.gameType !== "scrimmage" &&
    typeof game.homeScore === "number" && typeof game.awayScore === "number"
  ).sort(compareGameChronology);
}
