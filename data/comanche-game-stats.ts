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
];
