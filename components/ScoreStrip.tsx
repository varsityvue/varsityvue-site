import ScoreStripGames from "@/components/ScoreStripGames";
import HomeMembershipCta from "@/components/HomeMembershipCta";
import {
  getHomepageScoreboardGames,
  type DynamicScoreState,
} from "@/lib/scoreboard";
import { createPublicReadClient } from "@/lib/supabase/server";
import { loadPublicScoreStatesResult } from "@/lib/public-score-loader";

export default async function ScoreStrip() {
  const supabase = await createPublicReadClient();
  const scoreLoad = await loadPublicScoreStatesResult(supabase);
  const dynamicState = new Map(
    (scoreLoad.states as DynamicScoreState[]).map((state) => [state.game_id, state]),
  );
  const { mode, games } = getHomepageScoreboardGames(12, dynamicState);

  if (games.length === 0) return <HomeMembershipCta />;

  return (
    <>
      <HomeMembershipCta />
      {scoreLoad.status === "failed" && <p role="status" className="border-b border-white/10 bg-amber-300/10 px-4 py-2 text-center text-xs text-amber-100">Live score refresh is temporarily unavailable.</p>}
      <ScoreStripGames mode={mode} games={games} />
    </>
  );
}
