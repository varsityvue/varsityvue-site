import type { Game } from "@/types/platform";
import { brackets } from "@/data/playoff-bracket-fields";
import { buildRegionalRounds, verifiedWinner } from "@/lib/playoff-bracket-advancement";

export type AreaRoundReadiness = {
  region: string;
  slot: number;
  teams: readonly [string | null, string | null];
  status: "awaiting-results" | "needs-schedule" | "scheduled" | "duplicate-schedule";
  gameId?: string;
  missing: string[];
};

/** Read-only publishing queue. Never guesses winners, kickoff times, or venues. */
export function getAreaRoundReadiness(games: Game[]): AreaRoundReadiness[] {
  return brackets.flatMap((bracket) => {
    const { roundTeams } = buildRegionalRounds(bracket.teams, games);
    return roundTeams[1].map((pair, index) => {
      const [a, b] = pair;
      const teams: [string | null, string | null] = [a, b];
      if (!a || !b) return {
        region: bracket.title, slot: index + 1, teams,
        status: "awaiting-results" as const, missing: ["verified first-round winners"],
      };
      const matches = games.filter((game) =>
        game.season === 2026 && game.gameType === "playoff" &&
        game.playoff?.round === "Area" &&
        ((game.homeTeam === a && game.awayTeam === b) ||
         (game.homeTeam === b && game.awayTeam === a)));
      if (matches.length > 1) return {
        region: bracket.title, slot: index + 1, teams,
        status: "duplicate-schedule" as const, missing: ["duplicate area-round game records"],
      };
      const game = matches[0];
      if (!game) return {
        region: bracket.title, slot: index + 1, teams,
        status: "needs-schedule" as const, missing: ["published game record", "confirmed kickoff", "confirmed venue"],
      };
      const missing: string[] = [];
      if (!game.kickoff || !game.kickoff.includes("T") || !Number.isFinite(Date.parse(game.kickoff))) missing.push("confirmed kickoff");
      if (!game.venue || game.venue === "Venue TBD") missing.push("confirmed venue");
      if (!game.sourceLabel || game.sourceStatus === "mock") missing.push("source attribution");
      return {
        region: bracket.title, slot: index + 1, teams,
        status: "scheduled" as const, gameId: game.id, missing,
      };
    });
  });
}
