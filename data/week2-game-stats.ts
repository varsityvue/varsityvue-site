import type { GameStats } from "@/data/game-stats";

export const week2GameStats: GameStats[] = [
  {
    gameId: "de-leon-at-stamford-2026-week-2",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "Published Big Country Preps game statistics",
    quarterScores: [
      { schoolSlug: "de-leon", quarters: [7, 36, 14, 0], total: 57 },
      { schoolSlug: "stamford", quarters: [0, 0, 7, 0], total: 7 },
    ],
    scoringPlays: [
      { quarter: 1, clock: "6:26", schoolSlug: "de-leon", description: "Bryce Burkeen 15-yard interception return (Trenton Zmeskal kick)" },
      { quarter: 2, clock: "8:28", schoolSlug: "de-leon", description: "Bryce Burkeen 29-yard pass from Hud Price (Trenton Zmeskal kick)" },
      { quarter: 2, clock: "5:39", schoolSlug: "de-leon", description: "Lane Couch 27-yard run (Trenton Zmeskal kick)" },
      { quarter: 2, clock: "3:35", schoolSlug: "de-leon", description: "Trenton Zmeskal 24-yard pass from Hud Price (kick failed)" },
      { quarter: 2, clock: "1:51", schoolSlug: "de-leon", description: "Hud Price 14-yard run (Trenton Zmeskal kick)" },
      { quarter: 2, clock: "1:46", schoolSlug: "de-leon", description: "Safety, Chris McCann tackled in end zone" },
      { quarter: 2, clock: "0:13", schoolSlug: "de-leon", description: "Trenton Zmeskal 6-yard pass from Hud Price (Trenton Zmeskal kick)" },
      { quarter: 3, clock: "8:57", schoolSlug: "de-leon", description: "Hud Price 3-yard run (Trenton Zmeskal kick)" },
      { quarter: 3, clock: "5:02", schoolSlug: "de-leon", description: "Lane Couch 3-yard run (Luke Stokes kick)" },
      { quarter: 3, clock: "2:11", schoolSlug: "stamford", description: "Brennan Armstrong 12-yard pass from Miles Follis (Slayden Young kick)" },
    ],
    teamStats: [
      { schoolSlug: "de-leon", firstDowns: 26, rushingAttempts: 45, rushingYards: 377, passingYards: 99, totalYards: 476, completions: 10, passAttempts: 19, interceptionsThrown: 0, punts: 3, puntAverage: 27, fumbles: 1, fumblesLost: 1, penalties: 6, penaltyYards: 30 },
      { schoolSlug: "stamford", firstDowns: 11, rushingAttempts: 19, rushingYards: 34, passingYards: 283, totalYards: 317, completions: 19, passAttempts: 36, interceptionsThrown: 3, punts: 2, puntAverage: 23, fumbles: 1, fumblesLost: 1, penalties: 8, penaltyYards: 57 },
    ],
    rushing: [
      { player: "Lane Couch", schoolSlug: "de-leon", attempts: 21, yards: 209, touchdowns: 2 }, { player: "Hud Price", schoolSlug: "de-leon", attempts: 5, yards: 50, touchdowns: 2 }, { player: "Beau Morris", schoolSlug: "de-leon", attempts: 6, yards: 49 }, { player: "Ed Garcia", schoolSlug: "de-leon", attempts: 12, yards: 43 }, { player: "Bryce Burkeen", schoolSlug: "de-leon", attempts: 1, yards: 26 },
      { player: "Miles Follis", schoolSlug: "stamford", attempts: 7, yards: 18 }, { player: "Brenham Walker", schoolSlug: "stamford", attempts: 6, yards: 9 }, { player: "Slayden Young", schoolSlug: "stamford", attempts: 2, yards: 6 }, { player: "Chris McCann", schoolSlug: "stamford", attempts: 2, yards: 2 }, { player: "Josh Andrew", schoolSlug: "stamford", attempts: 2, yards: -1 },
    ],
    passing: [
      { player: "Hud Price", schoolSlug: "de-leon", completions: 10, attempts: 17, yards: 99, interceptions: 0, touchdowns: 3 }, { player: "Beau Morris", schoolSlug: "de-leon", completions: 0, attempts: 2, yards: 0, interceptions: 0 }, { player: "Miles Follis", schoolSlug: "stamford", completions: 19, attempts: 36, yards: 283, interceptions: 3 },
    ],
    receiving: [
      { player: "Bryce Burkeen", schoolSlug: "de-leon", receptions: 6, yards: 54, touchdowns: 1 }, { player: "Trenton Zmeskal", schoolSlug: "de-leon", receptions: 4, yards: 45, touchdowns: 2 }, { player: "Levi Vahlenkamp", schoolSlug: "stamford", receptions: 5, yards: 121 }, { player: "Ace Martinez", schoolSlug: "stamford", receptions: 4, yards: 80 }, { player: "Karsten Hall", schoolSlug: "stamford", receptions: 3, yards: 46 }, { player: "Slayden Young", schoolSlug: "stamford", receptions: 5, yards: 28 }, { player: "Brennan Armstrong", schoolSlug: "stamford", receptions: 1, yards: 12 }, { player: "Brenham Walker", schoolSlug: "stamford", receptions: 1, yards: -4 },
    ],
  },
  {
    gameId: "stephenville-at-brownwood-2026-week-2",
    season: 2026,
    sourceStatus: "verified",
    sourceLabel: "Published game statistics",
    quarterScores: [
      { schoolSlug: "stephenville", quarters: [7, 0, 7, 14], total: 28 },
      { schoolSlug: "brownwood", quarters: [7, 7, 0, 10], total: 24 },
    ],
    scoringPlays: [
      { quarter: 1, clock: "8:54", schoolSlug: "stephenville", description: "Pecos Tally 16-yard pass from Trot Jordan (Daniel Cervantes kick)" },
      { quarter: 1, clock: "0:30", schoolSlug: "brownwood", description: "Trent Buffington 9-yard run (Aiden Jimenez kick)" },
      { quarter: 2, clock: "10:40", schoolSlug: "brownwood", description: "Trent Buffington 1-yard run (Aiden Jimenez kick)" },
      { quarter: 3, clock: "3:28", schoolSlug: "stephenville", description: "Zyler McClendon 8-yard run (Daniel Cervantes kick)" },
      { quarter: 4, clock: "10:09", schoolSlug: "brownwood", description: "Aiden Jimenez 22-yard field goal" },
      { quarter: 4, clock: "4:20", schoolSlug: "stephenville", description: "Zyler McClendon 1-yard run (Daniel Cervantes kick)" },
      { quarter: 4, clock: "1:29", schoolSlug: "brownwood", description: "Trent Buffington 27-yard run (Aiden Jimenez kick)" },
      { quarter: 4, clock: "0:50", schoolSlug: "stephenville", description: "Caden Monk 75-yard pass from Trot Jordan (Daniel Cervantes kick)" },
    ],
    teamStats: [
      { schoolSlug: "stephenville", firstDowns: 24, rushingAttempts: 43, rushingYards: 280, passingYards: 163, totalYards: 443, completions: 10, passAttempts: 18, interceptionsThrown: 2, punts: 1, puntAverage: 40, fumbles: 2, fumblesLost: 2, penalties: 2, penaltyYards: 19 },
      { schoolSlug: "brownwood", firstDowns: 17, rushingAttempts: 33, rushingYards: 175, passingYards: 109, totalYards: 284, completions: 12, passAttempts: 26, interceptionsThrown: 0, punts: 5, puntAverage: 39, fumbles: 0, fumblesLost: 0, penalties: 4, penaltyYards: 30 },
    ],
    rushing: [
      { player: "Zyler McClendon", schoolSlug: "stephenville", attempts: 35, yards: 246, touchdowns: 2 },
      { player: "Trot Jordan", schoolSlug: "stephenville", attempts: 7, yards: 23 },
      { player: "Caleb Gleason", schoolSlug: "stephenville", attempts: 1, yards: 11 },
      { player: "Trent Buffington", schoolSlug: "brownwood", attempts: 30, yards: 186, touchdowns: 3 },
      { player: "Isaac Gonzales", schoolSlug: "brownwood", attempts: 1, yards: 0 },
      { player: "Riggs Gray", schoolSlug: "brownwood", attempts: 2, yards: -11 },
    ],
    passing: [
      { player: "Trot Jordan", schoolSlug: "stephenville", completions: 10, attempts: 18, yards: 163, interceptions: 2, touchdowns: 2 },
      { player: "Riggs Gray", schoolSlug: "brownwood", completions: 12, attempts: 26, yards: 109, interceptions: 0 },
    ],
    receiving: [
      { player: "Caden Monk", schoolSlug: "stephenville", receptions: 4, yards: 97, touchdowns: 1 },
      { player: "Adan Jergins", schoolSlug: "stephenville", receptions: 2, yards: 31 },
      { player: "Zyler McClendon", schoolSlug: "stephenville", receptions: 2, yards: 14 },
      { player: "Pecos Tally", schoolSlug: "stephenville", receptions: 1, yards: 16, touchdowns: 1 },
      { player: "Jhett Banuelos", schoolSlug: "stephenville", receptions: 1, yards: 4 },
      { player: "Garrett Wilkerson", schoolSlug: "brownwood", receptions: 3, yards: 18 },
      { player: "Jack Bauchman", schoolSlug: "brownwood", receptions: 2, yards: 26 },
      { player: "Isaac Gonzales", schoolSlug: "brownwood", receptions: 2, yards: 16 },
      { player: "Brody Bolton", schoolSlug: "brownwood", receptions: 1, yards: 35 },
      { player: "Rush Tharp", schoolSlug: "brownwood", receptions: 1, yards: 9 },
      { player: "Hudson Fry", schoolSlug: "brownwood", receptions: 1, yards: 3 },
      { player: "Trent Buffington", schoolSlug: "brownwood", receptions: 1, yards: 2 },
      { player: "Connor Cornelius", schoolSlug: "brownwood", receptions: 1, yards: 0 },
    ],
  },
];
