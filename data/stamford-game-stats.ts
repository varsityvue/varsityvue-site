import type { GameStats } from "@/data/game-stats";

// Stamford Week 1: only Stamford offensive statistics were supplied.
// Haskell individual/team statistics were not provided, so they are intentionally
// omitted rather than inferred from another source.
export const stamfordGameStats: GameStats[] = [
  {
    gameId: "stamford-at-haskell-2026-week-1",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "VarsityVue Verified Stats",
    quarterScores: [
      { schoolSlug: "haskell", quarters: [], total: 62 },
      { schoolSlug: "stamford", quarters: [], total: 80 },
    ],
    scoringPlays: [],
    teamStats: [
      { schoolSlug: "stamford", rushingAttempts: 31, rushingYards: 406, passingYards: 363, totalYards: 769, completions: 17, passAttempts: 25, interceptionsThrown: 0 },
    ],
    rushing: [
      { player: "Miles Follis", schoolSlug: "stamford", attempts: 7, yards: 48 },
      { player: "Baylor Flow", schoolSlug: "stamford", attempts: 1, yards: 8 },
      { player: "Josh Andruch", schoolSlug: "stamford", attempts: 5, yards: 38 },
      { player: "Slayden Young", schoolSlug: "stamford", attempts: 2, yards: 54 },
      { player: "Christopher McCann", schoolSlug: "stamford", attempts: 8, yards: 112 },
      { player: "Brenham Walker", schoolSlug: "stamford", attempts: 8, yards: 146 },
    ],
    passing: [
      { player: "Miles Follis", schoolSlug: "stamford", completions: 17, attempts: 25, yards: 363, interceptions: 0, touchdowns: 5 },
    ],
    receiving: [
      { player: "Karsten Hall", schoolSlug: "stamford", receptions: 2, yards: 8 },
      { player: "Carlos Vega", schoolSlug: "stamford", receptions: 1, yards: 14 },
      { player: "Brennan Armstrong", schoolSlug: "stamford", receptions: 2, yards: 67 },
      { player: "Slayden Young", schoolSlug: "stamford", receptions: 9, yards: 215 },
      { player: "Levi Vahlenkamp", schoolSlug: "stamford", receptions: 2, yards: 29 },
      { player: "Ace Martinez", schoolSlug: "stamford", receptions: 1, yards: 30 },
    ],
  },
  {
    gameId: "stamford-at-hawley-2026-week-3",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "Published Stamford Week 3 game statistics",
    quarterScores: [
      { schoolSlug: "stamford", quarters: [], total: 42 },
      { schoolSlug: "hawley", quarters: [], total: 43 },
    ],
    scoringPlays: [],
    teamStats: [
      { schoolSlug: "stamford", rushingAttempts: 13, rushingYards: 55, passingYards: 350, totalYards: 405, completions: 24, passAttempts: 35, interceptionsThrown: 1 },
    ],
    rushing: [
      { player: "Miles Follis", schoolSlug: "stamford", attempts: 5, yards: 17 },
      { player: "Christopher McCann", schoolSlug: "stamford", attempts: 3, yards: 21 },
      { player: "Brenham Walker", schoolSlug: "stamford", attempts: 5, yards: 17 },
    ],
    passing: [
      { player: "Miles Follis", schoolSlug: "stamford", completions: 24, attempts: 35, yards: 350, interceptions: 1, touchdowns: 5 },
    ],
    receiving: [
      { player: "Brennan Armstrong", schoolSlug: "stamford", receptions: 2, yards: 48 },
      { player: "Slayden Young", schoolSlug: "stamford", receptions: 8, yards: 79 },
      { player: "Levi Vahlenkamp", schoolSlug: "stamford", receptions: 10, yards: 172 },
      { player: "Ace Martinez", schoolSlug: "stamford", receptions: 2, yards: 36 },
      { player: "Christopher McCann", schoolSlug: "stamford", receptions: 1, yards: 15 },
    ],
  },
];
