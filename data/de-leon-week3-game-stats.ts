import type { GameStats } from "@/data/game-stats";

// Week 3 De Leon vs. Albany statistics used in the published VarsityVue feature.
// Only individual lines that were verified for the story are included here;
// team totals preserve the complete offensive totals from the game.
export const deLeonWeek3GameStats: GameStats[] = [
  {
    gameId: "albany-at-de-leon-2026-week-3",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "VarsityVue Verified Stats",
    quarterScores: [
      { schoolSlug: "albany", quarters: [], total: 7 },
      { schoolSlug: "de-leon", quarters: [], total: 42 },
    ],
    scoringPlays: [],
    teamStats: [
      {
        schoolSlug: "de-leon",
        rushingAttempts: 30,
        rushingYards: 291,
        passingYards: 158,
        totalYards: 449,
        completions: 17,
        passAttempts: 21,
        interceptionsThrown: 1,
      },
      {
        schoolSlug: "albany",
        totalYards: 191,
      },
    ],
    rushing: [
      { player: "Lane Couch", schoolSlug: "de-leon", attempts: 19, yards: 215, touchdowns: 3 },
      { player: "Ed Garcia", schoolSlug: "de-leon", attempts: 8, yards: 53, touchdowns: 1 },
    ],
    passing: [
      { player: "Hud Price", schoolSlug: "de-leon", completions: 17, attempts: 21, yards: 158, interceptions: 1, touchdowns: 2 },
    ],
    receiving: [
      { player: "Bryce Burkeen", schoolSlug: "de-leon", receptions: 13, yards: 104, touchdowns: 2 },
    ],
  },
];
