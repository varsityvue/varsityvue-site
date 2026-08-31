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
  {
    gameId: "hawley-at-albany-2026-week-1",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "Published game statistics provided to VarsityVue",
    quarterScores: [
      { schoolSlug: "hawley", quarters: [13, 6, 0, 9], total: 27 },
      { schoolSlug: "albany", quarters: [7, 14, 13, 0], total: 34 },
    ],
    scoringPlays: [
      { quarter: 1, clock: "11:09", schoolSlug: "hawley", description: "John Doerschuk 66-yard pass from Jagger Wiley (Wiley kick)" },
      { quarter: 1, clock: "8:17", schoolSlug: "albany", description: "Aiden Vickers 8-yard pass from Clay Chapman (Zane Green kick)" },
      { quarter: 1, clock: "4:41", schoolSlug: "hawley", description: "Brycen Stofel 8-yard run (kick failed)" },
      { quarter: 2, clock: "8:35", schoolSlug: "hawley", description: "Brycen Stofel 36-yard run (run failed)" },
      { quarter: 2, clock: "6:00", schoolSlug: "albany", description: "Jakobi Roberson 32-yard run (Zane Green kick)" },
      { quarter: 2, clock: "0:32", schoolSlug: "albany", description: "Aiden Vickers 31-yard pass from Clay Chapman (Zane Green kick)" },
      { quarter: 3, clock: "8:40", schoolSlug: "albany", description: "Jakobi Roberson 10-yard pass from Clay Chapman (kick failed)" },
      { quarter: 3, clock: "3:02", schoolSlug: "albany", description: "Clay Chapman 13-yard run (Zane Green kick)" },
      { quarter: 4, clock: "5:45", schoolSlug: "hawley", description: "Brycen Stofel 1-yard run (run failed)" },
      { quarter: 4, clock: "1:54", schoolSlug: "hawley", description: "Safety, Albany holding in end zone" },
    ],
    teamStats: [
      {
        schoolSlug: "hawley",
        firstDowns: 21,
        rushingAttempts: 35,
        rushingYards: 231,
        passingYards: 239,
        totalYards: 470,
        completions: 11,
        passAttempts: 23,
        interceptionsThrown: 1,
        punts: 1,
        puntAverage: 39,
        fumbles: 2,
        fumblesLost: 2,
        penalties: 9,
        penaltyYards: 70,
      },
      {
        schoolSlug: "albany",
        firstDowns: 20,
        rushingAttempts: 34,
        rushingYards: 217,
        passingYards: 144,
        totalYards: 361,
        completions: 11,
        passAttempts: 18,
        interceptionsThrown: 0,
        punts: 2,
        puntAverage: 30,
        fumbles: 2,
        fumblesLost: 0,
        penalties: 8,
        penaltyYards: 48,
      },
    ],
    rushing: [
      { player: "Brycen Stofel", schoolSlug: "hawley", attempts: 19, yards: 158, touchdowns: 3 },
      { player: "Jagger Wiley", schoolSlug: "hawley", attempts: 16, yards: 73 },
      { player: "Clay Chapman", schoolSlug: "albany", attempts: 19, yards: 146, touchdowns: 1 },
      { player: "Jakobi Roberson", schoolSlug: "albany", attempts: 9, yards: 68, touchdowns: 1 },
      { player: "Lyle Wheeler", schoolSlug: "albany", attempts: 3, yards: 7 },
      { player: "Team", schoolSlug: "albany", attempts: 3, yards: -4 },
    ],
    passing: [
      { player: "Jagger Wiley", schoolSlug: "hawley", completions: 11, attempts: 22, yards: 239, interceptions: 1, touchdowns: 1 },
      { player: "Team", schoolSlug: "hawley", completions: 0, attempts: 1, yards: 0, interceptions: 0 },
      { player: "Clay Chapman", schoolSlug: "albany", completions: 11, attempts: 18, yards: 144, interceptions: 0, touchdowns: 3 },
    ],
    receiving: [
      { player: "John Doerschuk", schoolSlug: "hawley", receptions: 6, yards: 134, touchdowns: 1 },
      { player: "Camden Ables", schoolSlug: "hawley", receptions: 2, yards: 66 },
      { player: "Weston Womack", schoolSlug: "hawley", receptions: 2, yards: 35 },
      { player: "Braylen Williams", schoolSlug: "hawley", receptions: 1, yards: 4 },
      { player: "Aiden Vickers", schoolSlug: "albany", receptions: 4, yards: 73, touchdowns: 2 },
      { player: "Blake Britting", schoolSlug: "albany", receptions: 3, yards: 51 },
      { player: "Lyle Wheeler", schoolSlug: "albany", receptions: 3, yards: 10 },
      { player: "Jakobi Roberson", schoolSlug: "albany", receptions: 1, yards: 10, touchdowns: 1 },
    ],
  },
  {
    gameId: "cisco-at-clyde-2026-week-1",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "Published game statistics provided to VarsityVue",
    quarterScores: [
      { schoolSlug: "cisco", quarters: [3, 14, 7, 0], total: 24 },
      { schoolSlug: "clyde", quarters: [14, 0, 7, 6], total: 27 },
    ],
    scoringPlays: [
      { quarter: 1, clock: "11:47", schoolSlug: "clyde", description: "Hunter Dematties 94-yard kickoff return (Cole Copher kick)" },
      { quarter: 1, schoolSlug: "cisco", description: "Terrick Hernandez 33-yard field goal" },
      { quarter: 1, clock: "4:33", schoolSlug: "clyde", description: "Harley Griffin 65-yard pass from Devan Wright (Cole Copher kick)" },
      { quarter: 2, clock: "6:29", schoolSlug: "cisco", description: "July Johnson 11-yard pass from Colby McIlroy (Terrick Hernandez kick)" },
      { quarter: 2, clock: "1:18", schoolSlug: "cisco", description: "Colby McIlroy 9-yard run (Terrick Hernandez kick)" },
      { quarter: 3, clock: "8:48", schoolSlug: "cisco", description: "Carter Toof 27-yard pass from Colby McIlroy (Terrick Hernandez kick)" },
      { quarter: 3, clock: "2:05", schoolSlug: "clyde", description: "Devan Wright 8-yard run (Cole Copher kick)" },
      { quarter: 4, clock: "5:20", schoolSlug: "clyde", description: "Jacob Hernandez 5-yard pass from Devan Wright (extra point)" },
    ],
    teamStats: [
      {
        schoolSlug: "cisco",
        firstDowns: 10,
        rushingAttempts: 30,
        rushingYards: 129,
        passingYards: 213,
        totalYards: 342,
        completions: 11,
        passAttempts: 19,
        interceptionsThrown: 0,
        punts: 1,
        puntAverage: 40,
        fumbles: 2,
        fumblesLost: 1,
        penalties: 8,
        penaltyYards: 55,
      },
      {
        schoolSlug: "clyde",
        firstDowns: 16,
        rushingAttempts: 36,
        rushingYards: 239,
        passingYards: 196,
        totalYards: 435,
        completions: 9,
        passAttempts: 15,
        interceptionsThrown: 0,
        punts: 1,
        puntAverage: 7,
        fumbles: 0,
        fumblesLost: 0,
        penalties: 6,
        penaltyYards: 45,
      },
    ],
    rushing: [
      { player: "Landry Vosburg", schoolSlug: "cisco", attempts: 9, yards: 71 },
      { player: "Colby McIlroy", schoolSlug: "cisco", attempts: 14, yards: 32, touchdowns: 1 },
      { player: "July Johnson", schoolSlug: "cisco", attempts: 4, yards: 27 },
      { player: "Carter Toof", schoolSlug: "cisco", attempts: 1, yards: 4 },
      { player: "Corbin Harrison", schoolSlug: "cisco", attempts: 1, yards: -4 },
      { player: "Team", schoolSlug: "cisco", attempts: 1, yards: -1 },
      { player: "Devan Wright", schoolSlug: "clyde", attempts: 25, yards: 128, touchdowns: 1 },
      { player: "Harley Griffin", schoolSlug: "clyde", attempts: 4, yards: 70 },
      { player: "Hunter Dematties", schoolSlug: "clyde", attempts: 2, yards: 25 },
      { player: "Miles Wilsher", schoolSlug: "clyde", attempts: 2, yards: 18 },
      { player: "Brady Sanders", schoolSlug: "clyde", attempts: 2, yards: 0 },
      { player: "Jacob Hernandez", schoolSlug: "clyde", attempts: 1, yards: -2 },
    ],
    passing: [
      { player: "Colby McIlroy", schoolSlug: "cisco", completions: 11, attempts: 19, yards: 213, interceptions: 0, touchdowns: 2 },
      { player: "Devan Wright", schoolSlug: "clyde", completions: 9, attempts: 15, yards: 196, interceptions: 0, touchdowns: 2 },
    ],
    receiving: [
      { player: "Gage Johnson", schoolSlug: "cisco", receptions: 2, yards: 68 },
      { player: "Canon Harris", schoolSlug: "cisco", receptions: 1, yards: 40 },
      { player: "Corbin Harrison", schoolSlug: "cisco", receptions: 4, yards: 34 },
      { player: "Carter Toof", schoolSlug: "cisco", receptions: 1, yards: 27, touchdowns: 1 },
      { player: "Terrick Hernandez", schoolSlug: "cisco", receptions: 1, yards: 16 },
      { player: "July Johnson", schoolSlug: "cisco", receptions: 1, yards: 14, touchdowns: 1 },
      { player: "Landry Vosburg", schoolSlug: "cisco", receptions: 1, yards: 14 },
      { player: "Harley Griffin", schoolSlug: "clyde", receptions: 2, yards: 88, touchdowns: 1 },
      { player: "Hunter Dematties", schoolSlug: "clyde", receptions: 5, yards: 51 },
      { player: "Eli Goble", schoolSlug: "clyde", receptions: 1, yards: 52 },
      { player: "Jacob Hernandez", schoolSlug: "clyde", receptions: 1, yards: 5, touchdowns: 1 },
    ],
  },
];
