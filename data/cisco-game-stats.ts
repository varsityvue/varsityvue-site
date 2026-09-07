import type { GameStats } from "@/data/game-stats";

export const ciscoGameStats: GameStats[] = [
  {
    gameId: "clyde-at-cisco-2026-week-1",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "VarsityVue Verified Stats",
    quarterScores: [
      { schoolSlug: "clyde", quarters: [], total: 27 },
      { schoolSlug: "cisco", quarters: [], total: 24 },
    ],
    scoringPlays: [],
    teamStats: [
      { schoolSlug: "cisco", rushingAttempts: 29, rushingYards: 103, passingYards: 200, totalYards: 303, completions: 11, passAttempts: 18, interceptionsThrown: 0 },
    ],
    rushing: [
      { player: "Corbin Harrison", schoolSlug: "cisco", attempts: 1, yards: -4, touchdowns: 0 },
      { player: "Landry Vosburg", schoolSlug: "cisco", attempts: 9, yards: 64, touchdowns: 0 },
      { player: "July Johnson", schoolSlug: "cisco", attempts: 4, yards: 27, touchdowns: 0 },
      { player: "Colby McIlroy", schoolSlug: "cisco", attempts: 14, yards: 17, touchdowns: 1 },
      { player: "Hudson Hernandez", schoolSlug: "cisco", attempts: 1, yards: -1, touchdowns: 0 },
    ],
    passing: [
      { player: "Colby McIlroy", schoolSlug: "cisco", completions: 11, attempts: 18, yards: 200, interceptions: 0, touchdowns: 2 },
    ],
    receiving: [
      { player: "Corbin Harrison", schoolSlug: "cisco", receptions: 3, yards: 21, touchdowns: 0 },
      { player: "Gage Johnson", schoolSlug: "cisco", receptions: 2, yards: 19, touchdowns: 0 },
      { player: "Cannon Harris", schoolSlug: "cisco", receptions: 1, yards: 41, touchdowns: 0 },
      { player: "Landry Vosburg", schoolSlug: "cisco", receptions: 1, yards: 15, touchdowns: 0 },
      { player: "July Johnson", schoolSlug: "cisco", receptions: 1, yards: 14, touchdowns: 1 },
      { player: "Carter Toof", schoolSlug: "cisco", receptions: 2, yards: 75, touchdowns: 1 },
      { player: "Terrick Hernandez", schoolSlug: "cisco", receptions: 1, yards: 15, touchdowns: 0 },
    ],
  },
  {
    gameId: "comanche-at-cisco-2026-week-2",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "VarsityVue Verified Stats",
    quarterScores: [
      { schoolSlug: "comanche", quarters: [0, 6, 0, 0], total: 6 },
      { schoolSlug: "cisco", quarters: [7, 17, 0, 14], total: 38 },
    ],
    scoringPlays: [],
    teamStats: [
      { schoolSlug: "cisco", rushingAttempts: 38, rushingYards: 234, passingYards: 200, totalYards: 434, completions: 11, passAttempts: 17, interceptionsThrown: 0 },
    ],
    rushing: [
      { player: "Corbin Harrison", schoolSlug: "cisco", attempts: 3, yards: 31, touchdowns: 0 },
      { player: "Landry Vosburg", schoolSlug: "cisco", attempts: 15, yards: 102, touchdowns: 1 },
      { player: "July Johnson", schoolSlug: "cisco", attempts: 7, yards: 76, touchdowns: 1 },
      { player: "Colby McIlroy", schoolSlug: "cisco", attempts: 13, yards: 25, touchdowns: 1 },
    ],
    passing: [
      { player: "Colby McIlroy", schoolSlug: "cisco", completions: 11, attempts: 17, yards: 200, interceptions: 0, touchdowns: 2 },
    ],
    receiving: [
      { player: "Gage Johnson", schoolSlug: "cisco", receptions: 1, yards: 18, touchdowns: 0 },
      { player: "Cannon Harris", schoolSlug: "cisco", receptions: 6, yards: 84, touchdowns: 2 },
      { player: "Carter Toof", schoolSlug: "cisco", receptions: 3, yards: 71, touchdowns: 0 },
      { player: "Terrick Hernandez", schoolSlug: "cisco", receptions: 1, yards: 27, touchdowns: 0 },
    ],
  },
];
