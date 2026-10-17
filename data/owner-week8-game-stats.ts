import type { GameStats } from "@/data/game-stats";
import type { ExtendedGameStats } from "@/data/extended-game-stats";

// Coach-supplied values preserved, including blank fields and acknowledged discrepancies.
// Source ledger and outstanding requests: docs/WEEK8_STAT_IMPORT_2026-10-17.md.
export const ownerWeek8GameStats: GameStats[] = [
  {
    "gameId": "china-spring-at-stephenville-2026-week-8",
    "season": 2026,
    "sourceStatus": "verified",
    "sourceLabel": "Coach-supplied Week 8 statistics, retransmitted by the owner October 17, 2026",
    "quarterScores": [
      {
        "schoolSlug": "china-spring",
        "quarters": [
          14,
          7,
          0,
          0
        ],
        "total": 21
      },
      {
        "schoolSlug": "stephenville",
        "quarters": [
          14,
          21,
          13,
          7
        ],
        "total": 55
      }
    ],
    "scoringPlays": [],
    "teamStats": [
      {
        "schoolSlug": "stephenville",
        "completions": 22,
        "passAttempts": 26,
        "passingYards": 439,
        "rushingAttempts": 30,
        "rushingYards": 152,
        "totalYards": 591,
        "interceptionsThrown": 0
      }
    ],
    "passing": [
      {
        "player": "Grayson Copeland",
        "schoolSlug": "stephenville",
        "completions": 3,
        "attempts": 3,
        "yards": 49,
        "interceptions": 0
      },
      {
        "player": "Trot Jordan",
        "schoolSlug": "stephenville",
        "completions": 19,
        "attempts": 23,
        "yards": 390,
        "touchdowns": 4,
        "interceptions": 0
      }
    ],
    "rushing": [
      {
        "player": "Grayson Copeland",
        "schoolSlug": "stephenville",
        "attempts": 1,
        "yards": 1,
        "touchdowns": 1
      },
      {
        "player": "Karson Bernal",
        "schoolSlug": "stephenville",
        "attempts": 12,
        "yards": 47
      },
      {
        "player": "Caleb Gleason",
        "schoolSlug": "stephenville",
        "attempts": 13,
        "yards": 87,
        "touchdowns": 2
      },
      {
        "player": "Trot Jordan",
        "schoolSlug": "stephenville",
        "attempts": 1,
        "yards": 8
      },
      {
        "player": "Carter VanZandt",
        "schoolSlug": "stephenville",
        "attempts": 3,
        "yards": 9,
        "touchdowns": 1
      }
    ],
    "receiving": [
      {
        "player": "Jhett Banuelos",
        "schoolSlug": "stephenville",
        "receptions": 4,
        "yards": 80
      },
      {
        "player": "Mason Shaver",
        "schoolSlug": "stephenville",
        "receptions": 3,
        "yards": 40
      },
      {
        "player": "Adan Jergins",
        "schoolSlug": "stephenville",
        "receptions": 2,
        "yards": 70,
        "touchdowns": 2
      },
      {
        "player": "Pecos Tally",
        "schoolSlug": "stephenville",
        "receptions": 3,
        "yards": 98
      },
      {
        "player": "Caden Monk",
        "schoolSlug": "stephenville",
        "receptions": 8,
        "yards": 136,
        "touchdowns": 2
      },
      {
        "player": "Kendall Douglas",
        "schoolSlug": "stephenville",
        "receptions": 1,
        "yards": 15
      }
    ],
    "completeness": [
      {
        "schoolSlug": "stephenville",
        "categories": {
          "quarterScoring": {
            "status": "complete",
            "note": "Owner supplied all four quarter splits."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "No scoring-play sequence was supplied."
          },
          "teamStats": {
            "status": "partial",
            "note": "Supplied offensive totals retained; other team-stat fields were not supplied."
          },
          "passing": {
            "status": "partial",
            "note": "Coach-supplied passing values retained; blank touchdown/interception fields remain unreported."
          },
          "rushing": {
            "status": "partial",
            "note": "Carries and yards reconcile; blank player touchdown fields remain unreported."
          },
          "receiving": {
            "status": "partial",
            "note": "Coach-supplied totals contain 22 completions and 21 receptions, both for 439 yards. Owner directed preservation without inventing an additional reception."
          }
        }
      },
      {
        "schoolSlug": "china-spring",
        "categories": {
          "teamStats": {
            "status": "unavailable",
            "note": "Offensive statistics have not yet been provided."
          },
          "passing": {
            "status": "unavailable",
            "note": "Offensive statistics have not yet been provided."
          },
          "rushing": {
            "status": "unavailable",
            "note": "Offensive statistics have not yet been provided."
          },
          "receiving": {
            "status": "unavailable",
            "note": "Offensive statistics have not yet been provided."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Scoring plays were not supplied."
          },
          "quarterScoring": {
            "status": "complete",
            "note": "All four quarter scores were supplied."
          }
        }
      }
    ]
  },
  {
    "gameId": "hico-at-de-leon-2026-week-8",
    "season": 2026,
    "sourceStatus": "verified",
    "sourceLabel": "Coach-supplied Week 8 statistics, retransmitted by the owner October 17, 2026",
    "quarterScores": [
      {
        "schoolSlug": "hico",
        "quarters": [
          0,
          0,
          0,
          7
        ],
        "total": 7
      },
      {
        "schoolSlug": "de-leon",
        "quarters": [
          14,
          14,
          7,
          14
        ],
        "total": 49
      }
    ],
    "scoringPlays": [],
    "teamStats": [
      {
        "schoolSlug": "de-leon",
        "completions": 15,
        "passAttempts": 21,
        "passingYards": 226,
        "rushingAttempts": 31,
        "rushingYards": 231,
        "totalYards": 457,
        "interceptionsThrown": 1
      }
    ],
    "passing": [
      {
        "player": "Hud Price",
        "schoolSlug": "de-leon",
        "completions": 15,
        "attempts": 21,
        "yards": 226,
        "touchdowns": 2,
        "interceptions": 1
      }
    ],
    "rushing": [
      {
        "player": "Lane Couch",
        "schoolSlug": "de-leon",
        "attempts": 13,
        "yards": 108,
        "touchdowns": 2
      },
      {
        "player": "Bryce Burkeen",
        "schoolSlug": "de-leon",
        "attempts": 2,
        "yards": 7,
        "touchdowns": 1
      },
      {
        "player": "Beau Morris",
        "schoolSlug": "de-leon",
        "attempts": 9,
        "yards": 54
      },
      {
        "player": "Samuel Martinez",
        "schoolSlug": "de-leon",
        "attempts": 4,
        "yards": 36,
        "touchdowns": 1
      },
      {
        "player": "Hud Price",
        "schoolSlug": "de-leon",
        "attempts": 3,
        "yards": 26,
        "touchdowns": 1
      }
    ],
    "receiving": [
      {
        "player": "Lane Couch",
        "schoolSlug": "de-leon",
        "receptions": 1,
        "yards": 4
      },
      {
        "player": "Trenton Zmeskal",
        "schoolSlug": "de-leon",
        "receptions": 1,
        "yards": 30
      },
      {
        "player": "Andrew Campbell",
        "schoolSlug": "de-leon",
        "receptions": 2,
        "yards": 27
      },
      {
        "player": "Bryce Burkeen",
        "schoolSlug": "de-leon",
        "receptions": 6,
        "yards": 69,
        "touchdowns": 1
      },
      {
        "player": "Jayden Lindley",
        "schoolSlug": "de-leon",
        "receptions": 6,
        "yards": 96,
        "touchdowns": 1
      }
    ],
    "completeness": [
      {
        "schoolSlug": "de-leon",
        "categories": {
          "quarterScoring": {
            "status": "complete",
            "note": "Owner supplied all four quarter splits."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "No scoring-play sequence was supplied."
          },
          "teamStats": {
            "status": "partial",
            "note": "Supplied offensive totals retained; other team-stat fields were not supplied."
          },
          "passing": {
            "status": "complete",
            "note": "Hud Price: 15/21, 226 yards, two touchdowns and one interception as supplied by the coach."
          },
          "rushing": {
            "status": "partial",
            "note": "Carries and yards reconcile; blank player touchdown fields remain unreported."
          },
          "receiving": {
            "status": "partial",
            "note": "Coach-supplied totals contain 15 completions and 16 receptions, both for 226 yards. Owner directed preservation without inventing a backup quarterback line."
          }
        }
      },
      {
        "schoolSlug": "hico",
        "categories": {
          "teamStats": {
            "status": "unavailable",
            "note": "Offensive statistics have not yet been provided."
          },
          "passing": {
            "status": "unavailable",
            "note": "Offensive statistics have not yet been provided."
          },
          "rushing": {
            "status": "unavailable",
            "note": "Offensive statistics have not yet been provided."
          },
          "receiving": {
            "status": "unavailable",
            "note": "Offensive statistics have not yet been provided."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Scoring plays were not supplied."
          },
          "quarterScoring": {
            "status": "complete",
            "note": "All four quarter scores were supplied."
          }
        }
      }
    ]
  },
  {
    "gameId": "stamford-at-cross-plains-2026-week-8",
    "season": 2026,
    "sourceStatus": "verified",
    "sourceLabel": "Coach-supplied Week 8 statistics, retransmitted by the owner October 17, 2026",
    "quarterScores": [],
    "scoringPlays": [],
    "teamStats": [
      {
        "schoolSlug": "stamford",
        "completions": 14,
        "passAttempts": 20,
        "passingYards": 345,
        "rushingAttempts": 16,
        "rushingYards": 95,
        "totalYards": 440
      }
    ],
    "passing": [
      {
        "player": "Miles Follis",
        "schoolSlug": "stamford",
        "completions": 14,
        "attempts": 20,
        "yards": 345,
        "touchdowns": 4
      }
    ],
    "rushing": [
      {
        "player": "Baylor Flow",
        "schoolSlug": "stamford",
        "attempts": 3,
        "yards": 47
      },
      {
        "player": "Slayden Young",
        "schoolSlug": "stamford",
        "attempts": 4,
        "yards": 12
      },
      {
        "player": "Christopher McCann",
        "schoolSlug": "stamford",
        "attempts": 6,
        "yards": 17
      },
      {
        "player": "Brenham Walker",
        "schoolSlug": "stamford",
        "attempts": 3,
        "yards": 19
      }
    ],
    "receiving": [
      {
        "player": "Brennan Armstrong",
        "schoolSlug": "stamford",
        "receptions": 2,
        "yards": 17
      },
      {
        "player": "Slayden Young",
        "schoolSlug": "stamford",
        "receptions": 6,
        "yards": 157
      },
      {
        "player": "Levi Vahlenkamp",
        "schoolSlug": "stamford",
        "receptions": 3,
        "yards": 94
      },
      {
        "player": "Ace Martinez",
        "schoolSlug": "stamford",
        "receptions": 3,
        "yards": 77
      }
    ],
    "completeness": [
      {
        "schoolSlug": "stamford",
        "categories": {
          "quarterScoring": {
            "status": "unavailable",
            "note": "Quarter splits were not supplied."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "No scoring-play sequence was supplied."
          },
          "teamStats": {
            "status": "partial",
            "note": "Supplied offensive totals retained; other team-stat fields were not supplied."
          },
          "passing": {
            "status": "partial",
            "note": "Coach-supplied passing values retained; blank touchdown/interception fields remain unreported."
          },
          "rushing": {
            "status": "partial",
            "note": "Carries and yards reconcile; blank player touchdown fields remain unreported."
          },
          "receiving": {
            "status": "partial",
            "note": "Coach-supplied receiving values retained; blank touchdown fields remain unreported."
          }
        }
      },
      {
        "schoolSlug": "cross-plains",
        "categories": {
          "teamStats": {
            "status": "unavailable",
            "note": "Offensive statistics have not yet been provided."
          },
          "passing": {
            "status": "unavailable",
            "note": "Offensive statistics have not yet been provided."
          },
          "rushing": {
            "status": "unavailable",
            "note": "Offensive statistics have not yet been provided."
          },
          "receiving": {
            "status": "unavailable",
            "note": "Offensive statistics have not yet been provided."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Scoring plays were not supplied."
          },
          "quarterScoring": {
            "status": "unavailable",
            "note": "Quarter splits were not supplied."
          }
        }
      }
    ]
  },
  {
    "gameId": "comanche-at-dublin-2026-week-8",
    "season": 2026,
    "sourceStatus": "verified",
    "sourceLabel": "Coach-supplied Week 8 statistics, retransmitted by the owner October 17, 2026",
    "quarterScores": [],
    "scoringPlays": [],
    "teamStats": [
      {
        "schoolSlug": "comanche",
        "completions": 8,
        "passAttempts": 14,
        "passingYards": 82,
        "rushingAttempts": 41,
        "rushingYards": 441,
        "totalYards": 523
      }
    ],
    "passing": [
      {
        "player": "Cooper Welch",
        "schoolSlug": "comanche",
        "completions": 8,
        "attempts": 14,
        "yards": 82,
        "touchdowns": 1
      }
    ],
    "rushing": [
      {
        "player": "Zaden Tello",
        "schoolSlug": "comanche",
        "attempts": 12,
        "yards": 128,
        "touchdowns": 2
      },
      {
        "player": "Elijah Ozuna",
        "schoolSlug": "comanche",
        "attempts": 5,
        "yards": 65
      },
      {
        "player": "Damian Aguilar",
        "schoolSlug": "comanche",
        "attempts": 3,
        "yards": 26
      },
      {
        "player": "Cooper Welch",
        "schoolSlug": "comanche",
        "attempts": 3,
        "yards": 13
      },
      {
        "player": "Ladanian Smith",
        "schoolSlug": "comanche",
        "attempts": 9,
        "yards": 70,
        "touchdowns": 2
      },
      {
        "player": "Nicolas Anaya",
        "schoolSlug": "comanche",
        "attempts": 9,
        "yards": 139,
        "touchdowns": 1
      }
    ],
    "receiving": [
      {
        "player": "Zaden Tello",
        "schoolSlug": "comanche",
        "receptions": 1,
        "yards": 9
      },
      {
        "player": "Lukas Morgan",
        "schoolSlug": "comanche",
        "receptions": 3,
        "yards": 28
      },
      {
        "player": "Kye Keeter",
        "schoolSlug": "comanche",
        "receptions": 4,
        "yards": 56,
        "touchdowns": 1
      }
    ],
    "completeness": [
      {
        "schoolSlug": "comanche",
        "categories": {
          "quarterScoring": {
            "status": "unavailable",
            "note": "Quarter splits were not supplied."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "No scoring-play sequence was supplied."
          },
          "teamStats": {
            "status": "partial",
            "note": "Supplied offensive totals retained; other team-stat fields were not supplied."
          },
          "passing": {
            "status": "partial",
            "note": "Coach-supplied passing values retained; blank touchdown/interception fields remain unreported."
          },
          "rushing": {
            "status": "partial",
            "note": "Carries and yards reconcile; blank player touchdown fields remain unreported."
          },
          "receiving": {
            "status": "partial",
            "note": "Coach-supplied totals contain 82 passing yards and 93 receiving yards, with eight completions and eight receptions. Source values retained without adjustment."
          }
        }
      },
      {
        "schoolSlug": "dublin",
        "categories": {
          "teamStats": {
            "status": "unavailable",
            "note": "Offensive statistics have not yet been provided."
          },
          "passing": {
            "status": "unavailable",
            "note": "Offensive statistics have not yet been provided."
          },
          "rushing": {
            "status": "unavailable",
            "note": "Offensive statistics have not yet been provided."
          },
          "receiving": {
            "status": "unavailable",
            "note": "Offensive statistics have not yet been provided."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Scoring plays were not supplied."
          },
          "quarterScoring": {
            "status": "unavailable",
            "note": "Quarter splits were not supplied."
          }
        }
      }
    ]
  },
  {
    "gameId": "cisco-at-hawley-2026-week-8",
    "season": 2026,
    "sourceStatus": "verified",
    "sourceLabel": "Owner-supplied Week 8 quarter scores, October 17, 2026; offensive statistics pending",
    "quarterScores": [
      {
        "schoolSlug": "cisco",
        "quarters": [
          0,
          24,
          0,
          7
        ],
        "total": 31
      },
      {
        "schoolSlug": "hawley",
        "quarters": [
          7,
          14,
          7,
          7
        ],
        "total": 35
      }
    ],
    "scoringPlays": [],
    "teamStats": [],
    "passing": [],
    "rushing": [],
    "receiving": [],
    "completeness": [
      {
        "schoolSlug": "cisco",
        "categories": {
          "teamStats": {
            "status": "unavailable",
            "note": "Week 8 team and player statistics have not yet been provided."
          },
          "passing": {
            "status": "unavailable",
            "note": "Week 8 team and player statistics have not yet been provided."
          },
          "rushing": {
            "status": "unavailable",
            "note": "Week 8 team and player statistics have not yet been provided."
          },
          "receiving": {
            "status": "unavailable",
            "note": "Week 8 team and player statistics have not yet been provided."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Scoring plays were not supplied."
          },
          "quarterScoring": {
            "status": "complete",
            "note": "All four quarter scores were supplied."
          }
        }
      },
      {
        "schoolSlug": "hawley",
        "categories": {
          "teamStats": {
            "status": "unavailable",
            "note": "Week 8 team and player statistics have not yet been provided."
          },
          "passing": {
            "status": "unavailable",
            "note": "Week 8 team and player statistics have not yet been provided."
          },
          "rushing": {
            "status": "unavailable",
            "note": "Week 8 team and player statistics have not yet been provided."
          },
          "receiving": {
            "status": "unavailable",
            "note": "Week 8 team and player statistics have not yet been provided."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Scoring plays were not supplied."
          },
          "quarterScoring": {
            "status": "complete",
            "note": "All four quarter scores were supplied."
          }
        }
      }
    ]
  },
  {
    "gameId": "goldthwaite-at-albany-2026-week-8",
    "season": 2026,
    "sourceStatus": "verified",
    "sourceLabel": "Owner-supplied Week 8 quarter scores, October 17, 2026; offensive statistics pending",
    "quarterScores": [
      {
        "schoolSlug": "goldthwaite",
        "quarters": [
          21,
          14,
          14,
          7
        ],
        "total": 56
      },
      {
        "schoolSlug": "albany",
        "quarters": [
          0,
          0,
          0,
          0
        ],
        "total": 0
      }
    ],
    "scoringPlays": [],
    "teamStats": [],
    "passing": [],
    "rushing": [],
    "receiving": [],
    "completeness": [
      {
        "schoolSlug": "goldthwaite",
        "categories": {
          "teamStats": {
            "status": "unavailable",
            "note": "Week 8 team and player statistics have not yet been provided."
          },
          "passing": {
            "status": "unavailable",
            "note": "Week 8 team and player statistics have not yet been provided."
          },
          "rushing": {
            "status": "unavailable",
            "note": "Week 8 team and player statistics have not yet been provided."
          },
          "receiving": {
            "status": "unavailable",
            "note": "Week 8 team and player statistics have not yet been provided."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Scoring plays were not supplied."
          },
          "quarterScoring": {
            "status": "complete",
            "note": "All four quarter scores were supplied."
          }
        }
      },
      {
        "schoolSlug": "albany",
        "categories": {
          "teamStats": {
            "status": "unavailable",
            "note": "Week 8 team and player statistics have not yet been provided."
          },
          "passing": {
            "status": "unavailable",
            "note": "Week 8 team and player statistics have not yet been provided."
          },
          "rushing": {
            "status": "unavailable",
            "note": "Week 8 team and player statistics have not yet been provided."
          },
          "receiving": {
            "status": "unavailable",
            "note": "Week 8 team and player statistics have not yet been provided."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Scoring plays were not supplied."
          },
          "quarterScoring": {
            "status": "complete",
            "note": "All four quarter scores were supplied."
          }
        }
      }
    ]
  }
];

