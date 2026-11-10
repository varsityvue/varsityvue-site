import type { Game } from "@/types/platform";
import { normalizePlayoffDivision } from "@/lib/playoff-division";
import { buildRegionalRounds, verifiedWinner } from "@/lib/playoff-bracket-advancement";
import { statewideDivisions, stateSemifinalRegionPairs } from "@/data/statewide-playoff-brackets";

export type StateChampionshipPath = {
  divisionId: string;
  regionalChampions: (string | null)[];
  semifinals: [string | null, string | null][];
  semifinalWinners: (string | null)[];
  final: [string | null, string | null];
  champion: string | null;
};

export function getStateChampionshipPath(divisionId: string, games: Game[]): StateChampionshipPath | null {
  const division = statewideDivisions.find((item) => item.id === divisionId);
  if (!division) return null;
  const regionalChampions = division.regions.map((field, regionIndex) => {
    if (!field) return null;
    const { roundGames } = buildRegionalRounds(field, games, 2026, division.id, ["I", "II", "III", "IV"][regionIndex]);
    return verifiedWinner(roundGames[3][0]);
  });
  const semifinals = stateSemifinalRegionPairs.map(([a, b]) =>
    [regionalChampions[a], regionalChampions[b]] as [string | null, string | null]);
  const findVerified = (a: string | null, b: string | null, round: string) => {
    if (!a || !b) return null;
    const matches = games.filter((game) =>
      game.season === 2026 && game.gameType === "playoff" &&
      game.playoff?.round === round &&
      normalizePlayoffDivision(game.playoff?.division) === normalizePlayoffDivision(divisionId) &&
      ((game.homeTeam === a && game.awayTeam === b) ||
       (game.homeTeam === b && game.awayTeam === a)));
    // Ambiguous duplicate records must not produce a winner.
    return matches.length === 1 ? verifiedWinner(matches[0]) : null;
  };
  const semifinalWinners = semifinals.map(([a,b]) => findVerified(a,b,"State Semifinal"));
  const final: [string | null, string | null] = [semifinalWinners[0], semifinalWinners[1]];
  const champion = findVerified(final[0], final[1], "State Championship");
  return { divisionId, regionalChampions, semifinals, semifinalWinners, final, champion };
}
