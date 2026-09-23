import type { GameStats } from "@/data/game-stats";

export const ownerWeek4OffensiveStats: GameStats[] = [
  {
    gameId: "stephenville-at-abilene-wylie-2026-week-4",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "Owner-supplied 2026 box score",
    quarterScores: [
      { schoolSlug: "stephenville", quarters: [7, 14, 0, 21], total: 42 },
      { schoolSlug: "abilene-wylie", quarters: [3, 7, 6, 7], total: 23 },
    ],
    scoringPlays: [],
    teamStats: [
      { schoolSlug: "stephenville", rushingAttempts: 33, rushingYards: 254, passingYards: 197, totalYards: 451, completions: 18, passAttempts: 25, interceptionsThrown: 1 },
    ],
    rushing: [
      { player: "Zyler McClendon", schoolSlug: "stephenville", attempts: 26, yards: 204, touchdowns: 1 },
      { player: "Caleb Gleason", schoolSlug: "stephenville", attempts: 3, yards: 16, touchdowns: 0 },
      { player: "Trot Jordan", schoolSlug: "stephenville", attempts: 4, yards: 34, touchdowns: 1 },
    ],
    passing: [
      { player: "Trot Jordan", schoolSlug: "stephenville", completions: 18, attempts: 25, yards: 197, touchdowns: 4, interceptions: 1 },
    ],
    receiving: [
      { player: "Zyler McClendon", schoolSlug: "stephenville", receptions: 1, yards: 3, touchdowns: 0 },
      { player: "Adan Jergins", schoolSlug: "stephenville", receptions: 4, yards: 53, touchdowns: 1 },
      { player: "Pecos Tally", schoolSlug: "stephenville", receptions: 2, yards: 25, touchdowns: 1 },
      { player: "Caden Monk", schoolSlug: "stephenville", receptions: 10, yards: 107, touchdowns: 2 },
      { player: "Kendall Douglas", schoolSlug: "stephenville", receptions: 1, yards: 9, touchdowns: 0 },
    ],
  },
  {
    gameId: "de-leon-at-goldthwaite-2026-week-4",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "Owner-supplied 2026 box score",
    quarterScores: [
      { schoolSlug: "de-leon", quarters: [0, 7, 0, 6], total: 13 },
      { schoolSlug: "goldthwaite", quarters: [7, 0, 3, 14], total: 24 },
    ],
    scoringPlays: [],
    teamStats: [
      { schoolSlug: "de-leon", rushingAttempts: 41, rushingYards: 220, passingYards: 106, totalYards: 326, completions: 16, passAttempts: 30, interceptionsThrown: 0 },
      { schoolSlug: "goldthwaite", passingYards: 61, completions: 6, passAttempts: 11, interceptionsThrown: 1 },
    ],
    rushing: [
      { player: "Lane Couch", schoolSlug: "de-leon", attempts: 23, yards: 103, touchdowns: 0 },
      { player: "Bryce Burkeen", schoolSlug: "de-leon", attempts: 5, yards: 36, touchdowns: 0 },
      { player: "Hud Price", schoolSlug: "de-leon", attempts: 10, yards: 68, touchdowns: 0 },
      { player: "Ed Garcia", schoolSlug: "de-leon", attempts: 3, yards: 13, touchdowns: 0 },
      { player: "Landry Sanderson", schoolSlug: "goldthwaite", attempts: 16, yards: 195, touchdowns: 1 },
      { player: "Hayes Greenway", schoolSlug: "goldthwaite", attempts: 8, yards: 65, touchdowns: 2 },
    ],
    passing: [
      { player: "Hud Price", schoolSlug: "de-leon", completions: 16, attempts: 30, yards: 106, touchdowns: 2, interceptions: 0 },
      { player: "Hayes Greenway", schoolSlug: "goldthwaite", completions: 6, attempts: 11, yards: 61, touchdowns: 0, interceptions: 1 },
    ],
    receiving: [
      { player: "Bentley Lingle", playerId: "de-leon-bentley-lingle-2026", schoolSlug: "de-leon", receptions: 2, yards: 11, touchdowns: 0 },
      { player: "Trenton Zmeskal", schoolSlug: "de-leon", receptions: 5, yards: 43, touchdowns: 1 },
      { player: "Bryce Burkeen", schoolSlug: "de-leon", receptions: 8, yards: 41, touchdowns: 0 },
      { player: "Jayden Lindley", schoolSlug: "de-leon", receptions: 1, yards: 11, touchdowns: 1 },
      { player: "Blake Howard", schoolSlug: "goldthwaite", receptions: 3, yards: 48, touchdowns: 0 },
      { player: "Aidyn Lee", schoolSlug: "goldthwaite", receptions: 2, yards: 3, touchdowns: 0 },
      { player: "Landry Sanderson", schoolSlug: "goldthwaite", receptions: 1, yards: 10, touchdowns: 0 },
    ],
  },
];
