import type { GameStats } from "@/data/game-stats";

export const albanyGameStats: GameStats[] = [
  {
    gameId: "hawley-at-albany-2026-week-1",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "VarsityVue Verified Stats",
    quarterScores: [
      { schoolSlug: "hawley", quarters: [13, 6, 0, 8], total: 27 },
      { schoolSlug: "albany", quarters: [], total: 34 },
    ],
    scoringPlays: [],
    teamStats: [
      { schoolSlug: "albany", rushingAttempts: 33, rushingYards: 249, passingYards: 118, totalYards: 367, completions: 9, passAttempts: 16, interceptionsThrown: 0 },
    ],
    rushing: [
      { player: "Aiden Vickers", schoolSlug: "albany", attempts: 1, yards: 25, touchdowns: 0 },
      { player: "Lyle Wheeler", schoolSlug: "albany", attempts: 5, yards: 10, touchdowns: 0 },
      { player: "Jakobi Roberson", schoolSlug: "albany", attempts: 8, yards: 64, touchdowns: 1 },
      { player: "Clay Chapman", schoolSlug: "albany", attempts: 19, yards: 149, touchdowns: 1 },
      { player: "Zane Green", schoolSlug: "albany", attempts: 1, yards: 0, touchdowns: 0 },
    ],
    passing: [
      { player: "Clay Chapman", schoolSlug: "albany", completions: 9, attempts: 16, yards: 118, interceptions: 0, touchdowns: 3 },
    ],
    receiving: [
      { player: "Blake Britting", schoolSlug: "albany", receptions: 3, yards: 53, touchdowns: 0 },
      { player: "Aiden Vickers", schoolSlug: "albany", receptions: 3, yards: 48, touchdowns: 2 },
      { player: "Lyle Wheeler", schoolSlug: "albany", receptions: 2, yards: 7, touchdowns: 0 },
      { player: "Jakobi Roberson", schoolSlug: "albany", receptions: 1, yards: 10, touchdowns: 1 },
    ],
  },
  {
    gameId: "anson-at-albany-2026-week-2",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "VarsityVue Verified Stats",
    quarterScores: [
      { schoolSlug: "anson", quarters: [], total: 26 },
      { schoolSlug: "albany", quarters: [], total: 27 },
    ],
    scoringPlays: [],
    teamStats: [
      { schoolSlug: "albany", rushingAttempts: 24, rushingYards: 124, passingYards: 230, totalYards: 354, completions: 12, passAttempts: 18, interceptionsThrown: 1 },
    ],
    rushing: [
      { player: "Blake Britting", schoolSlug: "albany", attempts: 1, yards: 41, touchdowns: 0 },
      { player: "Lyle Wheeler", schoolSlug: "albany", attempts: 1, yards: -1, touchdowns: 0 },
      { player: "Jakobi Roberson", schoolSlug: "albany", attempts: 6, yards: 36, touchdowns: 0 },
      { player: "Clay Chapman", schoolSlug: "albany", attempts: 16, yards: 48, touchdowns: 1 },
    ],
    passing: [
      { player: "Clay Chapman", schoolSlug: "albany", completions: 12, attempts: 18, yards: 230, interceptions: 1, touchdowns: 3 },
    ],
    receiving: [
      { player: "Blake Britting", schoolSlug: "albany", receptions: 6, yards: 179, touchdowns: 2 },
      { player: "Aiden Vickers", schoolSlug: "albany", receptions: 3, yards: 35, touchdowns: 0 },
      { player: "Lyle Wheeler", schoolSlug: "albany", receptions: 1, yards: 8, touchdowns: 0 },
      { player: "Jakobi Roberson", schoolSlug: "albany", receptions: 2, yards: 8, touchdowns: 1 },
    ],
  },
];
