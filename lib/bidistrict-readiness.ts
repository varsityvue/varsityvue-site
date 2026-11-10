import type { Game } from "@/types/platform";
import { statewideDivisions, regionLabels } from "@/data/statewide-playoff-brackets";
import { normalizePlayoffDivision } from "@/lib/playoff-division";

export type BiDistrictReadiness = {
  division: string;
  region: string;
  slot: number;
  teams: readonly [string, string];
  status: "missing-record" | "duplicate-record" | "needs-details" | "scheduled" | "verified-final" | "awaiting-verification";
  gameId?: string;
  missing: string[];
};

/** Read-only pregame checklist; never creates a matchup or treats a schedule as a result. */
export function getBiDistrictReadiness(games: Game[]): BiDistrictReadiness[] {
  return statewideDivisions.flatMap((division) => division.regions.flatMap((field, regionIndex) => {
    const region = ["I", "II", "III", "IV"][regionIndex];
    return field.map(([a, b], index): BiDistrictReadiness => {
      const base = { division: division.label, region: regionLabels[regionIndex], slot: index + 1, teams: [a, b] as const };
      const matches = games.filter((game) =>
        game.season === 2026 && game.gameType === "playoff" &&
        game.playoff?.round === "Bi-District" &&
        normalizePlayoffDivision(game.playoff.division) === normalizePlayoffDivision(division.id) &&
        game.playoff.region?.replace(/[^a-z0-9]/gi, "").toUpperCase() === region &&
        ((game.homeTeam === a && game.awayTeam === b) || (game.homeTeam === b && game.awayTeam === a)));
      if (!matches.length) return { ...base, status: "missing-record", missing: ["published game record"] };
      if (matches.length > 1) return { ...base, status: "duplicate-record", missing: ["duplicate game records"] };
      const game = matches[0];
      if (game.status === "final") {
        if (game.publicScoreVerified && (
          game.resultType === "forfeit"
            ? Boolean(game.officialWinnerSchoolSlug &&
                [game.homeSchoolSlug, game.awaySchoolSlug].includes(game.officialWinnerSchoolSlug))
            : game.resultType !== "no_contest" &&
              typeof (game.homeScore ?? game.score?.home) === "number" &&
              typeof (game.awayScore ?? game.score?.away) === "number" &&
              (game.homeScore ?? game.score?.home) !== (game.awayScore ?? game.score?.away)
        )) return { ...base, status: "verified-final", gameId: game.id, missing: [] };
        return { ...base, status: "awaiting-verification", gameId: game.id, missing: ["verified final result"] };
      }
      const missing: string[] = [];
      if (!game.kickoff || !game.kickoff.includes("T") || !Number.isFinite(Date.parse(game.kickoff))) missing.push("confirmed kickoff");
      if (!game.venue || game.venue === "Venue TBD") missing.push("confirmed venue");
      if (!game.sourceLabel || game.sourceStatus === "mock") missing.push("source attribution");
      return { ...base, status: missing.length ? "needs-details" : "scheduled", gameId: game.id, missing };
    });
  }));
}
