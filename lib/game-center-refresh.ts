import type { Game } from "@/types/platform";

export function shouldPollGameCenter(game: Pick<Game, "status" | "kickoff">, now = Date.now()) {
  if (game.status === "live") return true;
  if (!["scheduled", "upcoming"].includes(game.status) || !game.kickoff?.includes("T")) return false;
  const kickoff = Date.parse(game.kickoff);
  return Number.isFinite(kickoff) && now >= kickoff - 30 * 60_000 && now <= kickoff + 6 * 60 * 60_000;
}

/** Adopt a reviewed fallback only when the previous render had no verified result. */
export function shouldAdoptGameCenterSnapshot(current: Pick<Game,"status"|"publicScoreVerified">, next: Pick<Game,"status"|"publicScoreVerified">, scoreLoadStatus: string) {
  if (scoreLoadStatus !== "failed") return true;
  return current.publicScoreVerified !== true && !["cancelled","postponed"].includes(current.status) && next.status === "final" && next.publicScoreVerified === true;
}
