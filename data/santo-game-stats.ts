import type { GameStats } from "@/data/game-stats";

// Santo quarter scoring is verified from the program-provided results.
// Individual and team statistics remain intentionally empty until supplied by the staff.
export const santoGameStats: GameStats[] = [
  {
    gameId: "santo-at-chilton-2026-week-1",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "Quarter scoring supplied to VarsityVue",
    quarterScores: [
      { schoolSlug: "santo", quarters: [14, 0, 8, 0], total: 22 },
      { schoolSlug: "chilton", quarters: [0, 7, 6, 0], total: 13 },
    ],
    scoringPlays: [],
    teamStats: [],
    rushing: [],
    passing: [],
    receiving: [],
  },
  {
    gameId: "santo-at-dublin-2026-week-2",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "Quarter scoring supplied to VarsityVue",
    quarterScores: [
      { schoolSlug: "santo", quarters: [20, 27, 14, 0], total: 61 },
      { schoolSlug: "dublin", quarters: [0, 0, 0, 0], total: 0 },
    ],
    scoringPlays: [],
    teamStats: [],
    rushing: [],
    passing: [],
    receiving: [],
  },
  {
    gameId: "haskell-at-santo-2026-week-3",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "Quarter scoring supplied to VarsityVue",
    quarterScores: [
      { schoolSlug: "haskell", quarters: [8, 16, 6, 14], total: 44 },
      { schoolSlug: "santo", quarters: [0, 21, 9, 12], total: 42 },
    ],
    scoringPlays: [],
    teamStats: [],
    rushing: [],
    passing: [],
    receiving: [],
  },
];
