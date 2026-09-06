import type { Metadata } from "next";
import { notFound } from "next/navigation";

import GameStatsReviewTool from "@/components/internal/GameStatsReviewTool";
import { gameStats } from "@/data/game-stats";
import { getGames } from "@/lib/games";

export const metadata: Metadata = {
  title: "Stat Import Review",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function InternalStatsImportPage() {
  if (process.env.ENABLE_INTERNAL_TOOLS !== "true") {
    notFound();
  }

  const gamesWithStats = new Set(gameStats.map((stats) => stats.gameId));
  const canonicalGames = getGames()
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
            This route is intentionally disabled unless <code className="font-mono text-amber-50">ENABLE_INTERNAL_TOOLS=true</code> is set in the environment. It does not write to GitHub or publish data automatically.
          </div>
        </div>

        <GameStatsReviewTool canonicalGames={canonicalGames} existingStats={gameStats} />
      </div>
    </main>
  );
}
