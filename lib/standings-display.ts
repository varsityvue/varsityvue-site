import type { Standing } from "./standings";

function winPct(wins: number, losses: number) {
  return wins + losses > 0 ? wins / (wins + losses) : -1;
}

// Display order only. District W-L records remain the sole basis for rank labels.
export function sortStandingsForDisplay(standings: Standing[]): Standing[] {
  return [...standings].sort((a, b) => {
    const districtPct = winPct(b.districtWins, b.districtLosses) - winPct(a.districtWins, a.districtLosses);
    if (districtPct !== 0) return districtPct;
    if (a.districtWins !== b.districtWins) return b.districtWins - a.districtWins;
    // Keep distinct district records together (including winless records).
    if (a.districtLosses !== b.districtLosses) return a.districtLosses - b.districtLosses;
    const overallPct = (b.overallRecordKnown ? winPct(b.overallWins, b.overallLosses) : -1) -
      (a.overallRecordKnown ? winPct(a.overallWins, a.overallLosses) : -1);
    if (overallPct !== 0) return overallPct;
    if (a.overallWins !== b.overallWins) return b.overallWins - a.overallWins;
    return a.team.localeCompare(b.team);
  });
}
