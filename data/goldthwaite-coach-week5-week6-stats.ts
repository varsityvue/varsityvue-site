import type { GameStats } from "@/data/game-stats";

// Goldthwaite-only import. Opponent player lines, possession, down conversions,
// and report placeholder zeros for tackles/sacks are intentionally excluded.
export const goldthwaiteCoachWeek5Week6Stats: GameStats[] = [
  {
    "gameId": "winters-at-goldthwaite-2026-week-5",
    "season": 2026,
    "sourceStatus": "verified",
    "sourceLabel": "Goldthwaite coaching staff; supplied by owner October 5, 2026",
    "quarterScores": [
      {
        "schoolSlug": "winters",
        "quarters": [
          0,
          0,
          0,
          0
        ],
        "total": 0
      },
      {
        "schoolSlug": "goldthwaite",
        "quarters": [
          34,
          14,
          14,
          7
        ],
        "total": 69
      }
    ],
    "scoringPlays": [
      {
        "quarter": 1,
        "schoolSlug": "goldthwaite",
        "description": "Aidyn Lee 61-yard punt-return touchdown (Blake Howard kick)"
      },
      {
        "quarter": 1,
        "schoolSlug": "goldthwaite",
        "description": "Luke Patrick 27-yard touchdown run (Blake Howard kick)"
      },
      {
        "quarter": 1,
        "schoolSlug": "goldthwaite",
        "description": "Hayes Greenway 12-yard touchdown run (Blake Howard kick)"
      },
      {
        "quarter": 1,
        "schoolSlug": "goldthwaite",
        "description": "Landry Sanderson 47-yard touchdown run; no extra point recorded"
      },
      {
        "quarter": 1,
        "schoolSlug": "goldthwaite",
        "description": "Aidyn Lee 40-yard punt-return touchdown (Blake Howard kick)"
      },
      {
        "quarter": 2,
        "schoolSlug": "goldthwaite",
        "description": "Blaine Hall 15-yard touchdown pass from Hayes Greenway (Blake Howard kick)"
      },
      {
        "quarter": 2,
        "schoolSlug": "goldthwaite",
        "description": "Aidyn Lee 55-yard interception-return touchdown (Blake Howard kick)"
      },
      {
        "quarter": 3,
        "schoolSlug": "goldthwaite",
        "description": "Owen Campbell 37-yard touchdown run (Blake Howard kick)"
      },
      {
        "quarter": 3,
        "schoolSlug": "goldthwaite",
        "description": "Owen Campbell 20-yard touchdown run (Blake Howard kick)"
      },
      {
        "quarter": 4,
        "schoolSlug": "goldthwaite",
        "description": "Stayde Long 1-yard touchdown run (Blake Howard kick)"
      }
    ],
    "teamStats": [
      {
        "schoolSlug": "goldthwaite",
        "firstDowns": 14,
        "rushingAttempts": 14,
        "rushingYards": 229,
        "passingYards": 54,
        "totalYards": 283,
        "completions": 4,
        "passAttempts": 5,
        "interceptionsThrown": 0,
        "fumbles": 0,
        "fumblesLost": 0,
        "penalties": 2,
        "penaltyYards": 26
      }
    ],
    "rushing": [
      {
        "player": "Landry Sanderson",
        "schoolSlug": "goldthwaite",
        "attempts": 4,
        "yards": 92,
        "touchdowns": 1
      },
      {
        "player": "Owen Campbell",
        "schoolSlug": "goldthwaite",
        "attempts": 2,
        "yards": 57,
        "touchdowns": 2
      },
      {
        "player": "Luke Patrick",
        "schoolSlug": "goldthwaite",
        "attempts": 1,
        "yards": 27,
        "touchdowns": 1
      },
      {
        "player": "Hayes Greenway",
        "schoolSlug": "goldthwaite",
        "attempts": 2,
        "yards": 26,
        "touchdowns": 1
      },
      {
        "player": "Stayde Long",
        "schoolSlug": "goldthwaite",
        "attempts": 4,
        "yards": 18,
        "touchdowns": 1
      },
      {
        "player": "Blake Howard",
        "schoolSlug": "goldthwaite",
        "attempts": 1,
        "yards": 9,
        "touchdowns": 0
      }
    ],
    "passing": [
      {
        "player": "Hayes Greenway",
        "schoolSlug": "goldthwaite",
        "completions": 3,
        "attempts": 4,
        "yards": 47,
        "touchdowns": 1,
        "interceptions": 0
      },
      {
        "player": "Blake Howard",
        "schoolSlug": "goldthwaite",
        "completions": 1,
        "attempts": 1,
        "yards": 7,
        "touchdowns": 0,
        "interceptions": 0
      }
    ],
    "receiving": [
      {
        "player": "Aidyn Lee",
        "schoolSlug": "goldthwaite",
        "receptions": 1,
        "yards": 20,
        "touchdowns": 0
      },
      {
        "player": "Blaine Hall",
        "schoolSlug": "goldthwaite",
        "receptions": 1,
        "yards": 15,
        "touchdowns": 1
      },
      {
        "player": "Stayde Long",
        "schoolSlug": "goldthwaite",
        "receptions": 1,
        "yards": 12,
        "touchdowns": 0
      },
      {
        "player": "Alberto Perales",
        "schoolSlug": "goldthwaite",
        "receptions": 1,
        "yards": 7,
        "touchdowns": 0
      }
    ],
    "completeness": [
      {
        "schoolSlug": "goldthwaite",
        "categories": {
          "quarterScoring": {
            "status": "complete",
            "note": "Coach-supplied Goldthwaite report; player lines reconcile to team totals."
          },
          "scoringPlays": {
            "status": "complete",
            "note": "Coach-supplied Goldthwaite report; player lines reconcile to team totals."
          },
          "teamStats": {
            "status": "complete",
            "note": "Coach-supplied Goldthwaite report; player lines reconcile to team totals."
          },
          "rushing": {
            "status": "complete",
            "note": "Coach-supplied Goldthwaite report; player lines reconcile to team totals."
          },
          "passing": {
            "status": "complete",
            "note": "Coach-supplied Goldthwaite report; player lines reconcile to team totals."
          },
          "receiving": {
            "status": "complete",
            "note": "Coach-supplied Goldthwaite report; player lines reconcile to team totals."
          }
        }
      },
      {
        "schoolSlug": "winters",
        "categories": {
          "quarterScoring": {
            "status": "complete"
          },
          "scoringPlays": {
            "status": "complete",
            "note": "Opponent scored zero points."
          },
          "teamStats": {
            "status": "unavailable",
            "note": "Opponent statistics excluded from this Goldthwaite-only update."
          },
          "rushing": {
            "status": "unavailable",
            "note": "Opponent statistics excluded from this Goldthwaite-only update."
          },
          "passing": {
            "status": "unavailable",
            "note": "Opponent statistics excluded from this Goldthwaite-only update."
          },
          "receiving": {
            "status": "unavailable",
            "note": "Opponent statistics excluded from this Goldthwaite-only update."
          }
        }
      }
    ]
  },
  {
    "gameId": "goldthwaite-at-miles-2026-week-6",
    "season": 2026,
    "sourceStatus": "verified",
    "sourceLabel": "Goldthwaite coaching staff; supplied by owner October 5, 2026",
    "quarterScores": [
      {
        "schoolSlug": "goldthwaite",
        "quarters": [
          14,
          27,
          6,
          14
        ],
        "total": 61
      },
      {
        "schoolSlug": "miles",
        "quarters": [
          0,
          0,
          0,
          0
        ],
        "total": 0
      }
    ],
    "scoringPlays": [
      {
        "quarter": 1,
        "schoolSlug": "goldthwaite",
        "description": "Blaine Hall 17-yard touchdown pass from Hayes Greenway (Blake Howard kick)"
      },
      {
        "quarter": 1,
        "schoolSlug": "goldthwaite",
        "description": "Hayes Greenway 18-yard touchdown run (Blake Howard kick)"
      },
      {
        "quarter": 2,
        "schoolSlug": "goldthwaite",
        "description": "Hayes Greenway 4-yard touchdown run (Blake Howard kick)"
      },
      {
        "quarter": 2,
        "schoolSlug": "goldthwaite",
        "description": "Landry Sanderson 71-yard touchdown run (Blake Howard kick)"
      },
      {
        "quarter": 2,
        "schoolSlug": "goldthwaite",
        "description": "Blake Howard 30-yard touchdown pass from Hayes Greenway; no extra point recorded"
      },
      {
        "quarter": 2,
        "schoolSlug": "goldthwaite",
        "description": "Hayes Greenway 15-yard touchdown run (Blake Howard kick)"
      },
      {
        "quarter": 3,
        "schoolSlug": "goldthwaite",
        "description": "Scott Reynolds 62-yard kickoff-return touchdown; no extra point recorded"
      },
      {
        "quarter": 4,
        "schoolSlug": "goldthwaite",
        "description": "Landry Sanderson 17-yard touchdown run (Blake Howard kick)"
      },
      {
        "quarter": 4,
        "schoolSlug": "goldthwaite",
        "description": "Luke Patrick 35-yard touchdown run (Blake Howard kick)"
      }
    ],
    "teamStats": [
      {
        "schoolSlug": "goldthwaite",
        "firstDowns": 18,
        "rushingAttempts": 24,
        "rushingYards": 232,
        "passingYards": 241,
        "totalYards": 473,
        "completions": 16,
        "passAttempts": 20,
        "interceptionsThrown": 0,
        "fumbles": 0,
        "fumblesLost": 0,
        "penalties": 4,
        "penaltyYards": 42
      }
    ],
    "rushing": [
      {
        "player": "Landry Sanderson",
        "schoolSlug": "goldthwaite",
        "attempts": 10,
        "yards": 126,
        "touchdowns": 2
      },
      {
        "player": "Hayes Greenway",
        "schoolSlug": "goldthwaite",
        "attempts": 9,
        "yards": 59,
        "touchdowns": 3
      },
      {
        "player": "Luke Patrick",
        "schoolSlug": "goldthwaite",
        "attempts": 1,
        "yards": 35,
        "touchdowns": 1
      },
      {
        "player": "Aidyn Lee",
        "schoolSlug": "goldthwaite",
        "attempts": 1,
        "yards": 8,
        "touchdowns": 0
      },
      {
        "player": "Owen Campbell",
        "schoolSlug": "goldthwaite",
        "attempts": 3,
        "yards": 4,
        "touchdowns": 0
      }
    ],
    "passing": [
      {
        "player": "Hayes Greenway",
        "schoolSlug": "goldthwaite",
        "completions": 15,
        "attempts": 19,
        "yards": 240,
        "touchdowns": 2,
        "interceptions": 0
      },
      {
        "player": "Blake Howard",
        "schoolSlug": "goldthwaite",
        "completions": 1,
        "attempts": 1,
        "yards": 1,
        "touchdowns": 0,
        "interceptions": 0
      }
    ],
    "receiving": [
      {
        "player": "Blaine Hall",
        "schoolSlug": "goldthwaite",
        "receptions": 5,
        "yards": 84,
        "touchdowns": 1
      },
      {
        "player": "Blake Howard",
        "schoolSlug": "goldthwaite",
        "receptions": 4,
        "yards": 74,
        "touchdowns": 1
      },
      {
        "player": "Aidyn Lee",
        "schoolSlug": "goldthwaite",
        "receptions": 4,
        "yards": 37,
        "touchdowns": 0
      },
      {
        "player": "Luke Patrick",
        "schoolSlug": "goldthwaite",
        "receptions": 1,
        "yards": 36,
        "touchdowns": 0
      },
      {
        "player": "Landry Sanderson",
        "schoolSlug": "goldthwaite",
        "receptions": 1,
        "yards": 9,
        "touchdowns": 0
      },
      {
        "player": "Owen Campbell",
        "schoolSlug": "goldthwaite",
        "receptions": 1,
        "yards": 1,
        "touchdowns": 0
      }
    ],
    "completeness": [
      {
        "schoolSlug": "goldthwaite",
        "categories": {
          "quarterScoring": {
            "status": "complete",
            "note": "Coach-supplied Goldthwaite report; player lines reconcile to team totals."
          },
          "scoringPlays": {
            "status": "complete",
            "note": "Coach-supplied Goldthwaite report; player lines reconcile to team totals."
          },
          "teamStats": {
            "status": "complete",
            "note": "Coach-supplied Goldthwaite report; player lines reconcile to team totals."
          },
          "rushing": {
            "status": "complete",
            "note": "Coach-supplied Goldthwaite report; player lines reconcile to team totals."
          },
          "passing": {
            "status": "complete",
            "note": "Coach-supplied Goldthwaite report; player lines reconcile to team totals."
          },
          "receiving": {
            "status": "complete",
            "note": "Coach-supplied Goldthwaite report; player lines reconcile to team totals."
          }
        }
      },
      {
        "schoolSlug": "miles",
        "categories": {
          "quarterScoring": {
            "status": "complete"
          },
          "scoringPlays": {
            "status": "complete",
            "note": "Opponent scored zero points."
          },
          "teamStats": {
            "status": "unavailable",
            "note": "Opponent statistics excluded from this Goldthwaite-only update."
          },
          "rushing": {
            "status": "unavailable",
            "note": "Opponent statistics excluded from this Goldthwaite-only update."
          },
          "passing": {
            "status": "unavailable",
            "note": "Opponent statistics excluded from this Goldthwaite-only update."
          },
          "receiving": {
            "status": "unavailable",
            "note": "Opponent statistics excluded from this Goldthwaite-only update."
          }
        }
      }
    ]
  }
];
