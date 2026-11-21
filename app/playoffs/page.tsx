import type { Metadata } from "next";
import { getDynamicGamesSnapshot } from "@/lib/dynamic-games";
import { getPlayoffSchedule } from "@/lib/playoffs";
import PlayoffBracketExperience from "@/components/PlayoffBracketExperience";
import PlayoffGamesAndScores from "@/components/PlayoffGamesAndScores";

export const dynamic = "force-dynamic";

const title = "2026 Texas High School Football Playoff Central";
const description = "Find your team, explore Texas high school football playoff brackets for Classes 2A–4A, and follow kickoff times and verified scores.";
const image = { url: "/playoff-central-2026.png", width: 1200, height: 630, alt: "VarsityVue Playoff Central 2026 — The Road to State" };

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/playoffs" },
  openGraph: {
    title: title + " | VarsityVue",
    description,
    url: "/playoffs",
    siteName: "VarsityVue",
    type: "website",
    images: [image],
  },
  twitter: { card: "summary_large_image", title, description, images: [image.url] },
};

export default async function PlayoffsPage() {
  const { games, scoreLoadStatus } = await getDynamicGamesSnapshot();
  const now = new Date();
  const schedule = getPlayoffSchedule(games, now);

  return (
    <main className="min-h-screen bg-[#08090b] px-4 py-5 text-white sm:px-6 sm:py-9 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-2xl border border-[var(--vv-accent)]/40 bg-[#101013] px-4 py-6 sm:px-8 sm:py-10">
          <h1 className="text-4xl font-black uppercase italic leading-none tracking-tight sm:text-6xl">
            Playoff <span className="text-[var(--vv-accent)]">Central</span>
          </h1>
          <p className="mt-3 text-sm text-white/80 sm:text-lg">Find your team. Follow the bracket. See who’s advancing.</p>
        </header>
        {scoreLoadStatus === "failed" && <p role="status" className="mt-4 text-sm text-white">Score updates are temporarily unavailable. The published schedule remains available.</p>}
        <PlayoffBracketExperience games={games} asOf={now.toISOString()} gamesAndScores={<PlayoffGamesAndScores schedule={schedule} now={now.toISOString()} />} />
      </div>
    </main>
  );
}
