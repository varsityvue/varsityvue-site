import type { GameStats } from "@/data/game-stats";

// Week 3 De Leon vs. Albany statistics used in the published VarsityVue feature.
// Individual lines are included where verified from the completed game stats.
export const deLeonWeek3GameStats: GameStats[] = [
  {
    gameId: "albany-at-de-leon-2026-week-3",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "VarsityVue Verified Stats",
    quarterScores: [
      { schoolSlug: "albany", quarters: [0, 0, 0, 7], total: 7 },
      { schoolSlug: "de-leon", quarters: [7, 7, 14, 14], total: 42 },
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
        rushingAttempts: 37,
        rushingYards: 94,
        passingYards: 97,
        totalYards: 191,
        completions: 11,
        passAttempts: 22,
      },
    ],
    rushing: [
      { player: "Lane Couch", schoolSlug: "de-leon", attempts: 19, yards: 215, touchdowns: 3 },
      { player: "Ed Garcia", schoolSlug: "de-leon", attempts: 8, yards: 53, touchdowns: 1 },
      { player: "Lyle Wheeler", schoolSlug: "albany", attempts: 3, yards: 7, touchdowns: 0 },
      { player: "Jakobi Roberson", schoolSlug: "albany", attempts: 20, yards: 84, touchdowns: 0 },
      { player: "Clay Chapman", schoolSlug: "albany", attempts: 12, yards: -1, touchdowns: 0 },
      { player: "S. Tidwell", schoolSlug: "albany", attempts: 2, yards: 4, touchdowns: 0 },
    ],
    passing: [
      { player: "Hud Price", schoolSlug: "de-leon", completions: 17, attempts: 21, yards: 158, interceptions: 1, touchdowns: 2 },
      // Albany's team passing line is verified at 11-of-22 for 97 yards and 1 TD.
      // The source did not report an interception total for Clay Chapman, so the
      // individual passing line is intentionally withheld rather than inferring 0.
    ],
    receiving: [
      { player: "Bryce Burkeen", schoolSlug: "de-leon", receptions: 13, yards: 104, touchdowns: 2 },
      { player: "Blake Britting", schoolSlug: "albany", receptions: 6, yards: 58, touchdowns: 1 },
      { player: "Aiden Vickers", schoolSlug: "albany", receptions: 1, yards: 16, touchdowns: 0 },
      { player: "Jakobi Roberson", schoolSlug: "albany", receptions: 4, yards: 23, touchdowns: 0 },
    ],
  },
];