export const ownerWeek8DetailedStats: ExtendedGameStats[] = [
  {
    "gameId": "china-spring-at-stephenville-2026-week-8",
    "sourceLabel": "Coach-supplied Week 8 statistics, retransmitted by the owner October 17, 2026",
    "teamMetrics": [
      {
        "label": "Passing C/Att/Yds/C%/Avg/TD/INT/Long/QB Rate",
        "away": "\u2014",
        "home": "22/26/439/.846/20.0/4/0/57/164.3"
      },
      {
        "label": "Rushing Car/Yds/Avg/Long/100+/TD",
        "away": "\u2014",
        "home": "30/152/5.1/25/0/4"
      },
      {
        "label": "Receiving Rec/Yds/Avg/Long/TD",
        "away": "\u2014",
        "home": "21/439/20.9/57/4"
      }
    ],
    "tables": [
      {
        "title": "Passing detail",
        "headers": [
          "Player",
          "#",
          "Grade",
          "C",
          "Att",
          "Yds",
          "C%",
          "Avg",
          "TD",
          "INT",
          "Long",
          "QB Rate"
        ],
        "completeness": {
          "stephenville": {
            "status": "partial",
            "note": "Coach-supplied values; dashes mean unreported, not zero."
          }
        },
        "rows": [
          {
            "player": "Grayson Copeland",
            "schoolSlug": "stephenville",
            "values": [
              4,
              "Sr",
              3,
              3,
              49,
              "1.000",
              "16.3",
              "\u2014",
              0,
              "\u2014",
              137.5
            ]
          },
          {
            "player": "Trot Jordan",
            "schoolSlug": "stephenville",
            "values": [
              17,
              "\u2014",
              19,
              23,
              390,
              ".826",
              "20.5",
              4,
              0,
              57,
              162.6
            ]
          }
        ]
      },
      {
        "title": "Rushing detail",
        "headers": [
          "Player",
          "#",
          "Grade",
          "Car",
          "Yds",
          "Avg",
          "Long",
          "100+",
          "TD"
        ],
        "completeness": {
          "stephenville": {
            "status": "partial",
            "note": "Coach-supplied values; dashes mean unreported, not zero."
          }
        },
        "rows": [
          {
            "player": "Grayson Copeland",
            "schoolSlug": "stephenville",
            "values": [
              4,
              "Sr",
              1,
              1,
              "1.0",
              1,
              0,
              1
            ]
          },
          {
            "player": "Karson Bernal",
            "schoolSlug": "stephenville",
            "values": [
              6,
              "Sr",
              12,
              47,
              "3.9",
              10,
              0,
              "\u2014"
            ]
          },
          {
            "player": "Caleb Gleason",
            "schoolSlug": "stephenville",
            "values": [
              15,
              "Sr",
              13,
              87,
              "6.7",
              25,
              0,
              2
            ]
          },
          {
            "player": "Trot Jordan",
            "schoolSlug": "stephenville",
            "values": [
              17,
              "\u2014",
              1,
              8,
              "8.0",
              8,
              0,
              "\u2014"
            ]
          },
          {
            "player": "Carter VanZandt",
            "schoolSlug": "stephenville",
            "values": [
              21,
              "Jr",
              3,
              9,
              "3.0",
              5,
              0,
              1
            ]
          }
        ]
      },
      {
        "title": "Receiving detail",
        "headers": [
          "Player",
          "#",
          "Grade",
          "Rec",
          "Yds",
          "Avg",
          "Long",
          "TD"
        ],
        "completeness": {
          "stephenville": {
            "status": "partial",
            "note": "Coach-supplied values; dashes mean unreported, not zero."
          }
        },
        "rows": [
          {
            "player": "Jhett Banuelos",
            "schoolSlug": "stephenville",
            "values": [
              2,
              "Sr",
              4,
              80,
              "20.0",
              30,
              "\u2014"
            ]
          },
          {
            "player": "Mason Shaver",
            "schoolSlug": "stephenville",
            "values": [
              9,
              "Jr",
              3,
              40,
              "13.3",
              32,
              "\u2014"
            ]
          },
          {
            "player": "Adan Jergins",
            "schoolSlug": "stephenville",
            "values": [
              10,
              "Sr",
              2,
              70,
              "35.0",
              38,
              2
            ]
          },
          {
            "player": "Pecos Tally",
            "schoolSlug": "stephenville",
            "values": [
              11,
              "Sr",
              3,
              98,
              "32.7",
              57,
              "\u2014"
            ]
          },
          {
            "player": "Caden Monk",
            "schoolSlug": "stephenville",
            "values": [
              34,
              "So",
              8,
              136,
              "17.0",
              45,
              2
            ]
          },
          {
            "player": "Kendall Douglas",
            "schoolSlug": "stephenville",
            "values": [
              88,
              "So",
              1,
              15,
              "15.0",
              15,
              "\u2014"
            ]
          }
        ]
      }
    ],
    "notes": [
      "Coach-supplied totals contain 22 completions and 21 receptions, both for 439 yards. Owner directed preservation without inventing an additional reception.",
      "Only this team's offensive statistics were supplied. No defensive, kicking or opponent player statistics are inferred."
    ]
  },
  {
    "gameId": "hico-at-de-leon-2026-week-8",
    "sourceLabel": "Coach-supplied Week 8 statistics, retransmitted by the owner October 17, 2026",
    "teamMetrics": [
      {
        "label": "Passing C/Att/Yds/C%/Avg/TD/INT/Long/QB Rate",
        "away": "\u2014",
        "home": "15/21/226/.714/15.1/2/1/\u2014/118.4"
      },
      {
        "label": "Rushing Car/Yds/Avg/Long/100+/TD",
        "away": "\u2014",
        "home": "31/231/7.5/\u2014/1/5"
      },
      {
        "label": "Receiving Rec/Yds/Avg/Long/TD",
        "away": "\u2014",
        "home": "16/226/14.1/\u2014/2"
      }
    ],
    "tables": [
      {
        "title": "Passing detail",
        "headers": [
          "Player",
          "#",
          "Grade",
          "C",
          "Att",
          "Yds",
          "C%",
          "Avg",
          "TD",
          "INT",
          "Long",
          "QB Rate"
        ],
        "completeness": {
          "de-leon": {
            "status": "partial",
            "note": "Coach-supplied values; dashes mean unreported, not zero."
          }
        },
        "rows": [
          {
            "player": "Hud Price",
            "schoolSlug": "de-leon",
            "values": [
              12,
              "Sr",
              15,
              21,
              226,
              ".714",
              "15.1",
              2,
              1,
              "\u2014",
              118.4
            ]
          }
        ]
      },
      {
        "title": "Rushing detail",
        "headers": [
          "Player",
          "#",
          "Grade",
          "Car",
          "Yds",
          "Avg",
          "Long",
          "100+",
          "TD"
        ],
        "completeness": {
          "de-leon": {
            "status": "partial",
            "note": "Coach-supplied values; dashes mean unreported, not zero."
          }
        },
        "rows": [
          {
            "player": "Lane Couch",
            "schoolSlug": "de-leon",
            "values": [
              1,
              "Jr",
              13,
              108,
              "8.3",
              "\u2014",
              1,
              2
            ]
          },
          {
            "player": "Bryce Burkeen",
            "schoolSlug": "de-leon",
            "values": [
              5,
              "Sr",
              2,
              7,
              "3.5",
              "\u2014",
              0,
              1
            ]
          },
          {
            "player": "Beau Morris",
            "schoolSlug": "de-leon",
            "values": [
              8,
              "Jr",
              9,
              54,
              "6.0",
              "\u2014",
              0,
              "\u2014"
            ]
          },
          {
            "player": "Samuel Martinez",
            "schoolSlug": "de-leon",
            "values": [
              10,
              "Jr",
              4,
              36,
              "9.0",
              "\u2014",
              0,
              1
            ]
          },
          {
            "player": "Hud Price",
            "schoolSlug": "de-leon",
            "values": [
              12,
              "Sr",
              3,
              26,
              "8.7",
              "\u2014",
              0,
              1
            ]
          }
        ]
      },
      {
        "title": "Receiving detail",
        "headers": [
          "Player",
          "#",
          "Grade",
          "Rec",
          "Yds",
          "Avg",
          "Long",
          "TD"
        ],
        "completeness": {
          "de-leon": {
            "status": "partial",
            "note": "Coach-supplied values; dashes mean unreported, not zero."
          }
        },
        "rows": [
          {
            "player": "Lane Couch",
            "schoolSlug": "de-leon",
            "values": [
              1,
              "Jr",
              1,
              4,
              "4.0",
              "\u2014",
              "\u2014"
            ]
          },
          {
            "player": "Trenton Zmeskal",
            "schoolSlug": "de-leon",
            "values": [
              3,
              "Sr",
              1,
              30,
              "30.0",
              "\u2014",
              "\u2014"
            ]
          },
          {
            "player": "Andrew Campbell",
            "schoolSlug": "de-leon",
            "values": [
              4,
              "Sr",
              2,
              27,
              "13.5",
              "\u2014",
              "\u2014"
            ]
          },
          {
            "player": "Bryce Burkeen",
            "schoolSlug": "de-leon",
            "values": [
              5,
              "Sr",
              6,
              69,
              "11.5",
              "\u2014",
              1
            ]
          },
          {
            "player": "Jayden Lindley",
            "schoolSlug": "de-leon",
            "values": [
              9,
              "Sr",
              6,
              96,
              "16.0",
              "\u2014",
              1
            ]
          }
        ]
      }
    ],
    "notes": [
      "Coach-supplied totals contain 15 completions and 16 receptions, both for 226 yards. Owner directed preservation without inventing a backup quarterback line.",
      "Only this team's offensive statistics were supplied. No defensive, kicking or opponent player statistics are inferred."
    ]
  },
  {
    "gameId": "stamford-at-cross-plains-2026-week-8",
    "sourceLabel": "Coach-supplied Week 8 statistics, retransmitted by the owner October 17, 2026",
    "teamMetrics": [
      {
        "label": "Passing C/Att/Yds/C%/Avg/TD/INT/Long/QB Rate",
        "away": "14/20/345/.700/24.6/4/\u2014/86/152.1",
        "home": "\u2014"
      },
      {
        "label": "Rushing Car/Yds/Avg/Long/100+/TD",
        "away": "16/95/5.9/39/0/\u2014",
        "home": "\u2014"
      },
      {
        "label": "Receiving Rec/Yds/Avg/Long/TD",
        "away": "14/345/24.6/86/\u2014",
        "home": "\u2014"
      }
    ],
    "tables": [
      {
        "title": "Passing detail",
        "headers": [
          "Player",
          "#",
          "Grade",
          "C",
          "Att",
          "Yds",
          "C%",
          "Avg",
          "TD",
          "INT",
          "Long",
          "QB Rate"
        ],
        "completeness": {
          "stamford": {
            "status": "partial",
            "note": "Coach-supplied values; dashes mean unreported, not zero."
          }
        },
        "rows": [
          {
            "player": "Miles Follis",
            "schoolSlug": "stamford",
            "values": [
              4,
              "Jr",
              14,
              20,
              345,
              ".700",
              "24.6",
              4,
              "\u2014",
              86,
              152.1
            ]
          }
        ]
      },
      {
        "title": "Rushing detail",
        "headers": [
          "Player",
          "#",
          "Grade",
          "Car",
          "Yds",
          "Avg",
          "Long",
          "100+",
          "TD"
        ],
        "completeness": {
          "stamford": {
            "status": "partial",
            "note": "Coach-supplied values; dashes mean unreported, not zero."
          }
        },
        "rows": [
          {
            "player": "Baylor Flow",
            "schoolSlug": "stamford",
            "values": [
              5,
              "Sr",
              3,
              47,
              "15.7",
              39,
              0,
              "\u2014"
            ]
          },
          {
            "player": "Slayden Young",
            "schoolSlug": "stamford",
            "values": [
              11,
              "Jr",
              4,
              12,
              "3.0",
              8,
              0,
              "\u2014"
            ]
          },
          {
            "player": "Christopher McCann",
            "schoolSlug": "stamford",
            "values": [
              28,
              "Sr",
              6,
              17,
              "2.8",
              10,
              0,
              "\u2014"
            ]
          },
          {
            "player": "Brenham Walker",
            "schoolSlug": "stamford",
            "values": [
              40,
              "Sr",
              3,
              19,
              "6.3",
              17,
              0,
              "\u2014"
            ]
          }
        ]
      },
      {
        "title": "Receiving detail",
        "headers": [
          "Player",
          "#",
          "Grade",
          "Rec",
          "Yds",
          "Avg",
          "Long",
          "TD"
        ],
        "completeness": {
          "stamford": {
            "status": "partial",
            "note": "Coach-supplied values; dashes mean unreported, not zero."
          }
        },
        "rows": [
          {
            "player": "Brennan Armstrong",
            "schoolSlug": "stamford",
            "values": [
              7,
              "Jr",
              2,
              17,
              "8.5",
              12,
              "\u2014"
            ]
          },
          {
            "player": "Slayden Young",
            "schoolSlug": "stamford",
            "values": [
              11,
              "Jr",
              6,
              157,
              "26.2",
              86,
              "\u2014"
            ]
          },
          {
            "player": "Levi Vahlenkamp",
            "schoolSlug": "stamford",
            "values": [
              12,
              "Sr",
              3,
              94,
              "31.3",
              49,
              "\u2014"
            ]
          },
          {
            "player": "Ace Martinez",
            "schoolSlug": "stamford",
            "values": [
              22,
              "Jr",
              3,
              77,
              "25.7",
              58,
              "\u2014"
            ]
          }
        ]
      }
    ],
    "notes": [
      "The supplied source reports quarterback passing touchdowns only. Rushing/receiving touchdown attribution and interceptions were not supplied; blanks are unreported, not zero.",
      "Only this team's offensive statistics were supplied. No defensive, kicking or opponent player statistics are inferred."
    ]
  },
  {
    "gameId": "comanche-at-dublin-2026-week-8",
    "sourceLabel": "Coach-supplied Week 8 statistics, retransmitted by the owner October 17, 2026",
    "teamMetrics": [
      {
        "label": "Passing C/Att/Yds/C%/Avg/TD/INT/Long/QB Rate",
        "away": "8/14/82/.571/10.3/1/\u2014/\u2014/97.9",
        "home": "\u2014"
      },
      {
        "label": "Rushing Car/Yds/Avg/Long/100+/TD",
        "away": "41/441/10.8/\u2014/2/5",
        "home": "\u2014"
      },
      {
        "label": "Receiving Rec/Yds/Avg/Long/TD",
        "away": "8/93/11.6/\u2014/1",
        "home": "\u2014"
      }
    ],
    "tables": [
      {
        "title": "Passing detail",
        "headers": [
          "Player",
          "#",
          "Grade",
          "C",
          "Att",
          "Yds",
          "C%",
          "Avg",
          "TD",
          "INT",
          "Long",
          "QB Rate"
        ],
        "completeness": {
          "comanche": {
            "status": "partial",
            "note": "Coach-supplied values; dashes mean unreported, not zero."
          }
        },
        "rows": [
          {
            "player": "Cooper Welch",
            "schoolSlug": "comanche",
            "values": [
              6,
              "\u2014",
              8,
              14,
              82,
              ".571",
              "10.3",
              1,
              "\u2014",
              "\u2014",
              97.9
            ]
          }
        ]
      },
      {
        "title": "Rushing detail",
        "headers": [
          "Player",
          "#",
          "Grade",
          "Car",
          "Yds",
          "Avg",
          "Long",
          "100+",
          "TD"
        ],
        "completeness": {
          "comanche": {
            "status": "partial",
            "note": "Coach-supplied values; dashes mean unreported, not zero."
          }
        },
        "rows": [
          {
            "player": "Zaden Tello",
            "schoolSlug": "comanche",
            "values": [
              0,
              "\u2014",
              12,
              128,
              "10.7",
              "\u2014",
              1,
              2
            ]
          },
          {
            "player": "Elijah Ozuna",
            "schoolSlug": "comanche",
            "values": [
              1,
              "So",
              5,
              65,
              "13.0",
              "\u2014",
              0,
              "\u2014"
            ]
          },
          {
            "player": "Damian Aguilar",
            "schoolSlug": "comanche",
            "values": [
              3,
              "\u2014",
              3,
              26,
              "8.7",
              "\u2014",
              0,
              "\u2014"
            ]
          },
          {
            "player": "Cooper Welch",
            "schoolSlug": "comanche",
            "values": [
              6,
              "\u2014",
              3,
              13,
              "4.3",
              "\u2014",
              0,
              "\u2014"
            ]
          },
          {
            "player": "Ladanian Smith",
            "schoolSlug": "comanche",
            "values": [
              9,
              "Sr",
              9,
              70,
              "7.8",
              "\u2014",
              0,
              2
            ]
          },
          {
            "player": "Nicolas Anaya",
            "schoolSlug": "comanche",
            "values": [
              23,
              "So",
              9,
              139,
              "15.4",
              "\u2014",
              1,
              1
            ]
          }
        ]
      },
      {
        "title": "Receiving detail",
        "headers": [
          "Player",
          "#",
          "Grade",
          "Rec",
          "Yds",
          "Avg",
          "Long",
          "TD"
        ],
        "completeness": {
          "comanche": {
            "status": "partial",
            "note": "Coach-supplied values; dashes mean unreported, not zero."
          }
        },
        "rows": [
          {
            "player": "Zaden Tello",
            "schoolSlug": "comanche",
            "values": [
              0,
              "\u2014",
              1,
              9,
              "9.0",
              "\u2014",
              "\u2014"
            ]
          },
          {
            "player": "Lukas Morgan",
            "schoolSlug": "comanche",
            "values": [
              8,
              "\u2014",
              3,
              28,
              "9.3",
              "\u2014",
              "\u2014"
            ]
          },
          {
            "player": "Kye Keeter",
            "schoolSlug": "comanche",
            "values": [
              11,
              "Jr",
              4,
              56,
              "14.0",
              "\u2014",
              1
            ]
          }
        ]
      }
    ],
    "notes": [
      "Coach-supplied totals contain 82 passing yards and 93 receiving yards, with eight completions and eight receptions. Source values retained without adjustment.",
      "Only this team's offensive statistics were supplied. No defensive, kicking or opponent player statistics are inferred."
    ]
  }
];
