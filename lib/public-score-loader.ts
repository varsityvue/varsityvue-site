import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { projectPublicScoreState, type PublicScoreState } from "@/lib/public-score-state";

export type PublicScoreLoadStatus = "primary" | "fallback" | "failed";

export type PublicScoreLoadResult = {
  states: PublicScoreState[];
  status: PublicScoreLoadStatus;
};

// Both score and byline come from one database statement when the primary RPC is available.
// The fallback preserves verified public scores during additive rollout, but never invents attribution.
export const loadPublicScoreStatesResult = cache(async (supabase: SupabaseClient): Promise<PublicScoreLoadResult> => {
  try {
  const { data, error } = await supabase.rpc("public_score_states").abortSignal(AbortSignal.timeout(3000)).retry(false);
  if (!error && Array.isArray(data)) {
    return {
      states: (data as PublicScoreState[]).map(projectPublicScoreState),
      status: "primary",
    };
  }

  // Never amplify capacity/transport/permission failures with a second read.
  if (error?.code !== "PGRST202") return { states: [], status: "failed" };

  const fallback = await supabase.from("public_game_state")
    .select("game_id,status,home_score,away_score,period,clock,verified,kickoff_override,result_type,official_winner_school_slug")
    .eq("verified", true).abortSignal(AbortSignal.timeout(3000)).retry(false);

  if (!fallback.error) {
    return {
      states: ((fallback.data ?? []) as PublicScoreState[]).map((row) => projectPublicScoreState({
        ...row, attribution_type: "none", attribution_username: null,
      })),
      status: "fallback",
    };
  }

  return { states: [], status: "failed" };
  } catch { return { states: [], status: "failed" }; }
});

export async function loadPublicScoreStates(supabase: SupabaseClient): Promise<PublicScoreState[]> {
  return (await loadPublicScoreStatesResult(supabase)).states;
}
