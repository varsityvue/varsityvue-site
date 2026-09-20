import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getGames } from "@/lib/games";
import { getSupabaseConfig } from "@/lib/supabase/config";

function scheduledTime(value?: string) {
  if (!value) return null;
  const normalized = value.includes("T") ? value : `${value}T19:30:00-05:00`;
  const timestamp = new Date(normalized).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export async function syncMissingScoreIntelligence() {
  const workerSecret = process.env.PRODUCT_EMAIL_WORKER_SECRET;
  if (!workerSecret) return { outcome: "not_configured" as const };
  const { url, publishableKey } = getSupabaseConfig();
  const client = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: states, error: stateError } = await client
    .from("game_state")
    .select("game_id, status, verified, kickoff_override");
  if (stateError) {
    console.error("Missing-score scan could not read game state.", { code: stateError.code });
    return { outcome: "state_failed" as const };
  }

  const stateByGame = new Map((states ?? []).map((state) => [state.game_id, state]));
  const now = Date.now();
  const earliest = now - 48 * 60 * 60 * 1000;
  const latest = now - 4 * 60 * 60 * 1000;
  const candidates: Array<{
    game_id: string;
    week: number | null;
    kickoff: string;
    away_team: string;
    home_team: string;
    away_school_slug: string;
    home_school_slug: string;
  }> = [];
  const resolvedGameIds: string[] = [];

  for (const game of getGames()) {
    if (game.gameType === "bye" || game.gameType === "scrimmage") continue;
    const state = stateByGame.get(game.id);
    const status = state?.verified ? state.status : game.status;
    if (["final", "cancelled", "postponed"].includes(status)) {
      resolvedGameIds.push(game.id);
      continue;
    }
    const kickoff = scheduledTime(state?.kickoff_override ?? game.kickoff);
    if (kickoff === null || kickoff < earliest || kickoff > latest) continue;
    candidates.push({
      game_id: game.id,
      week: game.week ?? null,
      kickoff: new Date(kickoff).toISOString(),
      away_team: game.awayTeam ?? "Away Team",
      home_team: game.homeTeam ?? "Home Team",
      away_school_slug: game.awaySchoolSlug ?? "",
      home_school_slug: game.homeSchoolSlug ?? "",
    });
  }

  const { data, error } = await client.rpc("sync_missing_score_intelligence", {
    worker_secret: workerSecret,
    candidates,
    resolved_game_ids: resolvedGameIds,
  });
  if (error) {
    console.error("Missing-score intelligence sync failed.", { code: error.code });
    return { outcome: "sync_failed" as const };
  }
  return { outcome: "synced" as const, result: data, candidates: candidates.length };
}
