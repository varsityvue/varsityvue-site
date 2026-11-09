import type { Metadata } from "next";
import Link from "next/link";
import { getDynamicGames } from "@/lib/dynamic-games";

export const metadata: Metadata = {
  title: "2026 Playoff Central | VarsityVue",
  description: "Follow Texas high school football playoff matchups, schedules and verified results on VarsityVue.",
  alternates: { canonical: "/playoffs" },
};

function formatKickoff(kickoff?: string | null) {
  if (!kickoff) return "Kickoff TBD";
  if (/^\d{4}-\d{2}-\d{2}$/.test(kickoff)) {
    const [year, month, day] = kickoff.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day, 12));
    return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric" }).format(date) + " · Time TBD";
  }
  const date = new Date(kickoff);
  if (Number.isNaN(date.getTime())) return "Kickoff TBD";
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export default async function PlayoffsPage() {
  const games = (await getDynamicGames())
    .filter((game) => game.season === 2026 && game.gameType === "playoff")
    .sort((a, b) => (a.kickoff ?? "").localeCompare(b.kickoff ?? ""));
  const upcoming = games.filter((game) => game.status !== "final");
  const completed = games.filter((game) => game.status === "final");

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/50">2026 Texas High School Football</p>
        <h1 className="mt-3 text-4xl font-black uppercase tracking-tight sm:text-6xl">Playoff Central</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
          Follow postseason matchups and results for teams covered by VarsityVue. Games appear here as they are added and verified.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/games" className="rounded-full bg-white px-5 py-3 text-xs font-black uppercase tracking-wide text-black">Full Scoreboard</Link>
          <Link href="/schools" className="rounded-full border border-white/20 px-5 py-3 text-xs font-black uppercase tracking-wide text-white">School Hubs</Link>
          <Link href="/coverage" className="rounded-full border border-white/20 px-5 py-3 text-xs font-black uppercase tracking-wide text-white">Coverage</Link>
        </div>
        <section className="mt-12" aria-labelledby="upcoming-playoffs">
          <h2 id="upcoming-playoffs" className="text-2xl font-black">Upcoming playoff games</h2>
          {upcoming.length === 0 ? <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-white/65">Verified playoff matchups will appear here as schedules are added.</p> :
            <div className="mt-5 grid gap-3 sm:grid-cols-2">{upcoming.map((game) =>
              <Link key={game.id} href={`/games/${game.id}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:bg-white/[0.08]">
                <p className="text-xs font-bold uppercase tracking-wide text-white/50">Playoff matchup</p>
                <h3 className="mt-2 text-xl font-black">{game.homeTeam} vs. {game.awayTeam}</h3>
                <p className="mt-2 text-sm text-white/60">{formatKickoff(game.kickoff)}</p>
                {game.venue && <p className="mt-1 text-sm text-white/50">{game.venue}</p>}
              </Link>
            )}</div>}
        </section>
        <section className="mt-12" aria-labelledby="playoff-results">
          <h2 id="playoff-results" className="text-2xl font-black">Playoff results</h2>
          {completed.length === 0 ? <p className="mt-4 text-white/60">Results will appear here as playoff games are completed.</p> :
            <div className="mt-5 grid gap-3 sm:grid-cols-2">{completed.map((game) =>
              <Link key={game.id} href={`/games/${game.id}`} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                <p className="text-xs font-bold uppercase text-white/50">Final</p>
                <h3 className="mt-2 text-xl font-black">{game.homeTeam} vs. {game.awayTeam}</h3>
                <p className="mt-2 text-sm text-white/60">View verified result and matchup details</p>
              </Link>
            )}</div>}
        </section>
      </div>
    </main>
  );
}
