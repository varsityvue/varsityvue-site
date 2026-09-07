import type { GameStats } from "@/data/game-stats";

export const stephenvilleGameStats: GameStats[] = [
  {
    gameId: "midlothian-heritage-at-stephenville-2026-week-1",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "VarsityVue Verified Stats",
    quarterScores: [
      { schoolSlug: "midlothian-heritage", quarters: [14, 7, 0, 0], total: 21 },
      { schoolSlug: "stephenville", quarters: [14, 10, 13, 7], total: 44 },
    ],
    scoringPlays: [],
    teamStats: [
      { schoolSlug: "stephenville", rushingAttempts: 22, rushingYards: 93, passingYards: 378, totalYards: 471, completions: 18, passAttempts: 29, interceptionsThrown: 0 },
    ],
    rushing: [
      { player: "Zyler McClendon", schoolSlug: "stephenville", attempts: 15, yards: 50, touchdowns: 1 },
      { player: "Caleb Gleason", schoolSlug: "stephenville", attempts: 1, yards: 0, touchdowns: 0 },
      { player: "Trot Jordan", schoolSlug: "stephenville", attempts: 6, yards: 43, touchdowns: 1 },
    ],
    passing: [
      { player: "Grayson Copeland", schoolSlug: "stephenville", completions: 0, attempts: 1, yards: 0, interceptions: 0, touchdowns: 0 },
      { player: "Trot Jordan", schoolSlug: "stephenville", completions: 18, attempts: 28, yards: 378, interceptions: 0, touchdowns: 3 },
    ],
    receiving: [
      { player: "Zyler McClendon", schoolSlug: "stephenville", receptions: 1, yards: 8, touchdowns: 0 },
      { player: "Jhett Banuelos", schoolSlug: "stephenville", receptions: 1, yards: 41, touchdowns: 0 },
      { player: "Adan Jergins", schoolSlug: "stephenville", receptions: 4, yards: 78, touchdowns: 2 },
      { player: "Caden Monk", schoolSlug: "stephenville", receptions: 11, yards: 242, touchdowns: 1 },
      { player: "Kendall Douglas", schoolSlug: "stephenville", receptions: 1, yards: 9, touchdowns: 0 },
    ],
  },
  {
    gameId: "stephenville-at-brownwood-2026-week-2",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "VarsityVue Verified Stats",
    quarterScores: [
      { schoolSlug: "stephenville", quarters: [7, 0, 7, 14], total: 28 },
      { schoolSlug: "brownwood", quarters: [7, 7, 0, 10], total: 24 },
    ],
    scoringPlays: [],
    teamStats: [
      { schoolSlug: "stephenville", rushingAttempts: 42, rushingYards: 299, passingYards: 167, totalYards: 466, completions: 10, passAttempts: 18, interceptionsThrown: 2 },
    ],
    rushing: [
      { player: "Zyler McClendon", schoolSlug: "stephenville", attempts: 35, yards: 255, touchdowns: 2 },
      { player: "Caleb Gleason", schoolSlug: "stephenville", attempts: 1, yards: 12, touchdowns: 0 },
      { player: "Trot Jordan", schoolSlug: "stephenville", attempts: 6, yards: 32, touchdowns: 0 },
    ],
    passing: [
      { player: "Trot Jordan", schoolSlug: "stephenville", completions: 10, attempts: 18, yards: 167, interceptions: 2, touchdowns: 2 },
    ],
    receiving: [
      { player: "Zyler McClendon", schoolSlug: "stephenville", receptions: 2, yards: 15, touchdowns: 0 },
      { player: "Jhett Banuelos", schoolSlug: "stephenville", receptions: 1, yards: 4, touchdowns: 0 },
      { player: "Adan Jergins", schoolSlug: "stephenville", receptions: 1, yards: 22, touchdowns: 0 },
      { player: "Pecos Tally", schoolSlug: "stephenville", receptions: 2, yards: 22, touchdowns: 1 },
      { player: "Caden Monk", schoolSlug: "stephenville", receptions: 4, yards: 104, touchdowns: 1 },
    ],
  },
];
