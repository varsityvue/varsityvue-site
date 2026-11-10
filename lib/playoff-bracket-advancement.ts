import type { Game } from "@/types/platform";
import { normalizePlayoffDivision } from "@/lib/playoff-division";

export function verifiedWinner(game: Game | undefined): string | null {
  if (!game || !game.publicScoreVerified || game.status !== "final") return null;
  if (game.resultType === "no_contest") return null;
  if (game.resultType === "forfeit") {
    if (game.officialWinnerSchoolSlug === game.homeSchoolSlug && game.homeSchoolSlug) return game.homeTeam ?? null;
    if (game.officialWinnerSchoolSlug === game.awaySchoolSlug && game.awaySchoolSlug) return game.awayTeam ?? null;
    return null;
  }
  const home = game.homeScore ?? game.score?.home;
  const away = game.awayScore ?? game.score?.away;
  if (typeof home !== "number" || typeof away !== "number" || home === away) return null;
  return (home > away ? game.homeTeam : game.awayTeam) ?? null;
}

export function buildRegionalRounds(
  teams: readonly (readonly [string, string])[],
  games: Game[],
  season = 2026,
  division?: string,
  region?: string,
) {
  const roundNames = ["Bi-District", "Area", "Regional Semifinal", "Regional Final"] as const;
  const findGame = (a: string, b: string, round: number) => {
    const matches = games.filter((game) => game.season === season && game.gameType === "playoff" &&
      game.playoff?.round === roundNames[round] &&
      (!division || normalizePlayoffDivision(game.playoff?.division) === normalizePlayoffDivision(division)) &&
      (!region || game.playoff?.region?.replace(/[^a-z0-9]/gi, "").toUpperCase() === region.replace(/[^a-z0-9]/gi, "").toUpperCase()) &&
      ((game.homeTeam === a && game.awayTeam === b) || (game.homeTeam === b && game.awayTeam === a)));
    return matches.length === 1 ? matches[0] : undefined;
  };

  const roundGames: (Game | undefined)[][] = [teams.map(([a, b]) => findGame(a, b, 0))];
  const roundTeams: (string | null)[][][] = [teams.map(([a, b]) => [a, b])];

  for (let round = 1; round < 4; round++) {
    const winners = roundGames[round - 1].map(verifiedWinner);
    const slots = Array.from({ length: winners.length / 2 }, (_, i) =>
      [winners[2 * i] ?? null, winners[2 * i + 1] ?? null] as (string | null)[]
    );
    roundTeams.push(slots);
    roundGames.push(slots.map(([a, b]) => a && b ? findGame(a, b, round) : undefined));
  }
  return { roundTeams, roundGames };
}
