import type { GameStats } from '@/data/game-stats';

// Owner-retransmitted Week 7 records. Never replace unknown TD/INT with zero.
// Opponent final/quarter scores are context only; opponent player/team rows are not imported.
// See docs/WEEK7_STAT_IMPORT_2026-10-12.md for identity/source reconciliation.
export const ownerWeek7GameStats: GameStats[] = [
  {
    "gameId": "hamlin-at-goldthwaite-2026-week-7",
    "season": 2026,
    "sourceLabel": "Owner-supplied Week 7 (Oct 12, 2026) — individual and quarter statistics",
    "quarterScores": [
      {
        "schoolSlug": "hamlin",
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
          21,
          28,
          7,
          7
        ],
        "total": 63
      }
    ],
    "scoringPlays": [
      {
        "quarter": 1,
        "schoolSlug": "goldthwaite",
        "description": "Aidyn Lee 45-yard reception from Hayes Greenway (TD)"
      },
      {
        "quarter": 1,
        "schoolSlug": "goldthwaite",
        "description": "Landry Sanderson 2-yard rushing TD"
      },
      {
        "quarter": 1,
        "schoolSlug": "goldthwaite",
        "description": "Hayes Greenway 39-yard rushing TD"
      },
      {
        "quarter": 2,
        "schoolSlug": "goldthwaite",
        "description": "Luke Patrick 35-yard reception from Hayes Greenway (TD)"
      },
      {
        "quarter": 2,
        "schoolSlug": "goldthwaite",
        "description": "Talen Gardner 28-yard reception from Hayes Greenway (TD)"
      },
      {
        "quarter": 2,
        "schoolSlug": "goldthwaite",
        "description": "Blake Howard 48-yard reception from Hayes Greenway (TD)"
      },
      {
        "quarter": 2,
        "schoolSlug": "goldthwaite",
        "description": "Landry Sanderson 33-yard rushing TD"
      },
      {
        "quarter": 3,
        "schoolSlug": "goldthwaite",
        "description": "Blake Howard 33-yard reception from Hayes Greenway (TD)"
      },
      {
        "quarter": 4,
        "schoolSlug": "goldthwaite",
        "description": "Hayes Greenway 1-yard rushing TD"
      }
    ],
    "teamStats": [
      {
        "schoolSlug": "goldthwaite",
        "firstDowns": 14,
        "rushingAttempts": 12,
        "rushingYards": 173,
        "passingYards": 263,
        "completions": 9,
        "passAttempts": 10,
        "interceptionsThrown": 0,
        "fumbles": 0,
        "fumblesLost": 0,
        "penalties": 8,
        "penaltyYards": 82
      }
    ],
    "passing": [
      {
        "player": "Hayes Greenway",
        "completions": 8,
        "attempts": 9,
        "yards": 263,
        "touchdowns": 5,
        "interceptions": 0,
        "schoolSlug": "goldthwaite"
      },
      {
        "player": "Blake Howard",
        "completions": 1,
        "attempts": 1,
        "yards": 0,
        "touchdowns": 0,
        "interceptions": 0,
        "schoolSlug": "goldthwaite"
      }
    ],
    "rushing": [
      {
        "player": "Landry Sanderson",
        "attempts": 7,
        "yards": 100,
        "touchdowns": 2,
        "schoolSlug": "goldthwaite"
      },
      {
        "player": "Hayes Greenway",
        "attempts": 3,
        "yards": 47,
        "touchdowns": 2,
        "schoolSlug": "goldthwaite"
      },
      {
        "player": "Stayde Long",
        "attempts": 2,
        "yards": 26,
        "touchdowns": 0,
        "schoolSlug": "goldthwaite"
      }
    ],
    "receiving": [
      {
        "player": "Aidyn Lee",
        "receptions": 2,
        "yards": 106,
        "touchdowns": 1,
        "schoolSlug": "goldthwaite"
      },
      {
        "player": "Blake Howard",
        "receptions": 3,
        "yards": 90,
        "touchdowns": 2,
        "schoolSlug": "goldthwaite"
      },
      {
        "player": "Luke Patrick",
        "receptions": 2,
        "yards": 39,
        "touchdowns": 1,
        "schoolSlug": "goldthwaite"
      },
      {
        "player": "Talen Gardner",
        "receptions": 1,
        "yards": 28,
        "touchdowns": 1,
        "schoolSlug": "goldthwaite"
      },
      {
        "player": "Tomas Ferrera",
        "receptions": 1,
        "yards": 0,
        "touchdowns": 0,
        "schoolSlug": "goldthwaite"
      }
    ],
    "completeness": [
      {
        "schoolSlug": "hamlin",
        "categories": {
          "quarterScoring": {
            "status": "complete",
            "note": "Owner-retransmitted 2026-10-12, quarter totals reconcile with final."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "teamStats": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "passing": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "rushing": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "receiving": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          }
        }
      },
      {
        "schoolSlug": "goldthwaite",
        "categories": {
          "quarterScoring": {
            "status": "complete",
            "note": "Owner-retransmitted 2026-10-12, quarter totals reconcile with final."
          },
          "scoringPlays": {
            "status": "partial",
            "note": "Nine touchdown plays supplied. Owner also reported nine Blake Howard PATs; separate PAT play objects/timestamps were not supplied and are not invented."
          },
          "teamStats": {
            "status": "complete",
            "note": "Original owner submission directly supplied and arithmetically reconciled."
          },
          "passing": {
            "status": "complete",
            "note": "Original owner submission directly supplied and arithmetically reconciled."
          },
          "rushing": {
            "status": "complete",
            "note": "Original owner submission directly supplied and arithmetically reconciled."
          },
          "receiving": {
            "status": "complete",
            "note": "Original owner submission directly supplied and arithmetically reconciled."
          }
        }
      }
    ],
    "sourceStatus": "verified"
  },
  {
    "gameId": "comanche-at-millsap-2026-week-7",
    "season": 2026,
    "sourceLabel": "Owner-supplied Week 7 (Oct 12, 2026) — individual and quarter statistics",
    "quarterScores": [
      {
        "schoolSlug": "comanche",
        "quarters": [
          0,
          0,
          0,
          7
        ],
        "total": 7
      },
      {
        "schoolSlug": "millsap",
        "quarters": [
          7,
          7,
          14,
          13
        ],
        "total": 41
      }
    ],
    "scoringPlays": [],
    "teamStats": [],
    "passing": [
      {
        "player": "Cooper Welch",
        "completions": 10,
        "attempts": 29,
        "yards": 141,
        "touchdowns": 1,
        "schoolSlug": "comanche"
      }
    ],
    "rushing": [
      {
        "player": "Zaden Tello",
        "attempts": 6,
        "yards": 47,
        "touchdowns": 0,
        "schoolSlug": "comanche"
      },
      {
        "player": "Elijah Ozuna",
        "attempts": 1,
        "yards": 1,
        "touchdowns": 0,
        "schoolSlug": "comanche"
      },
      {
        "player": "Cooper Welch",
        "attempts": 2,
        "yards": 11,
        "touchdowns": 0,
        "schoolSlug": "comanche"
      },
      {
        "player": "Ladanian Smith",
        "attempts": 14,
        "yards": 31,
        "touchdowns": 0,
        "schoolSlug": "comanche"
      }
    ],
    "receiving": [
      {
        "player": "Zaden Tello",
        "receptions": 4,
        "yards": 78,
        "schoolSlug": "comanche"
      },
      {
        "player": "Junior Gomez",
        "receptions": 1,
        "yards": 2,
        "schoolSlug": "comanche"
      },
      {
        "player": "Lukas Morgan",
        "receptions": 2,
        "yards": 29,
        "touchdowns": 1,
        "schoolSlug": "comanche"
      },
      {
        "player": "Kye Keeter",
        "receptions": 1,
        "yards": 12,
        "schoolSlug": "comanche"
      },
      {
        "player": "Adrian Molina",
        "receptions": 1,
        "yards": 7,
        "schoolSlug": "comanche"
      }
    ],
    "completeness": [
      {
        "schoolSlug": "comanche",
        "categories": {
          "quarterScoring": {
            "status": "complete",
            "note": "Owner-retransmitted 2026-10-12, quarter totals reconcile with final."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "teamStats": {
            "status": "unavailable",
            "note": "Do not reconstruct supplied team totals from player rows."
          },
          "passing": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          },
          "rushing": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          },
          "receiving": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          }
        }
      },
      {
        "schoolSlug": "millsap",
        "categories": {
          "quarterScoring": {
            "status": "complete",
            "note": "Owner-retransmitted 2026-10-12, quarter totals reconcile with final."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "teamStats": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "passing": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "rushing": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "receiving": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          }
        }
      }
    ],
    "sourceStatus": "verified"
  },
  {
    "gameId": "de-leon-at-hawley-2026-week-7",
    "season": 2026,
    "sourceLabel": "Owner-supplied Week 7 (Oct 12, 2026) — individual and quarter statistics",
    "quarterScores": [
      {
        "schoolSlug": "de-leon",
        "quarters": [
          7,
          7,
          14,
          7
        ],
        "total": 35
      },
      {
        "schoolSlug": "hawley",
        "quarters": [
          0,
          7,
          6,
          0
        ],
        "total": 13
      }
    ],
    "scoringPlays": [],
    "teamStats": [],
    "passing": [
      {
        "player": "Hud Price",
        "completions": 9,
        "attempts": 14,
        "yards": 101,
        "touchdowns": 0,
        "schoolSlug": "de-leon",
        "interceptions": 1
      }
    ],
    "rushing": [
      {
        "player": "Lane Couch",
        "attempts": 32,
        "yards": 291,
        "touchdowns": 5,
        "schoolSlug": "de-leon"
      },
      {
        "player": "Beau Morris",
        "attempts": 1,
        "yards": 2,
        "schoolSlug": "de-leon",
        "touchdowns": 0
      },
      {
        "player": "Ed Garcia",
        "attempts": 2,
        "yards": 2,
        "schoolSlug": "de-leon",
        "touchdowns": 0
      }
    ],
    "receiving": [
      {
        "player": "Lane Couch",
        "receptions": 1,
        "yards": 4,
        "schoolSlug": "de-leon",
        "touchdowns": 0
      },
      {
        "player": "Trenton Zmeskal",
        "receptions": 2,
        "yards": 27,
        "schoolSlug": "de-leon",
        "touchdowns": 0
      },
      {
        "player": "Andrew Campbell",
        "receptions": 1,
        "yards": 11,
        "schoolSlug": "de-leon",
        "touchdowns": 0
      },
      {
        "player": "Bryce Burkeen",
        "receptions": 5,
        "yards": 63,
        "schoolSlug": "de-leon",
        "touchdowns": 0
      }
    ],
    "completeness": [
      {
        "schoolSlug": "de-leon",
        "categories": {
          "quarterScoring": {
            "status": "complete",
            "note": "Owner-retransmitted 2026-10-12, quarter totals reconcile with final."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "teamStats": {
            "status": "unavailable",
            "note": "Do not reconstruct supplied team totals from player rows."
          },
          "passing": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          },
          "rushing": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          },
          "receiving": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          }
        }
      },
      {
        "schoolSlug": "hawley",
        "categories": {
          "quarterScoring": {
            "status": "complete",
            "note": "Owner-retransmitted 2026-10-12, quarter totals reconcile with final."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "teamStats": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "passing": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "rushing": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "receiving": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          }
        }
      }
    ],
    "sourceStatus": "verified"
  },
  {
    "gameId": "albany-at-stamford-2026-week-7",
    "season": 2026,
    "sourceLabel": "Owner-supplied Week 7 (Oct 12, 2026) — individual and quarter statistics",
    "quarterScores": [
      {
        "schoolSlug": "albany",
        "quarters": [
          0,
          7,
          14,
          6
        ],
        "total": 27
      },
      {
        "schoolSlug": "stamford",
        "quarters": [
          7,
          14,
          20,
          14
        ],
        "total": 55
      }
    ],
    "scoringPlays": [],
    "teamStats": [],
    "passing": [
      {
        "player": "Clay Chapman",
        "completions": 24,
        "attempts": 32,
        "yards": 291,
        "touchdowns": 2,
        "interceptions": 1,
        "schoolSlug": "albany"
      },
      {
        "player": "Miles Follis",
        "completions": 17,
        "attempts": 21,
        "yards": 305,
        "touchdowns": 2,
        "schoolSlug": "stamford"
      }
    ],
    "rushing": [
      {
        "player": "Lyle Wheeler",
        "attempts": 1,
        "yards": 2,
        "schoolSlug": "albany"
      },
      {
        "player": "Jakobi Roberson",
        "attempts": 11,
        "yards": 33,
        "schoolSlug": "albany"
      },
      {
        "player": "Clay Chapman",
        "attempts": 16,
        "yards": 72,
        "touchdowns": 2,
        "schoolSlug": "albany"
      },
      {
        "player": "Miles Follis",
        "attempts": 4,
        "yards": 17,
        "schoolSlug": "stamford"
      },
      {
        "player": "Slayden Young",
        "attempts": 9,
        "yards": 124,
        "schoolSlug": "stamford"
      },
      {
        "player": "Christopher McCann",
        "attempts": 7,
        "yards": 58,
        "schoolSlug": "stamford"
      },
      {
        "player": "Brenham Walker",
        "attempts": 1,
        "yards": 0,
        "schoolSlug": "stamford"
      }
    ],
    "receiving": [
      {
        "player": "Blake Britting",
        "receptions": 5,
        "yards": 19,
        "schoolSlug": "albany"
      },
      {
        "player": "Aiden Vickers",
        "receptions": 8,
        "yards": 135,
        "touchdowns": 1,
        "schoolSlug": "albany"
      },
      {
        "player": "Lyle Wheeler",
        "receptions": 2,
        "yards": 4,
        "schoolSlug": "albany"
      },
      {
        "player": "Wesley Gleitz",
        "receptions": 4,
        "yards": 44,
        "schoolSlug": "albany"
      },
      {
        "player": "Jakobi Roberson",
        "receptions": 5,
        "yards": 89,
        "touchdowns": 1,
        "schoolSlug": "albany"
      },
      {
        "player": "Brennan Armstrong",
        "receptions": 2,
        "yards": 88,
        "schoolSlug": "stamford"
      },
      {
        "player": "Slayden Young",
        "receptions": 5,
        "yards": 73,
        "schoolSlug": "stamford"
      },
      {
        "player": "Levi Vahlenkamp",
        "receptions": 5,
        "yards": 91,
        "schoolSlug": "stamford"
      },
      {
        "player": "Ace Martinez",
        "receptions": 4,
        "yards": 51,
        "schoolSlug": "stamford"
      }
    ],
    "completeness": [
      {
        "schoolSlug": "albany",
        "categories": {
          "quarterScoring": {
            "status": "complete",
            "note": "Owner-retransmitted 2026-10-12, quarter totals reconcile with final."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "teamStats": {
            "status": "unavailable",
            "note": "Do not reconstruct supplied team totals from player rows."
          },
          "passing": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          },
          "rushing": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          },
          "receiving": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          }
        }
      },
      {
        "schoolSlug": "stamford",
        "categories": {
          "quarterScoring": {
            "status": "complete",
            "note": "Owner-retransmitted 2026-10-12, quarter totals reconcile with final."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "teamStats": {
            "status": "unavailable",
            "note": "Do not reconstruct supplied team totals from player rows."
          },
          "passing": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          },
          "rushing": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          },
          "receiving": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          }
        }
      }
    ],
    "sourceStatus": "verified"
  },
  {
    "gameId": "lampasas-at-stephenville-2026-week-7",
    "season": 2026,
    "sourceLabel": "Owner-supplied Week 7 (Oct 12, 2026) — individual and quarter statistics",
    "quarterScores": [
      {
        "schoolSlug": "lampasas",
        "quarters": [
          7,
          0,
          0,
          7
        ],
        "total": 14
      },
      {
        "schoolSlug": "stephenville",
        "quarters": [
          14,
          7,
          7,
          7
        ],
        "total": 35
      }
    ],
    "scoringPlays": [],
    "teamStats": [],
    "passing": [
      {
        "player": "Trot Jordan",
        "completions": 20,
        "attempts": 27,
        "yards": 291,
        "touchdowns": 3,
        "schoolSlug": "stephenville"
      }
    ],
    "rushing": [
      {
        "player": "Karson Bernal",
        "attempts": 4,
        "yards": 30,
        "touchdowns": 0,
        "schoolSlug": "stephenville"
      },
      {
        "player": "Caleb Gleason",
        "attempts": 13,
        "yards": 92,
        "touchdowns": 0,
        "schoolSlug": "stephenville"
      },
      {
        "player": "Trot Jordan",
        "attempts": 4,
        "yards": 23,
        "touchdowns": 2,
        "schoolSlug": "stephenville"
      },
      {
        "player": "Caden Monk",
        "attempts": 1,
        "yards": 8,
        "touchdowns": 0,
        "schoolSlug": "stephenville"
      }
    ],
    "receiving": [
      {
        "player": "Jhett Banuelos",
        "receptions": 2,
        "yards": 16,
        "touchdowns": 0,
        "schoolSlug": "stephenville"
      },
      {
        "player": "Adan Jergins",
        "receptions": 3,
        "yards": 50,
        "touchdowns": 1,
        "schoolSlug": "stephenville"
      },
      {
        "player": "Pecos Tally",
        "receptions": 3,
        "yards": 50,
        "schoolSlug": "stephenville"
      },
      {
        "player": "Caleb Gleason",
        "receptions": 2,
        "yards": 21,
        "schoolSlug": "stephenville"
      },
      {
        "player": "Caden Monk",
        "receptions": 10,
        "yards": 154,
        "touchdowns": 2,
        "schoolSlug": "stephenville"
      }
    ],
    "completeness": [
      {
        "schoolSlug": "lampasas",
        "categories": {
          "quarterScoring": {
            "status": "complete",
            "note": "Owner-retransmitted 2026-10-12, quarter totals reconcile with final."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "teamStats": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "passing": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "rushing": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "receiving": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          }
        }
      },
      {
        "schoolSlug": "stephenville",
        "categories": {
          "quarterScoring": {
            "status": "complete",
            "note": "Owner-retransmitted 2026-10-12, quarter totals reconcile with final."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "teamStats": {
            "status": "unavailable",
            "note": "Do not reconstruct supplied team totals from player rows."
          },
          "passing": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          },
          "rushing": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          },
          "receiving": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          }
        }
      }
    ],
    "sourceStatus": "verified"
  },
  {
    "gameId": "anson-at-cisco-2026-week-7",
    "season": 2026,
    "sourceLabel": "Owner-supplied Week 7 (Oct 12, 2026) — individual and quarter statistics",
    "quarterScores": [
      {
        "schoolSlug": "anson",
        "quarters": [
          0,
          6,
          0,
          0
        ],
        "total": 6
      },
      {
        "schoolSlug": "cisco",
        "quarters": [
          27,
          3,
          21,
          7
        ],
        "total": 58
      }
    ],
    "scoringPlays": [],
    "teamStats": [],
    "passing": [
      {
        "player": "Colby McIlroy",
        "completions": 13,
        "attempts": 18,
        "yards": 204,
        "touchdowns": 3,
        "interceptions": 0,
        "schoolSlug": "cisco"
      }
    ],
    "rushing": [
      {
        "player": "Corbin Harrison",
        "attempts": 1,
        "yards": -1,
        "touchdowns": 0,
        "schoolSlug": "cisco"
      },
      {
        "player": "Gage Johnson",
        "attempts": 1,
        "yards": 2,
        "touchdowns": 0,
        "schoolSlug": "cisco"
      },
      {
        "player": "Landry Vosburg",
        "attempts": 10,
        "yards": 143,
        "touchdowns": 1,
        "schoolSlug": "cisco"
      },
      {
        "player": "July Johnson",
        "attempts": 19,
        "yards": 129,
        "touchdowns": 1,
        "schoolSlug": "cisco"
      },
      {
        "player": "Colby McIlroy",
        "attempts": 7,
        "yards": 52,
        "touchdowns": 2,
        "schoolSlug": "cisco"
      }
    ],
    "receiving": [
      {
        "player": "Corbin Harrison",
        "receptions": 1,
        "yards": 7,
        "touchdowns": 0,
        "schoolSlug": "cisco"
      },
      {
        "player": "Gage Johnson",
        "receptions": 2,
        "yards": 15,
        "touchdowns": 0,
        "schoolSlug": "cisco"
      },
      {
        "player": "Cannon Harris",
        "receptions": 3,
        "yards": 78,
        "touchdowns": 2,
        "schoolSlug": "cisco"
      },
      {
        "player": "Landry Vosburg",
        "receptions": 4,
        "yards": 79,
        "touchdowns": 1,
        "schoolSlug": "cisco"
      },
      {
        "player": "July Johnson",
        "receptions": 1,
        "yards": 9,
        "touchdowns": 0,
        "schoolSlug": "cisco"
      },
      {
        "player": "Terrick Hernandez",
        "receptions": 2,
        "yards": 16,
        "touchdowns": 0,
        "schoolSlug": "cisco"
      }
    ],
    "completeness": [
      {
        "schoolSlug": "anson",
        "categories": {
          "quarterScoring": {
            "status": "complete",
            "note": "Owner-retransmitted 2026-10-12, quarter totals reconcile with final."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "teamStats": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "passing": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "rushing": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "receiving": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          }
        }
      },
      {
        "schoolSlug": "cisco",
        "categories": {
          "quarterScoring": {
            "status": "complete",
            "note": "Owner-retransmitted 2026-10-12, quarter totals reconcile with final."
          },
          "scoringPlays": {
            "status": "unavailable",
            "note": "Not supplied in retained transcription."
          },
          "teamStats": {
            "status": "unavailable",
            "note": "Do not reconstruct supplied team totals from player rows."
          },
          "passing": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          },
          "rushing": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          },
          "receiving": {
            "status": "partial",
            "note": "Owner retransmitted original player rows. Blank individual fields remain unknown except De Leon TDs explicitly owner-confirmed zero; cross-category discrepancies preserved."
          }
        }
      }
    ],
    "sourceStatus": "verified"
  }
] satisfies GameStats[];
