import type { Game } from "@/types/platform";
import { statewideDivisions, regionLabels } from "@/data/statewide-playoff-brackets";
import { normalizePlayoffDivision } from "@/lib/playoff-division";
import { buildRegionalRounds } from "@/lib/playoff-bracket-advancement";

export type AreaRoundReadiness = {
  region: string;
  slot: number;
  teams: readonly [string | null, string | null];
  status: "awaiting-results" | "needs-schedule" | "needs-details" | "scheduled" | "duplicate-schedule";
  gameId?: string;
  missing: string[];
};

/** Read-only publishing queue. Never guesses winners, kickoff times, or venues. */
export function getAreaRoundReadiness(games: Game[]): AreaRoundReadiness[] {
  return statewideDivisions.flatMap((division) => division.regions.flatMap((field, regionIndex) => {
    if (!field) return [];
    const regionCode = ["I", "II", "III", "IV"][regionIndex];
    const regionTitle = `${division.label} · ${regionLabels[regionIndex]}`;
    const { roundTeams } = buildRegionalRounds(field, games, 2026, division.id, regionCode);
    return roundTeams[1].map((pair, index) => {
      const [a, b] = pair;
      const teams: [string | null, string | null] = [a, b];
      if (!a || !b) return {
        region: regionTitle, slot: index + 1, teams,
        status: "awaiting-results" as const, missing: ["verified first-round winners"],
      };
      const matches = games.filter((game) =>
        game.season === 2026 && game.gameType === "playoff" &&
        game.playoff?.round === "Area" &&
        normalizePlayoffDivision(game.playoff?.division) === normalizePlayoffDivision(division.id) &&
        game.playoff?.region?.replace(/[^a-z0-9]/gi, "").toUpperCase() === regionCode &&
        ((game.homeTeam === a && game.awayTeam === b) ||
         (game.homeTeam === b && game.awayTeam === a)));
      if (matches.length > 1) return {
        region: regionTitle, slot: index + 1, teams,
        status: "duplicate-schedule" as const, missing: ["duplicate area-round game records"],
      };
      const game = matches[0];
      if (!game) return {
        region: regionTitle, slot: index + 1, teams,
        status: "needs-schedule" as const, missing: ["published game record", "confirmed kickoff", "confirmed venue"],
      };
      const missing: string[] = [];
      if (!game.kickoff || !game.kickoff.includes("T") || !Number.isFinite(Date.parse(game.kickoff))) missing.push("confirmed kickoff");
      if (!game.venue || game.venue === "Venue TBD") missing.push("confirmed venue");
      if (!game.sourceLabel || game.sourceStatus === "mock") missing.push("source attribution");
      return {
        region: regionTitle, slot: index + 1, teams,
        status: (missing.length ? "needs-details" : "scheduled") as "needs-details" | "scheduled", gameId: game.id, missing,
      };
    });
  }));
}
