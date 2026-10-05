import type { ExtendedGameStats } from "@/data/extended-game-stats";

export const goldthwaiteCoachDetailedStats: ExtendedGameStats[] = [
  {
    "gameId": "de-leon-at-goldthwaite-2026-week-4",
    "sourceLabel": "Goldthwaite coaching staff; supplied by owner October 5, 2026",
    "teamMetrics": [],
    "tables": [
      {
        "title": "Field Goals",
        "headers": [
          "Player",
          "FG",
          "FGA",
          "Long"
        ],
        "rows": [
          {
            "player": "Blake Howard",
            "schoolSlug": "goldthwaite",
            "values": [
              1,
              1,
              29
            ]
          }
        ]
      }
    ],
    "notes": [
      "Goldthwaite coach report lists 7/11 passing but six receptions; owner approved 6/11 to reconcile the lines. De Leon's existing statistics are preserved."
    ]
  },
  {
    "gameId": "winters-at-goldthwaite-2026-week-5",
    "sourceLabel": "Goldthwaite coaching staff; supplied by owner October 5, 2026",
    "teamMetrics": [],
    "tables": [],
    "notes": [
      "Aidyn Lee scored on punt returns of 61 and 40 yards and an interception return of 55 yards. These scoring plays do not establish complete return or defensive statistics.",
      "Coach report's CNV label on Blaine Hall's scoring catch is normalized to a six-point touchdown.",
      "Opponent statistics and incomplete possession totals are excluded."
    ]
  },
  {
    "gameId": "goldthwaite-at-miles-2026-week-6",
    "sourceLabel": "Goldthwaite coaching staff; supplied by owner October 5, 2026",
    "teamMetrics": [],
    "tables": [],
    "notes": [
      "Scott Reynolds scored on a 62-yard kickoff return; the report does not establish a complete return-stat line.",
      "Coach report's CNV labels on scoring passes are normalized to six-point touchdowns.",
      "Possession totals sum to 59:12 and are excluded. Down-conversion figures remain unverified and are excluded. Opponent statistics are excluded."
    ]
  }
];
