import type { Metadata } from "next";
import { getDynamicGamesSnapshot } from "@/lib/dynamic-games";
import { weeklyGameDto, weeklyCenters } from "@/lib/weekly-game-dto";
import { parseWeeklyParams } from "@/lib/unified-games";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserFollowedSchoolSlugs } from "@/lib/followed-schools";
import { getScorekeeperCtaState } from "@/lib/scorekeeper-cta-server";
import WeeklyGamesExplorer from "@/components/WeeklyGamesExplorer";
import ScorekeeperCta from "@/components/ScorekeeperCta";
import HomeMembershipCta from "@/components/HomeMembershipCta";
import PickemPromo from "@/components/PickemPromo";
export const metadata: Metadata = {
  title: "Texas High School Football Games, Scores & Schedules",
  description:
    "Browse weekly Texas high school football matchups, verified live scores, completed games and games near you.",
  alternates: { canonical: "/games" },
};
export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [snapshot, raw, cta, supabase] = await Promise.all([
    getDynamicGamesSnapshot(),
    searchParams,
    getScorekeeperCtaState(),
    createClient(),
  ]);
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  let followedSlugs: string[] = [],
    followFailed = Boolean(authError);
  try {
    if (authError) throw new Error("Session unavailable");
    followedSlugs = [
      ...(await getCurrentUserFollowedSchoolSlugs({ supabase, userId }))
        .schoolSlugs,
    ];
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
      .eq("status", "pending");
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
          initialParams={parseWeeklyParams(raw, games, now)}
          centers={weeklyCenters()}
          followedSlugs={followedSlugs}
          pendingIds={pendingIds}
          signedIn={Boolean(userId)}
          followFailed={followFailed}
          pendingFailed={pendingFailed}
          scoreLoadStatus={snapshot.scoreLoadStatus}
          fetchedAt={now.toISOString()}
        />
        <ScorekeeperCta state={cta} prefetch={false} />
        <HomeMembershipCta surface="scoreboard" />
        <PickemPromo />
      </div>
    </main>
  );
}
