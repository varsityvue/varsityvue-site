import type { SupabaseClient } from "@supabase/supabase-js";
import { projectPublicScoreState, type PublicScoreState } from "@/lib/public-score-state";

// Both score and byline come from one database statement, never independent reads.
export async function loadPublicScoreStates(supabase: SupabaseClient): Promise<PublicScoreState[]> {
  const { data, error } = await supabase.rpc("public_score_states");
  if (!error && Array.isArray(data)) return (data as PublicScoreState[]).map(projectPublicScoreState);

  // Additive rollout: preserve existing scores while the RPC is unavailable.
  // The old projection is explicitly sanitized and never supplies attribution.
  const fallback = await supabase.from("public_game_state")
    .select("game_id,status,home_score,away_score,period,clock,verified,kickoff_override,result_type,official_winner_school_slug")
    .eq("verified", true);
  return ((fallback.data ?? []) as PublicScoreState[]).map((row) => projectPublicScoreState({
    ...row, attribution_type: "none", attribution_username: null,
  }));
}
