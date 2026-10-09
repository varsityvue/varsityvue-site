import type { Game } from "@/types/platform";

export function shouldPollGameCenter(game: Pick<Game, "status" | "kickoff">, now = Date.now()) {
  if (game.status === "live") return true;
  if (!["scheduled", "upcoming"].includes(game.status) || !game.kickoff?.includes("T")) return false;
  const kickoff = Date.parse(game.kickoff);
  return Number.isFinite(kickoff) && now >= kickoff - 30 * 60_000 && now <= kickoff + 6 * 60 * 60_000;
}
