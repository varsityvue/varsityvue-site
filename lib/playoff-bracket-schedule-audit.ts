import type { Game } from "@/types/platform";
import { statewideDivisions, regionLabels } from "@/data/statewide-playoff-brackets";
import { normalizePlayoffDivision } from "@/lib/playoff-division";

export type BracketScheduleConflict = {
  gameId: string;
  division: string;
  region: string;
  issue: "missing-field" | "pairing-not-in-region" | "duplicate-matchup";
};

export function auditPublishedPlayoffGames(games: Game[]): BracketScheduleConflict[] {
  const conflicts: BracketScheduleConflict[] = [];
  const seen = new Set<string>();
  for (const game of games) {
    if (game.season !== 2026 || game.gameType !== "playoff" || game.playoff?.round !== "Bi-District") continue;
    const division = statewideDivisions.find((item) => normalizePlayoffDivision(item.id) === normalizePlayoffDivision(game.playoff?.division));
    if (!division || !game.playoff?.region) continue;
    const regionIndex = regionLabels.findIndex((label) => label.endsWith(game.playoff!.region!));
    if (regionIndex < 0) continue;
    const field = division.regions[regionIndex];
    const region = regionLabels[regionIndex];
    if (!field) {
      conflicts.push({ gameId: game.id, division: division.id, region, issue: "missing-field" });
      continue;
    }
    const key = [division.id, regionIndex, [game.homeTeam, game.awayTeam].sort().join("|")].join(":");
    if (seen.has(key)) conflicts.push({ gameId: game.id, division: division.id, region, issue: "duplicate-matchup" });
    seen.add(key);
    if (!field.some(([a,b]) => (a === game.homeTeam && b === game.awayTeam) || (b === game.homeTeam && a === game.awayTeam))) {
      conflicts.push({ gameId: game.id, division: division.id, region, issue: "pairing-not-in-region" });
    }
  }
  return conflicts;
}
