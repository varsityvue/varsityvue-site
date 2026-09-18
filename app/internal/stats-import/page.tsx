import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import GameStatsReviewTool from "@/components/internal/GameStatsReviewTool";
import { getAllGameStats } from "@/lib/game-stats";
import { getDynamicGames } from "@/lib/dynamic-games";
import { requireActiveMember } from "@/lib/member-access";

export const metadata: Metadata = {
  title: "Stat Import Review",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default async function InternalStatsImportPage() {
  if (process.env.ENABLE_INTERNAL_TOOLS !== "true") {
    notFound();
  }

  const { supabase, userId } = await requireActiveMember();
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((row) => row.role === "admin")) redirect("/account");

  const existingStats = getAllGameStats();
  const gamesWithStats = new Set(existingStats.map((stats) => stats.gameId));
  const canonicalGames = (await getDynamicGames())
    .filter((game) => game.gameType !== "bye")
    .map((game) => ({
      id: game.id,
      season: game.season,
      week: game.week,
      homeSchoolSlug: game.homeSchoolSlug,
      awaySchoolSlug: game.awaySchoolSlug,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      date: game.date,
      kickoff: game.kickoff,
      status: game.status,
      homeScore: game.score?.home ?? game.homeScore,
      awayScore: game.score?.away ?? game.awayScore,
      hasStats: gamesWithStats.has(game.id),
    }));

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-8 max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#F4EBDD]/55">Internal Tool</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Game stat import review</h1>
          <p className="mt-4 text-base leading-7 text-white/50">
            Review new game statistics or load an existing verified box score for a controlled correction. Match data to the canonical VarsityVue schedule, resolve player identities, run validation checks, and generate an approved production object.
          </p>
          <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/5 p-4 text-sm leading-6 text-amber-50/75">
            Review only. This tool validates and prepares production data but does not write to GitHub or publish statistics automatically.
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-bold text-white/45">
            <Link href="/account" className="transition hover:text-white">← Account</Link>
            <Link href="/manage-roster" className="transition hover:text-white">Manage Rosters →</Link>
          </div>
        </div>

        <GameStatsReviewTool canonicalGames={canonicalGames} existingStats={existingStats} />
      </div>
    </main>
  );
}
