import type { Game } from "@/types/platform";

export function verifiedWinner(game: Game | undefined): string | null {
  if (!game || !game.publicScoreVerified || game.status !== "final") return null;
  const home = game.homeScore ?? game.score?.home;
  const away = game.awayScore ?? game.score?.away;
  if (typeof home !== "number" || typeof away !== "number" || home === away) return null;
  return (home > away ? game.homeTeam : game.awayTeam) ?? null;
}

export function buildRegionalRounds(
  teams: readonly (readonly [string, string])[],
  games: Game[],
  season = 2026,
) {
  const findGame = (a: string, b: string) =>
    games.find((game) => game.season === season && game.gameType === "playoff" &&
      ((game.homeTeam === a && game.awayTeam === b) || (game.homeTeam === b && game.awayTeam === a)));

  const roundGames: (Game | undefined)[][] = [teams.map(([a, b]) => findGame(a, b))];
  const roundTeams: (string | null)[][][] = [teams.map(([a, b]) => [a, b])];

  for (let round = 1; round < 4; round++) {
    const winners = roundGames[round - 1].map(verifiedWinner);
    const slots = Array.from({ length: winners.length / 2 }, (_, i) =>
      [winners[2 * i] ?? null, winners[2 * i + 1] ?? null] as (string | null)[]
    );
    roundTeams.push(slots);
    roundGames.push(slots.map(([a, b]) => a && b ? findGame(a, b) : undefined));
  }
  return { roundTeams, roundGames };
}
