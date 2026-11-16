import type { Game } from "@/types/platform";
import { statewideDivisions } from "@/data/statewide-playoff-brackets";
import { buildBracketLayout } from "./playoff-bracket-layout";
import { normalizePlayoffDivision } from "./playoff-division";
import { getAreaScheduleMissingDetails } from "./area-round-readiness";

/** Read-only queue: confirmed winners never create or publish a hypothetical game. */
export function getRegionalRoundReadiness(games: Game[]) {
  return statewideDivisions.flatMap(division => {
    const { nodes } = buildBracketLayout(division.id, games);
    return nodes.filter(node => node.round === 2).map(node => {
      const region = ["I", "II", "III", "IV"][node.region];
      const confirmed = node.teams.every(Boolean);
      const matches = confirmed ? games.filter(game => game.season === 2026 && game.gameType === "playoff" &&
        game.playoff?.round === "Regional Semifinal" && normalizePlayoffDivision(game.playoff.division) === normalizePlayoffDivision(division.id) &&
        game.playoff.region === region && node.teams.includes(game.homeTeam ?? "") && node.teams.includes(game.awayTeam ?? "")) : [];
      const game = matches.length === 1 ? matches[0] : undefined;
      return { division: division.id, region, slot: node.index + 1, teams: node.teams, gameId: game?.id,
        status: !confirmed ? "awaiting-results" : matches.length > 1 ? "duplicate-schedule" : !game ? "needs-schedule" :
          getAreaScheduleMissingDetails(game).length ? "needs-details" : "scheduled" };
    });
  });
}
