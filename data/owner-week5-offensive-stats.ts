import type { GameStats } from "@/data/game-stats";

const unavailable = { status: "unavailable" as const, note: "Quarter splits and scoring plays were not supplied." };
const complete = { status: "complete" as const, note: "The supplied player lines reconcile to the team totals." };
const opposing = (schoolSlug: string) => ({ schoolSlug, categories: {
  quarterScoring: unavailable, scoringPlays: unavailable,
  teamStats: { status: "unavailable" as const, note: "Opponent box-score statistics were not supplied." },
  rushing: { status: "unavailable" as const }, passing: { status: "unavailable" as const }, receiving: { status: "unavailable" as const },
} });

export const ownerWeek5OffensiveStats: GameStats[] = [
  {
    gameId: "jacksboro-at-cisco-2026-week-5", season: 2026,
    sourceStatus: "verified", sourceLabel: "Owner-supplied Week 5 offensive box score",
    quarterScores: [{ schoolSlug: "jacksboro", quarters: [], total: 42 }, { schoolSlug: "cisco", quarters: [], total: 49 }], scoringPlays: [],
    teamStats: [{ schoolSlug: "cisco", rushingAttempts: 43, rushingYards: 262, passingYards: 263, completions: 10, passAttempts: 14, interceptionsThrown: 0 }],
    rushing: [
      { player: "Corbin Harrison", schoolSlug: "cisco", attempts: 3, yards: 4, touchdowns: 0 },
      { player: "Landry Vosburg", schoolSlug: "cisco", attempts: 5, yards: 15, touchdowns: 0 },
      { player: "July Johnson", schoolSlug: "cisco", attempts: 12, yards: 162, touchdowns: 1 },
      { player: "Colby McIlroy", schoolSlug: "cisco", attempts: 23, yards: 81, touchdowns: 3 },
    ],
    passing: [{ player: "Colby McIlroy", schoolSlug: "cisco", completions: 10, attempts: 14, yards: 263, touchdowns: 3, interceptions: 0 }],
    receiving: [
      { player: "Corbin Harrison", schoolSlug: "cisco", receptions: 2, yards: 28, touchdowns: 0 },
      { player: "Gage Johnson", schoolSlug: "cisco", receptions: 2, yards: 38, touchdowns: 0 },
      { player: "Cannon Harris", schoolSlug: "cisco", receptions: 4, yards: 132, touchdowns: 2 },
      { player: "Landry Vosburg", schoolSlug: "cisco", receptions: 1, yards: -4, touchdowns: 0 },
      { player: "Carter Toof", schoolSlug: "cisco", receptions: 1, yards: 69, touchdowns: 1 },
    ],
    completeness: [opposing("jacksboro"), { schoolSlug: "cisco", categories: {
      quarterScoring: unavailable, scoringPlays: unavailable, teamStats: complete, rushing: complete, passing: complete, receiving: complete,
    } }],
  },
  {
    gameId: "miles-at-stamford-2026-week-5", season: 2026,
    sourceStatus: "verified", sourceLabel: "Owner-supplied Week 5 offensive box score",
    quarterScores: [{ schoolSlug: "miles", quarters: [], total: 7 }, { schoolSlug: "stamford", quarters: [], total: 69 }], scoringPlays: [],
    teamStats: [{ schoolSlug: "stamford", rushingAttempts: 21, rushingYards: 212, passingYards: 311, completions: 13, passAttempts: 18 }],
    rushing: [
      { player: "Josh Andruch", schoolSlug: "stamford", attempts: 7, yards: 43 },
      { player: "Slayden Young", schoolSlug: "stamford", attempts: 3, yards: 67 },
      { player: "Christopher McCann", schoolSlug: "stamford", attempts: 6, yards: 62 },
      { player: "Brenham Walker", schoolSlug: "stamford", attempts: 5, yards: 40 },
    ],
    passing: [
      { player: "Miles Follis", schoolSlug: "stamford", completions: 11, attempts: 16, yards: 294, touchdowns: 6 },
      { player: "Slayden Young", schoolSlug: "stamford", completions: 2, attempts: 2, yards: 17 },
    ],
    receiving: [
      { player: "Karsten Hall", schoolSlug: "stamford", receptions: 2, yards: 17 },
      { player: "C'nai Whitfield", schoolSlug: "stamford", receptions: 1, yards: 8 },
      { player: "Brennan Armstrong", schoolSlug: "stamford", receptions: 2, yards: 48 },
      { player: "Slayden Young", schoolSlug: "stamford", receptions: 3, yards: 36 },
      { player: "Levi Vahlenkamp", schoolSlug: "stamford", receptions: 4, yards: 139 },
      { player: "Ace Martinez", schoolSlug: "stamford", receptions: 1, yards: 63 },
    ],
    completeness: [opposing("miles"), { schoolSlug: "stamford", categories: {
      quarterScoring: unavailable, scoringPlays: unavailable, teamStats: complete,
      rushing: { status: "partial", note: "Carries and yards reconcile; rushing touchdown attribution was not supplied." },
      passing: { status: "partial", note: "Completions, attempts and yards reconcile; interceptions and Slayden Young's TD total were not supplied." },
      receiving: { status: "partial", note: "Receptions and yards reconcile; receiving touchdown attribution was not supplied." },
    } }],
  },
  {
    gameId: "early-at-de-leon-2026-week-5", season: 2026,
    sourceStatus: "verified", sourceLabel: "Owner-supplied Week 5 offensive box score",
    quarterScores: [{ schoolSlug: "early", quarters: [], total: 21 }, { schoolSlug: "de-leon", quarters: [], total: 51 }], scoringPlays: [],
    teamStats: [{ schoolSlug: "de-leon", rushingAttempts: 41, rushingYards: 318, passingYards: 178, completions: 14, passAttempts: 20 }],
    rushing: [
      { player: "Lane Couch", schoolSlug: "de-leon", attempts: 18, yards: 167, touchdowns: 2 },
      { player: "Trenton Zmeskal", schoolSlug: "de-leon", attempts: 1, yards: 6, touchdowns: 1 },
      { player: "Beau Morris", schoolSlug: "de-leon", attempts: 2, yards: 35 },
      { player: "Hud Price", schoolSlug: "de-leon", attempts: 7, yards: 65 },
      { player: "Ed Garcia", schoolSlug: "de-leon", attempts: 13, yards: 45 },
    ],
    passing: [{ player: "Hud Price", schoolSlug: "de-leon", completions: 14, attempts: 20, yards: 178, touchdowns: 4 }],
    receiving: [
      { player: "Bentley Lingle", schoolSlug: "de-leon", receptions: 1, yards: 10 },
      { player: "Trenton Zmeskal", schoolSlug: "de-leon", receptions: 1, yards: 3, touchdowns: 1 },
      { player: "Andrew Campbell", schoolSlug: "de-leon", receptions: 2, yards: 7 },
      { player: "Bryce Burkeen", schoolSlug: "de-leon", receptions: 9, yards: 148, touchdowns: 3 },
      { player: "Caden Morganstean", schoolSlug: "de-leon", receptions: 1, yards: 10 },
    ],
    completeness: [opposing("early"), { schoolSlug: "de-leon", categories: {
      quarterScoring: unavailable, scoringPlays: unavailable, teamStats: complete,
      rushing: { status: "partial", note: "Carries and yards reconcile; TD totals for three other rushers were not supplied." },
      passing: { status: "partial", note: "Passing attempts and yards reconcile; interceptions were not supplied." },
      receiving: { status: "partial", note: "Receptions and yards reconcile; TD totals for three receivers were not supplied." },
    } }],
  },
  {
    gameId: "tolar-at-comanche-2026-week-5", season: 2026,
    sourceStatus: "verified", sourceLabel: "Owner-supplied Week 5 offensive box score",
    quarterScores: [{ schoolSlug: "tolar", quarters: [], total: 42 }, { schoolSlug: "comanche", quarters: [], total: 24 }], scoringPlays: [],
    teamStats: [{ schoolSlug: "comanche", rushingAttempts: 38, rushingYards: 185, passingYards: 153, completions: 9, passAttempts: 22 }],
    rushing: [
      { player: "Zaden Tello", schoolSlug: "comanche", attempts: 16, yards: 79 },
      { player: "Elijah Ozuna", schoolSlug: "comanche", attempts: 1, yards: 7 },
      { player: "Cooper Welch", schoolSlug: "comanche", attempts: 5, yards: 41 },
      { player: "Ladanian Smith", schoolSlug: "comanche", attempts: 14, yards: 52, touchdowns: 1 },
      { player: "Nicolas Anaya", schoolSlug: "comanche", attempts: 2, yards: 6 },
    ],
    passing: [{ player: "Cooper Welch", schoolSlug: "comanche", completions: 9, attempts: 22, yards: 153, touchdowns: 2 }],
    receiving: [
      { player: "Zaden Tello", schoolSlug: "comanche", receptions: 2, yards: 11, touchdowns: 1 },
      { player: "Elijah Ozuna", schoolSlug: "comanche", receptions: 1, yards: 27 },
      { player: "Lukas Morgan", schoolSlug: "comanche", receptions: 4, yards: 71, touchdowns: 1 },
      { player: "Caiden Vargas", schoolSlug: "comanche", receptions: 1, yards: 28 },
      { player: "Adrian Molina", schoolSlug: "comanche", receptions: 1, yards: 16 },
    ],
    completeness: [opposing("tolar"), { schoolSlug: "comanche", categories: {
      quarterScoring: unavailable, scoringPlays: unavailable, teamStats: complete,
      rushing: { status: "partial", note: "Carries and yards reconcile; TD attribution for the other rushers was not supplied." },
      passing: { status: "partial", note: "Completions, attempts and yards reconcile; interceptions were not supplied." },
      receiving: { status: "partial", note: "Receptions and yards reconcile; TD attribution for three receivers was not supplied." },
    } }],
  },
];
