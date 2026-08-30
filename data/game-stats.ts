export type TeamStatLine = {
  schoolSlug: string;
  firstDowns?: number;
  rushingAttempts?: number;
  rushingYards?: number;
  passingYards?: number;
  totalYards?: number;
  completions?: number;
  passAttempts?: number;
  interceptionsThrown?: number;
  punts?: number;
  puntAverage?: number;
  fumbles?: number;
  fumblesLost?: number;
  penalties?: number;
  penaltyYards?: number;
};

export type RushingStatLine = {
  playerId?: string;
  player: string;
  schoolSlug: string;
  attempts: number;
  yards: number;
  touchdowns?: number;
};

export type PassingStatLine = {
  playerId?: string;
  player: string;
  schoolSlug: string;
  completions: number;
  attempts: number;
  yards: number;
  interceptions: number;
  touchdowns?: number;
};

export type ReceivingStatLine = {
  playerId?: string;
  player: string;
  schoolSlug: string;
  receptions: number;
  yards: number;
  touchdowns?: number;
};

export type ScoringPlay = {
  quarter: 1 | 2 | 3 | 4 | "OT";
  clock?: string;
  schoolSlug: string;
  description: string;
};

export type QuarterScore = {
  schoolSlug: string;
  quarters: number[];
  total: number;
};

export type GameStats = {
  gameId: string;
  season: number;
  sourceStatus: "verified";
  sourceLabel: string;
  quarterScores: QuarterScore[];
  scoringPlays: ScoringPlay[];
  teamStats: TeamStatLine[];
  rushing: RushingStatLine[];
  passing: PassingStatLine[];
  receiving: ReceivingStatLine[];
};

export const gameStats: GameStats[] = [
  {
    gameId: "san-saba-at-de-leon-2026-week-1",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "Statistics provided by the coaching staff",
    quarterScores: [
      { schoolSlug: "san-saba", quarters: [0, 0, 0, 7], total: 7 },
      { schoolSlug: "de-leon", quarters: [19, 7, 7, 7], total: 40 },
    ],
    scoringPlays: [
      { quarter: 1, clock: "9:53", schoolSlug: "de-leon", description: "Lane Couch 46-yard run (kick failed)" },
      { quarter: 1, clock: "7:26", schoolSlug: "de-leon", description: "Lane Couch 76-yard run (Trenton Zmeskal kick)" },
      { quarter: 1, clock: "4:54", schoolSlug: "de-leon", description: "Bryce Burkeen 23-yard pass from Hud Price (kick blocked)" },
      { quarter: 2, clock: "9:16", schoolSlug: "de-leon", description: "Hud Price 3-yard run (Trenton Zmeskal kick)" },
      { quarter: 3, clock: "5:52", schoolSlug: "de-leon", description: "Lane Couch 78-yard run (Trenton Zmeskal kick)" },
      { quarter: 4, clock: "10:19", schoolSlug: "san-saba", description: "Jason Everett 4-yard run (Noel Vega kick)" },
      { quarter: 4, clock: "10:08", schoolSlug: "de-leon", description: "Lane Couch 62-yard run (Trenton Zmeskal kick)" },
    ],
    teamStats: [
      {
        schoolSlug: "san-saba",
        firstDowns: 12,
        rushingAttempts: 48,
        rushingYards: 202,
        passingYards: 0,
        totalYards: 202,
        completions: 0,
        passAttempts: 4,
        interceptionsThrown: 0,
        punts: 3,
        puntAverage: 37,
        fumbles: 1,
        fumblesLost: 1,
        penalties: 6,
        penaltyYards: 50,
      },
      {
        schoolSlug: "de-leon",
        firstDowns: 17,
        rushingAttempts: 23,
        rushingYards: 383,
        passingYards: 66,
        totalYards: 449,
        completions: 9,
        passAttempts: 17,
        interceptionsThrown: 0,
        punts: 0,
        puntAverage: 0,
        fumbles: 0,
        fumblesLost: 0,
        penalties: 3,
        penaltyYards: 25,
      },
    ],
    rushing: [
      { player: "Enrique Mendoza", schoolSlug: "san-saba", attempts: 14, yards: 71 },
      { player: "Graden Lebow", schoolSlug: "san-saba", attempts: 10, yards: 70 },
      { player: "Jason Everett", schoolSlug: "san-saba", attempts: 19, yards: 55, touchdowns: 1 },
      { player: "Jayden Aguirre", schoolSlug: "san-saba", attempts: 2, yards: 11 },
      { player: "Melvin Umble", schoolSlug: "san-saba", attempts: 1, yards: 4 },
      { player: "JJ Romero", schoolSlug: "san-saba", attempts: 2, yards: -9 },
      { player: "Lane Couch", schoolSlug: "de-leon", attempts: 14, yards: 348, touchdowns: 4 },
      { player: "Ed Garcia", schoolSlug: "de-leon", attempts: 2, yards: 16 },
      { player: "Hud Price", schoolSlug: "de-leon", attempts: 5, yards: 9, touchdowns: 1 },
      { player: "Beau Morris", schoolSlug: "de-leon", attempts: 1, yards: 8 },
      { player: "Bryce Burkeen", schoolSlug: "de-leon", attempts: 1, yards: 2 },
    ],
    passing: [
      { player: "JJ Romero", schoolSlug: "san-saba", completions: 0, attempts: 3, yards: 0, interceptions: 0 },
      { player: "Jason Everett", schoolSlug: "san-saba", completions: 0, attempts: 1, yards: 0, interceptions: 0 },
      { player: "Hud Price", schoolSlug: "de-leon", completions: 8, attempts: 16, yards: 60, interceptions: 0, touchdowns: 1 },
      { player: "Beau Morris", schoolSlug: "de-leon", completions: 1, attempts: 1, yards: 6, interceptions: 0 },
    ],
    receiving: [
      { player: "Bryce Burkeen", schoolSlug: "de-leon", receptions: 6, yards: 54, touchdowns: 1 },
      { player: "Trenton Zmeskal", schoolSlug: "de-leon", receptions: 1, yards: 10 },
      { player: "Alex Reyna", schoolSlug: "de-leon", receptions: 1, yards: 6 },
      { player: "Lane Couch", schoolSlug: "de-leon", receptions: 1, yards: -4 },
    ],
  },
];
