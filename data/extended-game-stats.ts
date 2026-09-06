export type ExtendedStatRow = {
  player: string;
  schoolSlug: string;
  values: (string | number)[];
};

export type ExtendedStatTable = {
  title: string;
  headers: string[];
  rows: ExtendedStatRow[];
};

export type ExtendedTeamMetric = {
  label: string;
  away: string | number;
  home: string | number;
};

export type ExtendedGameStats = {
  gameId: string;
  sourceLabel: string;
  sourceUrl?: string;
  teamMetrics: ExtendedTeamMetric[];
  tables: ExtendedStatTable[];
  notes?: string[];
};

export const extendedGameStats: ExtendedGameStats[] = [
  {
    gameId: "goldthwaite-at-granger-2026-week-2",
    sourceLabel: "Goldthwaite coaching staff via PressBox Stats",
    sourceUrl: "https://pressboxstats.com/gamecast/16925",
    teamMetrics: [
      { label: "3rd Down", away: "2-9", home: "4-13" },
      { label: "4th Down", away: "1-1", home: "0-3" },
      { label: "Yards / Rush", away: "9.0", home: "3.1" },
      { label: "Yards / Pass", away: "10.4", home: "4.7" },
      { label: "Turnovers", away: 0, home: 1 },
      { label: "Possession", away: "22:17", home: "24:13" },
    ],
    tables: [
      {
        title: "Kicking",
        headers: ["Player", "FG", "FGA", "XP", "XPA", "Long"],
        rows: [
          { player: "Blake Howard", schoolSlug: "goldthwaite", values: [0, 0, 6, 7, 0] },
        ],
      },
      {
        title: "Kickoff Returns",
        headers: ["Player", "KR", "Yds", "Avg", "Long", "TD"],
        rows: [
          { player: "Luke Patrick", schoolSlug: "goldthwaite", values: [1, 26, "26.0", 26, 0] },
          { player: "Noah Hobratsch", schoolSlug: "granger", values: [3, 60, "20.0", 30, 0] },
          { player: "Nicholas Blane", schoolSlug: "granger", values: [1, 34, "34.0", 34, 0] },
        ],
      },
      {
        title: "Punting",
        headers: ["Player", "Punts", "Yds", "Avg", "Long", "In 20", "TB"],
        rows: [
          { player: "Owen Campbell", schoolSlug: "goldthwaite", values: [1, 37, "37.0", 37, 1, 0] },
          { player: "Talen Gardner", schoolSlug: "goldthwaite", values: [1, 35, "35.0", 35, 1, 0] },
          { player: "Tre Castillo", schoolSlug: "granger", values: [6, 236, "39.3", 59, 2, 1] },
        ],
      },
      {
        title: "Punt Returns",
        headers: ["Player", "PR", "Yds", "Avg", "Long", "TD"],
        rows: [
          { player: "Aidyn Lee", schoolSlug: "goldthwaite", values: [1, 43, "43.0", 43, 0] },
        ],
      },
      {
        title: "Defense",
        headers: ["Player", "Tack", "Ast", "TFL", "Sck", "INT", "FR", "PD"],
        rows: [
          { player: "Luke Patrick", schoolSlug: "goldthwaite", values: [0, 0, 0, 0, 1, 0, 0] },
        ],
      },
    ],
    notes: [
      "Goldthwaite's 503 yards included 242 rushing and 261 passing.",
      "Hayes Greenway produced 376 yards of total offense with three passing touchdowns and no interceptions.",
      "Aidyn Lee caught all seven of his targets for 180 yards and three touchdowns.",
      "Landry Sanderson rushed for 120 yards and four touchdowns on 16 carries.",
    ],
  },
];
