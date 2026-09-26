import type { Game } from "@/types/platform";

// Oldest to newest; the newest played result is at the right edge of Last 5.
export function orderPlayedFinals(games: Game[]): Game[] {
  return games.filter((game) =>
    game.status === "final" &&
    game.gameType !== "bye" && game.gameType !== "scrimmage" &&
    typeof game.homeScore === "number" && typeof game.awayScore === "number"
  ).sort((a, b) => {
    const date = (a.kickoff ?? a.date ?? "").localeCompare(b.kickoff ?? b.date ?? "");
    return date || (a.week ?? 0) - (b.week ?? 0) || a.id.localeCompare(b.id);
  });
}
