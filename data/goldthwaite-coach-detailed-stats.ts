import type { ExtendedGameStats } from "@/data/extended-game-stats";

// Week 4 source reconciliation: coach report says 7/11; owner approved 6/11
// to match six receptions. De Leon retains its existing statistics.
// Weeks 5–6 CNV scoring-pass labels are normalized to touchdowns in core data.
// Possession and unverified down conversions are excluded from these imports.
export const goldthwaiteCoachDetailedStats: ExtendedGameStats[] = [
  {
    gameId: "de-leon-at-goldthwaite-2026-week-4",
    sourceLabel: "Goldthwaite coaching staff; supplied by owner October 5, 2026",
    teamMetrics: [
      { label: "Field Goals Made-Att", away: "—", home: "1-1" },
    ],
    tables: [
      {
        title: "Field Goals",
        headers: ["Player", "FG", "FGA", "Long"],
        rows: [{ player: "Blake Howard", schoolSlug: "goldthwaite", values: [1, 1, 29] }],
        completeness: { goldthwaite: { status: "complete", note: "The coach report and scoring summary establish one made field goal on one attempt, from 29 yards." } },
      },
    ],
    notes: [
      "Landry Sanderson rushed for 195 yards and a touchdown on 16 carries.",
      "Hayes Greenway added 64 rushing yards and two touchdowns on eight carries.",
      "Blake Howard made a 29-yard field goal and all three recorded extra-point kicks.",
    ],
  },
];
