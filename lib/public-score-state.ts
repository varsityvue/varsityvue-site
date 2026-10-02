import type { Game } from "@/types/platform";

export type ScoreAttribution = {
  type: "publisher" | "correction" | "outcome" | "verified";
  username?: string;
};

export type PublicScoreState = {
  game_id: string;
  status: Game["status"];
  home_score: number | null;
  away_score: number | null;
  period: string | null;
  clock: string | null;
  verified: boolean;
  kickoff_override: string | null;
  result_type: Game["resultType"] | null;
  official_winner_school_slug: string | null;
  attribution_type?: string;
  attribution_username?: string | null;
};

const reserved = new Set(["varsityvue", "admin", "administrator", "moderator", "support", "official"]);
export function safeScoreUsername(value: unknown): string | undefined {
  return typeof value === "string" && /^[a-z0-9_]{3,30}$/.test(value) && !reserved.has(value)
    ? value : undefined;
}

// Explicit projection also drops unexpected fields if the remote payload changes.
export function projectPublicScoreState(row: PublicScoreState): PublicScoreState {
  return {
    game_id: row.game_id, status: row.status, home_score: row.home_score,
    away_score: row.away_score, period: row.period, clock: row.clock,
    verified: row.verified, kickoff_override: row.kickoff_override,
    result_type: row.result_type, official_winner_school_slug: row.official_winner_school_slug,
    attribution_type: row.attribution_type,
    attribution_username: safeScoreUsername(row.attribution_username) ?? null,
  };
}

export function getScoreAttribution(state: Pick<PublicScoreState, "verified" | "status" | "home_score" | "away_score" | "attribution_type" | "attribution_username">): ScoreAttribution | undefined {
  if (!state.verified) return undefined;
  switch (state.attribution_type) {
    case "publisher":
      return state.status === "live" && typeof state.home_score === "number" && typeof state.away_score === "number"
        ? { type: "publisher", username: safeScoreUsername(state.attribution_username) } : undefined;
    case "correction": return state.status === "live" || state.status === "final" ? { type: "correction" } : undefined;
    case "outcome": return state.status === "final" ? { type: "outcome" } : undefined;
    case "verified": return state.status === "final" ? { type: "verified" } : undefined;
    default: return undefined;
  }
}

export function scoreAttributionText(game: Pick<Game, "status" | "scoreAttribution">, detail = false): string | undefined {
  const attribution = game.scoreAttribution;
  if (!attribution || (game.status !== "live" && !(detail && game.status === "final"))) return undefined;
  if (attribution.type === "publisher") {
    if (game.status !== "live") return undefined;
    const username = safeScoreUsername(attribution.username);
    return username ? `Updated by @${username}` : "Updated by VarsityVue contributor";
  }
  if (attribution.type === "correction") return "Corrected by VarsityVue";
  if (detail && game.status === "final" && attribution.type === "outcome") return "Outcome confirmed by VarsityVue";
  if (detail && game.status === "final" && attribution.type === "verified") return "Verified by VarsityVue";
  return undefined;
}
