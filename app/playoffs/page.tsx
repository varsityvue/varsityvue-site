import type { Metadata } from "next";
import Link from "next/link";
import { getDynamicGamesSnapshot } from "@/lib/dynamic-games";
import { formatPlayoffKickoff, getPlayoffSchedule } from "@/lib/playoffs";
import { getSchoolBySlug } from "@/lib/schools";

export const metadata: Metadata = {
  title: "2026 Playoff Central | VarsityVue",
  description: "Find Texas high school football playoff schedules, venues and verified scores for VarsityVue schools.",
  alternates: { canonical: "/playoffs" },
};

const sections = [
  { title: "On the schedule", id: "schedule", kinds: ["scheduled"] },
  { title: "Game updates", id: "updates", kinds: ["verified_live", "kickoff_window", "awaiting_verification", "postponed", "cancelled"] },
  { title: "Final results", id: "results", kinds: ["verified_final", "verified_exceptional"] },
];

type PlayoffEntry = ReturnType<typeof getPlayoffSchedule>[number];

function PlayoffCard({ game, presentation }: PlayoffEntry) {
  const teams = [
    { name: game.homeTeam, slug: game.homeSchoolSlug, score: game.homeScore ?? game.score?.home },
    { name: game.awayTeam, slug: game.awaySchoolSlug, score: game.awayScore ?? game.score?.away },
  ];

  return (
    <article className="min-w-0 rounded-2xl border border-white/15 bg-white/[0.05] p-4 sm:p-5">
      <p className="text-xs font-bold text-white/75">
        {game.playoff ? [game.playoff.round, game.playoff.division, game.playoff.region && `Region ${game.playoff.region}`].filter(Boolean).join(" · ") : "Playoffs"}
      </p>
      <h3 className="sr-only">{game.homeTeam} vs. {game.awayTeam}</h3>
      <p className="mt-2 text-xs font-semibold text-amber-200">{presentation.label}</p>
      <ul className="mt-2 divide-y divide-white/10">
        {teams.map((team) => (
          <li key={team.name} className="flex items-center justify-between gap-3 py-2 text-lg font-black">
            {team.slug && getSchoolBySlug(team.slug) ? (
              <Link href={`/schools/${team.slug}`} className="rounded underline decoration-white/30 underline-offset-4 hover:decoration-white focus-visible:outline-2">{team.name}</Link>
            ) : <span>{team.name}</span>}
            {presentation.showScore && <span className="tabular-nums">{team.score}</span>}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-white/80">{formatPlayoffKickoff(game.kickoff)}</p>
      <p className="mt-1 text-sm text-white/70">{game.venue ?? "Venue TBD"}{game.isNeutralSite && " · Neutral site"}</p>
      <Link href={`/games/${game.id}`} aria-label={`Game Center for ${game.homeTeam} vs. ${game.awayTeam}`} className="mt-3 inline-flex min-h-11 items-center rounded-full border border-white/20 px-4 text-sm font-bold hover:bg-white/10 focus-visible:outline-2">
        Game Center →
      </Link>
    </article>
  );
}

export default async function PlayoffsPage() {
  const { games, scoreLoadStatus } = await getDynamicGamesSnapshot();
  const schedule = getPlayoffSchedule(games);
  const divisions = [...new Set(schedule.flatMap(({ game }) => game.playoff ? [game.playoff.division] : []))];

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-8 text-white sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="rounded-3xl border border-white/15 bg-[linear-gradient(125deg,#341018,#111_70%)] p-5 sm:p-9">
          <p className="text-xs font-black uppercase tracking-widest text-amber-200">2026 Texas High School Football</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">Playoff Central</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
            Find your team’s next game, check the kickoff and venue, and come back for verified scores.
          </p>
          <nav aria-label="Playoff Central" className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm font-bold">
            <a href="#schedule" className="inline-flex min-h-11 items-center underline underline-offset-4">Schedule</a>
            <a href="#results" className="inline-flex min-h-11 items-center underline underline-offset-4">Results</a>
            <Link href="/games?intent=scores" className="inline-flex min-h-11 items-center underline underline-offset-4">Full scoreboard</Link>
          </nav>
        </header>
        {scoreLoadStatus === "failed" && <p role="status" className="mt-4 text-sm text-amber-200">Score updates are temporarily unavailable. The published schedule is shown below.</p>}
        {sections.map(({ title, id, kinds }) => {
          const entries = schedule.filter(({ presentation }) => kinds.includes(presentation.kind));
          if (id === "updates" && !entries.length) return null;
          return (
            <section key={id} id={id} className="mt-9 scroll-mt-24" aria-labelledby={`${id}-heading`}>
              <h2 id={`${id}-heading`} className="text-2xl font-black">{title}</h2>
              {entries.length ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">{entries.map((entry) => <PlayoffCard key={entry.game.id} {...entry} />)}</div>
              ) : <p className="mt-2 text-sm text-white/70">{id === "results" ? "Finals will appear here once verified." : "The next confirmed matchups will appear here."}</p>}
            </section>
          );
        })}
        <section className="mt-9 rounded-2xl border border-white/15 p-5" aria-labelledby="follow-schools">
          <h2 id="follow-schools" className="text-xl font-black">Follow your schools</h2>
          <p className="mt-2 text-sm text-white/75">Open a school hub to follow the team and find its schedule, results and coverage.</p>
          <div className="mt-3 flex flex-wrap gap-x-5 text-sm font-bold">
            <Link href="/schools" className="inline-flex min-h-11 items-center underline underline-offset-4">Browse school hubs</Link>
            <Link href="/coverage" className="inline-flex min-h-11 items-center underline underline-offset-4">Read local coverage</Link>
            <a href="https://www.uiltexas.org/football/playoff-brackets" className="inline-flex min-h-11 items-center underline underline-offset-4">UIL brackets{divisions.length > 0 && ` (${divisions.length} divisions covered)`}</a>
          </div>
        </section>
      </div>
    </main>
  );
}
