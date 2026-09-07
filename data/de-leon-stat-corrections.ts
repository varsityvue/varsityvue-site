import type { GameStats } from "@/data/game-stats";

const DE_LEON_WEEK_1 = "san-saba-at-de-leon-2026-week-1";
const DE_LEON_WEEK_2 = "de-leon-at-stamford-2026-week-2";

export function applyDeLeonStatCorrections(game: GameStats): GameStats {
  if (game.gameId === DE_LEON_WEEK_1) {
    return {
      ...game,
      sourceLabel: "MaxPreps — coach-designated official statistics",
      rushing: [
        ...game.rushing.filter((line) => line.schoolSlug !== "de-leon"),
        { player: "Lane Couch", schoolSlug: "de-leon", attempts: 14, yards: 351, touchdowns: 4 },
        { player: "Hud Price", schoolSlug: "de-leon", attempts: 3, yards: 12, touchdowns: 1 },
        { player: "Ed Garcia", schoolSlug: "de-leon", attempts: 2, yards: 15 },
      ],
      passing: [
        ...game.passing.filter((line) => line.schoolSlug !== "de-leon"),
        { player: "Hud Price", schoolSlug: "de-leon", completions: 8, attempts: 11, yards: 60, interceptions: 0, touchdowns: 1 },
        { player: "Beau Morris", schoolSlug: "de-leon", completions: 1, attempts: 1, yards: 4, interceptions: 0 },
      ],
      receiving: [
        ...game.receiving.filter((line) => line.schoolSlug !== "de-leon"),
        { player: "Lane Couch", schoolSlug: "de-leon", receptions: 1, yards: -4 },
        { player: "Trenton Zmeskal", schoolSlug: "de-leon", receptions: 1, yards: 10 },
        { player: "Bryce Burkeen", schoolSlug: "de-leon", receptions: 6, yards: 54, touchdowns: 1 },
        { player: "Alex Reyna", schoolSlug: "de-leon", receptions: 1, yards: 4 },
      ],
    };
  }

  if (game.gameId === DE_LEON_WEEK_2) {
    return {
      ...game,
      sourceLabel: "MaxPreps — coach-designated official statistics",
      rushing: [
        ...game.rushing.filter((line) => line.schoolSlug !== "de-leon"),
        { player: "Lane Couch", schoolSlug: "de-leon", attempts: 19, yards: 205, touchdowns: 2 },
        { player: "Bryce Burkeen", schoolSlug: "de-leon", attempts: 1, yards: 26 },
        { player: "Beau Morris", schoolSlug: "de-leon", attempts: 6, yards: 49 },
        { player: "Hud Price", schoolSlug: "de-leon", attempts: 5, yards: 51, touchdowns: 2 },
        { player: "Ed Garcia", schoolSlug: "de-leon", attempts: 8, yards: 39 },
      ],
      passing: [
        ...game.passing.filter((line) => line.schoolSlug !== "de-leon"),
        { player: "Hud Price", schoolSlug: "de-leon", completions: 9, attempts: 14, yards: 101, interceptions: 0, touchdowns: 3 },
        { player: "Beau Morris", schoolSlug: "de-leon", completions: 0, attempts: 2, yards: 0, interceptions: 0 },
      ],
      receiving: [
        ...game.receiving.filter((line) => line.schoolSlug !== "de-leon"),
        { player: "Trenton Zmeskal", schoolSlug: "de-leon", receptions: 4, yards: 44, touchdowns: 2 },
        { player: "Bryce Burkeen", schoolSlug: "de-leon", receptions: 5, yards: 57, touchdowns: 1 },
      ],
    };
  }

  return game;
}
