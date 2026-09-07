import type { GameStats } from "@/data/game-stats";

// Stamford Week 1: only Stamford offensive statistics were supplied.
// Haskell individual/team statistics were not provided, so they are intentionally
// omitted rather than inferred from another source.
export const stamfordGameStats: GameStats[] = [
  {
    gameId: "haskell-at-stamford-2026-week-1",
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
      { player: "B. Flow", schoolSlug: "stamford", attempts: 1, yards: 8 },
      { player: "Josh Andruch", schoolSlug: "stamford", attempts: 5, yards: 38 },
      { player: "Slayden Young", schoolSlug: "stamford", attempts: 2, yards: 54 },
      { player: "Chris McCann", schoolSlug: "stamford", attempts: 8, yards: 112 },
      { player: "Brenham Walker", schoolSlug: "stamford", attempts: 8, yards: 146 },
    ],
    passing: [
      { player: "Miles Follis", schoolSlug: "stamford", completions: 17, attempts: 25, yards: 363, interceptions: 0, touchdowns: 5 },
    ],
    receiving: [
      { player: "Karsten Hall", schoolSlug: "stamford", receptions: 2, yards: 8 },
      { player: "C. Vega", schoolSlug: "stamford", receptions: 1, yards: 14 },
      { player: "Brennan Armstrong", schoolSlug: "stamford", receptions: 2, yards: 67 },
      { player: "Slayden Young", schoolSlug: "stamford", receptions: 9, yards: 215 },
      { player: "Levi Vahlenkamp", schoolSlug: "stamford", receptions: 2, yards: 29 },
      { player: "Ace Martinez", schoolSlug: "stamford", receptions: 1, yards: 30 },
    ],
  },
];
