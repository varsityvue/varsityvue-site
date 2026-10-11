import { getDynamicGamesSnapshot } from "@/lib/dynamic-games";
import { weeklyGameDto, weeklyCenters } from "@/lib/weekly-game-dto";
import { parseWeeklyParams } from "@/lib/unified-games";
import { createPublicReadClient, readPublicClaims } from "@/lib/supabase/server";
import { getCurrentUserFollowedSchoolSlugs } from "@/lib/followed-schools";
import { getScorekeeperCtaState } from "@/lib/scorekeeper-cta-server";
import WeeklyGamesExplorer from "@/components/WeeklyGamesExplorer";
import ScorekeeperCta from "@/components/ScorekeeperCta";
import HomeMembershipCta from "@/components/HomeMembershipCta";
import PickemPromo from "@/components/PickemPromo";
export default async function UnifiedGamesPage({
  searchParams,
  route = "/games",
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
  route?: "/games" | "/scoreboard";
}) {
  const [snapshot, raw, cta, supabase] = await Promise.all([
    getDynamicGamesSnapshot(),
    searchParams,
    getScorekeeperCtaState(),
    createPublicReadClient(),
  ]);
  const { data: claims, error: authError } = await readPublicClaims();
  const userId = claims?.claims?.sub;
  let followedSlugs: string[] = [],
    followFailed = Boolean(authError);
  try {
    if (authError) throw new Error("Session unavailable");
    const follows = await getCurrentUserFollowedSchoolSlugs({ supabase, userId });
    followedSlugs = [...follows.schoolSlugs];
    followFailed = Boolean(follows.unavailable);
  } catch {
    followFailed = true;
  }
  const pendingIds: string[] = [];
  let pendingFailed = false;
  if (userId) {
    const { data, error } = await supabase
      .from("score_submissions")
      .select("game_id")
      .eq("submitted_by", userId)
      .eq("status", "pending").retry(false);
    pendingFailed = Boolean(error);
    for (const row of data ?? []) pendingIds.push(row.game_id);
  }
  const games = snapshot.games.map((g) => weeklyGameDto(g, snapshot.games)),
    now = new Date();
  return (
    <main className="weekly-page">
      <div className="weekly-container">
        <WeeklyGamesExplorer
          games={games}
          route={route}
          initialParams={parseWeeklyParams(route === "/scoreboard" ? { ...raw, intent: "scores" } : raw, games, now)}
          centers={weeklyCenters()}
          followedSlugs={followedSlugs}
          pendingIds={pendingIds}
          signedIn={Boolean(userId)}
          followFailed={followFailed}
          pendingFailed={pendingFailed}
          scoreLoadStatus={snapshot.scoreLoadStatus}
          fetchedAt={now.toISOString()}
        />
        <ScorekeeperCta state={cta} prefetch={false} nearbyCompact />
        <HomeMembershipCta surface="scoreboard" nearbyCompact />
        <PickemPromo nearbyCompact />
      </div>
    </main>
  );
}
