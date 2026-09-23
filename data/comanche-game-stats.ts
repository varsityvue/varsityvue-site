import type { GameStats } from "@/data/game-stats";

// Comanche Week 1 receiving attribution is incomplete in the supplied source:
// team passing is 6 completions for 135 yards, while listed receivers account
// for 3 receptions and 88 yards. Unattributed receiving stats are not invented.
export const comancheGameStats: GameStats[] = [
  {
    gameId: "breckenridge-at-comanche-2026-week-1",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "VarsityVue Verified Stats",
    quarterScores: [
      { schoolSlug: "breckenridge", quarters: [], total: 6 },
      { schoolSlug: "comanche", quarters: [], total: 28 },
    ],
    scoringPlays: [],
    teamStats: [
      { schoolSlug: "comanche", rushingAttempts: 29, rushingYards: 248, passingYards: 135, totalYards: 383, completions: 6, passAttempts: 10, interceptionsThrown: 0 },
    ],
    rushing: [
      { player: "Zaden Tello", schoolSlug: "comanche", attempts: 6, yards: 82, touchdowns: 0 },
      { player: "Adrian Guerrero", schoolSlug: "comanche", attempts: 1, yards: 1, touchdowns: 0 },
      { player: "Cooper Welch", schoolSlug: "comanche", attempts: 1, yards: 11, touchdowns: 0 },
      { player: "Ladanian Smith", schoolSlug: "comanche", attempts: 15, yards: 63, touchdowns: 2 },
      { player: "Nicolas Anaya", schoolSlug: "comanche", attempts: 6, yards: 91, touchdowns: 0 },
    ],
    passing: [
      { player: "Cooper Welch", schoolSlug: "comanche", completions: 6, attempts: 10, yards: 135, interceptions: 0, touchdowns: 2 },
    ],
    receiving: [
      { player: "Zaden Tello", schoolSlug: "comanche", receptions: 2, yards: 64, touchdowns: 1 },
      { player: "Adrian Guerrero", schoolSlug: "comanche", receptions: 1, yards: 24, touchdowns: 1 },
    ],
  },
  {
    gameId: "clyde-at-comanche-2026-week-3",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "Owner-supplied 2026 box score",
    quarterScores: [
      { schoolSlug: "clyde", quarters: [], total: 57 },
      { schoolSlug: "comanche", quarters: [], total: 21 },
    ],
    scoringPlays: [],
    teamStats: [
      { schoolSlug: "comanche", rushingAttempts: 29, rushingYards: 155, passingYards: 158, completions: 13, passAttempts: 22, interceptionsThrown: 1 },
    ],
    rushing: [
      { player: "Zaden Tello", schoolSlug: "comanche", attempts: 12, yards: 74, touchdowns: 1 },
      { player: "Cooper Welch", schoolSlug: "comanche", attempts: 1, yards: 8, touchdowns: 0 },
      { player: "Ladanian Smith", schoolSlug: "comanche", attempts: 16, yards: 73, touchdowns: 1 },
    ],
    passing: [
      { player: "Cooper Welch", schoolSlug: "comanche", completions: 13, attempts: 22, yards: 158, touchdowns: 1, interceptions: 1 },
    ],
    receiving: [
      { player: "Zaden Tello", schoolSlug: "comanche", receptions: 2, yards: 24, touchdowns: 0 },
      { player: "Elijah Ozuna", schoolSlug: "comanche", receptions: 3, yards: 47, touchdowns: 1 },
      { player: "Damian Aguilar", schoolSlug: "comanche", receptions: 2, yards: 14, touchdowns: 0 },
      { player: "Adrian Guerrero", schoolSlug: "comanche", receptions: 1, yards: 30, touchdowns: 0 },
      { player: "K. Keeter", schoolSlug: "comanche", receptions: 2, yards: 26, touchdowns: 0 },
      { player: "Adrian Molina", schoolSlug: "comanche", receptions: 1, yards: 10, touchdowns: 0 },
      { player: "Nicolas Anaya", schoolSlug: "comanche", receptions: 2, yards: 7, touchdowns: 0 },
    ],
  },
  {
    gameId: "comanche-at-clifton-2026-week-4",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "Owner-supplied 2026 box score",
    quarterScores: [
      { schoolSlug: "comanche", quarters: [7, 0, 7, 7], total: 21 },
      { schoolSlug: "clifton", quarters: [0, 0, 0, 14], total: 14 },
    ],
    scoringPlays: [],
    teamStats: [
      { schoolSlug: "comanche", rushingAttempts: 29, rushingYards: 179, passingYards: 76, completions: 7, passAttempts: 16, interceptionsThrown: 1 },
    ],
    rushing: [
      { player: "Zaden Tello", schoolSlug: "comanche", attempts: 9, yards: 108, touchdowns: 3 },
      { player: "Elijah Ozuna", schoolSlug: "comanche", attempts: 3, yards: 25, touchdowns: 0 },
      { player: "Cooper Welch", schoolSlug: "comanche", attempts: 1, yards: 1, touchdowns: 0 },
      { player: "Ladanian Smith", schoolSlug: "comanche", attempts: 14, yards: 44, touchdowns: 0 },
      { player: "Nicolas Anaya", schoolSlug: "comanche", attempts: 2, yards: 1, touchdowns: 0 },
    ],
    passing: [
      { player: "Zaden Tello", schoolSlug: "comanche", completions: 0, attempts: 1, yards: 0, touchdowns: 0, interceptions: 0 },
      { player: "Cooper Welch", schoolSlug: "comanche", completions: 7, attempts: 15, yards: 76, touchdowns: 0, interceptions: 1 },
    ],
    receiving: [
      { player: "Zaden Tello", schoolSlug: "comanche", receptions: 3, yards: 44, touchdowns: 0 },
      { player: "Elijah Ozuna", schoolSlug: "comanche", receptions: 1, yards: 16, touchdowns: 0 },
      { player: "L. Morgan", schoolSlug: "comanche", receptions: 1, yards: 7, touchdowns: 0 },
      { player: "Ladanian Smith", schoolSlug: "comanche", receptions: 1, yards: 2, touchdowns: 0 },
      { player: "Adrian Molina", schoolSlug: "comanche", receptions: 1, yards: 7, touchdowns: 0 },
    ],
  },
];
