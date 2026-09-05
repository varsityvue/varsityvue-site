import type { GameStats } from "@/data/game-stats";

export const week2GameStats: GameStats[] = [
  {
    gameId: "de-leon-at-stamford-2026-week-2",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "Published game statistics provided to VarsityVue",
    quarterScores: [
      { schoolSlug: "de-leon", quarters: [7, 36, 14, 0], total: 57 },
      { schoolSlug: "stamford", quarters: [0, 0, 7, 0], total: 7 },
    ],
    scoringPlays: [],
    teamStats: [
      {
        schoolSlug: "de-leon",
        rushingAttempts: 38,
        rushingYards: 344,
        passingYards: 101,
        totalYards: 445,
        completions: 9,
        passAttempts: 14,
        interceptionsThrown: 0,
      },
    ],
    rushing: [
      { player: "Lane Couch", schoolSlug: "de-leon", attempts: 19, yards: 205, touchdowns: 2 },
      { player: "Beau Morris", schoolSlug: "de-leon", attempts: 6, yards: 49 },
      { player: "Hud Price", schoolSlug: "de-leon", attempts: 5, yards: 51, touchdowns: 2 },
      { player: "Ed Garcia", schoolSlug: "de-leon", attempts: 8, yards: 39 },
    ],
    passing: [
      { player: "Hud Price", schoolSlug: "de-leon", completions: 9, attempts: 14, yards: 101, interceptions: 0, touchdowns: 3 },
    ],
    receiving: [
      { player: "Trenton Zmeskal", schoolSlug: "de-leon", receptions: 5, yards: 49, touchdowns: 2 },
      { player: "Bryce Burkeen", schoolSlug: "de-leon", receptions: 5, yards: 57, touchdowns: 1 },
    ],
  },
  {
    gameId: "stephenville-at-brownwood-2026-week-2",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "Published MaxPreps game statistics",
    quarterScores: [
      { schoolSlug: "stephenville", quarters: [7, 0, 7, 14], total: 28 },
      { schoolSlug: "brownwood", quarters: [7, 7, 0, 10], total: 24 },
    ],
    scoringPlays: [],
    teamStats: [
      {
        schoolSlug: "stephenville",
        rushingAttempts: 42,
        rushingYards: 299,
        passingYards: 167,
        totalYards: 466,
        completions: 10,
        passAttempts: 18,
        interceptionsThrown: 2,
        fumbles: 2,
        fumblesLost: 2,
      },
    ],
    rushing: [
      { player: "Zyler McClendon", schoolSlug: "stephenville", attempts: 35, yards: 255, touchdowns: 2 },
      { player: "Caleb Gleason", schoolSlug: "stephenville", attempts: 1, yards: 12 },
      { player: "Trot Jordan", schoolSlug: "stephenville", attempts: 6, yards: 32 },
    ],
    passing: [
      { player: "Trot Jordan", schoolSlug: "stephenville", completions: 10, attempts: 18, yards: 167, interceptions: 2, touchdowns: 2 },
    ],
    receiving: [
      { player: "Zyler McClendon", schoolSlug: "stephenville", receptions: 2, yards: 15 },
      { player: "Jhett Banuelos", schoolSlug: "stephenville", receptions: 1, yards: 4 },
      { player: "Adan Jergins", schoolSlug: "stephenville", receptions: 1, yards: 22 },
      { player: "Pecos Tally", schoolSlug: "stephenville", receptions: 2, yards: 22, touchdowns: 1 },
      { player: "Caden Monk", schoolSlug: "stephenville", receptions: 4, yards: 104, touchdowns: 1 },
    ],
  },
];
