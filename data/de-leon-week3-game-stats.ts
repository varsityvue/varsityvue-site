import type { GameStats } from "@/data/game-stats";

// Week 3 De Leon vs. Albany offense reconciled against the completed game
// statistical report supplied to VarsityVue. Missing production is not inferred.
export const deLeonWeek3GameStats: GameStats[] = [
  {
    gameId: "albany-at-de-leon-2026-week-3",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "De Leon Week 3 game statistical report supplied to VarsityVue",
    quarterScores: [
      { schoolSlug: "albany", quarters: [0, 0, 0, 7], total: 7 },
      { schoolSlug: "de-leon", quarters: [7, 7, 14, 14], total: 42 },
    ],
    scoringPlays: [],
    teamStats: [
      {
        schoolSlug: "de-leon",
        rushingAttempts: 30,
        rushingYards: 288,
        passingYards: 149,
        totalYards: 437,
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
        interceptionsThrown: 1,
      },
    ],
    rushing: [
      { player: "Lane Couch", schoolSlug: "de-leon", attempts: 19, yards: 215, touchdowns: 3 },
      { player: "Hud Price", schoolSlug: "de-leon", attempts: 3, yards: 23, touchdowns: 0 },
      { player: "Ed Garcia", schoolSlug: "de-leon", attempts: 8, yards: 50, touchdowns: 1 },
      { player: "Lyle Wheeler", schoolSlug: "albany", attempts: 3, yards: 7, touchdowns: 0 },
      { player: "Jakobi Roberson", schoolSlug: "albany", attempts: 20, yards: 84, touchdowns: 0 },
      { player: "Clay Chapman", schoolSlug: "albany", attempts: 12, yards: -1, touchdowns: 0 },
      { player: "Sam Tidwell", schoolSlug: "albany", attempts: 2, yards: 4, touchdowns: 0 },
    ],
    passing: [
      { player: "Hud Price", schoolSlug: "de-leon", completions: 17, attempts: 21, yards: 149, interceptions: 1, touchdowns: 2 },
      { player: "Clay Chapman", schoolSlug: "albany", completions: 11, attempts: 22, yards: 97, interceptions: 1, touchdowns: 1 },
    ],
    receiving: [
      { player: "Bryce Burkeen", schoolSlug: "de-leon", receptions: 13, yards: 103, touchdowns: 2 },
      { player: "Lane Couch", schoolSlug: "de-leon", receptions: 1, yards: 3, touchdowns: 0 },
      { player: "Trenton Zmeskal", schoolSlug: "de-leon", receptions: 2, yards: 18, touchdowns: 0 },
      { player: "Jayden Lindley", schoolSlug: "de-leon", receptions: 1, yards: 25, touchdowns: 0 },
      { player: "Blake Britting", schoolSlug: "albany", receptions: 6, yards: 58, touchdowns: 1 },
      { player: "Aiden Vickers", schoolSlug: "albany", receptions: 1, yards: 16, touchdowns: 0 },
      { player: "Jakobi Roberson", schoolSlug: "albany", receptions: 4, yards: 23, touchdowns: 0 },
    ],
  },
];
