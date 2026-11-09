import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getSchoolLogoPath } from "@/data/school-logos";
import { getDynamicGamesSnapshot } from "@/lib/dynamic-games";
import { formatPlayoffKickoff, getPlayoffSchedule } from "@/lib/playoffs";
import { getSchoolBySlug } from "@/lib/schools";
import LivePlayoffBrackets from "@/components/LivePlayoffBrackets";
import TeamPlayoffPath from "@/components/TeamPlayoffPath";

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
    <article className="group relative min-w-0 overflow-hidden rounded-[1.4rem] border border-white/15 bg-[linear-gradient(145deg,#1a1a1d,#09090b_75%)] shadow-[0_14px_40px_rgba(0,0,0,0.35)] transition hover:border-[#d1324b]/65 hover:shadow-[0_18px_55px_rgba(139,16,32,0.2)]">
      <div className="h-1 bg-[linear-gradient(90deg,#7b1023,#d62b45_55%,#5c0b1a)]" />
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">
            {game.playoff ? [game.playoff.round, game.playoff.division, game.playoff.region && `Region ${game.playoff.region}`].filter(Boolean).join(" · ") : "Playoffs"}
          </p>
          <span className="rounded-full border border-[var(--vv-accent)]/40 bg-[#8b1020]/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#ffffff]">{presentation.label}</span>
        </div>
        <h3 className="sr-only">{game.homeTeam} vs. {game.awayTeam}</h3>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
          {teams.map((team) => {
            const school = team.slug ? getSchoolBySlug(team.slug) : undefined;
            const logoSlug = school?.slug ?? team.slug;
            const logo = logoSlug ? getSchoolLogoPath(logoSlug) : undefined;
            return (
              <div key={team.name} className="flex min-w-0 flex-col items-center gap-2 text-center">
                <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] sm:h-20 sm:w-20">
                  {logo ? <Image src={logo} alt={`${team.name} logo`} fill sizes="80px" className={`object-contain p-2 ${team.slug === "hawley" ? "[filter:drop-shadow(1px_0_0_white)_drop-shadow(-1px_0_0_white)_drop-shadow(0_1px_0_white)_drop-shadow(0_-1px_0_white)_drop-shadow(0_0_5px_rgba(255,255,255,0.95))]" : ""}`} /> : <span className="text-2xl font-black text-white/35">{team.name?.slice(0, 1)}</span>}
                </div>
                {school ? <Link href={`/schools/${team.slug}`} className="w-full break-words text-sm font-black leading-tight text-white hover:text-[#ffffff] sm:text-lg">{team.name}</Link> : <span className="w-full break-words text-sm font-black leading-tight sm:text-lg">{team.name}</span>}
                {presentation.showScore && <span className="text-2xl font-black tabular-nums">{team.score ?? "—"}</span>}
              </div>
            );
          }).reduce<React.ReactNode[]>((nodes, team, index) => {
            if (index > 0) nodes.push(<span key="versus" className="self-center text-sm font-black italic tracking-widest text-[var(--vv-accent)]">VS</span>);
            nodes.push(team);
            return nodes;
          }, [])}
        </div>
        <div className="mt-5 rounded-xl border border-white/10 bg-black/35 px-3 py-3">
          <p className="text-sm font-black text-white">{formatPlayoffKickoff(game.kickoff)}</p>
          <p className="mt-1 text-xs leading-5 text-white/60">{game.venue ?? "Venue TBD"}{game.isNeutralSite && " · Neutral site"}</p>
        </div>
        <Link href={`/games/${game.id}`} aria-label={`Game Center for ${game.homeTeam} vs. ${game.awayTeam}`} className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-[var(--vv-primary)] px-4 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[var(--vv-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2">
          View matchup <span aria-hidden="true" className="ml-2">→</span>
        </Link>
      </div>
    </article>
  );
}

export default async function PlayoffsPage() {
  const { games, scoreLoadStatus } = await getDynamicGamesSnapshot();
  const schedule = getPlayoffSchedule(games);
  const divisions = [...new Set(schedule.flatMap(({ game }) => game.playoff ? [game.playoff.division] : []))];

  return (
    <main className="min-h-screen bg-[#08090b] px-4 py-7 text-white sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="relative isolate flex flex-col items-center overflow-hidden rounded-[1.8rem] text-center border border-[var(--vv-accent)]/40 bg-[#16090e] px-5 py-9 shadow-[0_20px_70px_rgba(0,0,0,0.4)] sm:px-10 sm:py-14">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_85%_0%,rgba(211,38,69,0.4),transparent_55%),linear-gradient(135deg,#300b17_0%,#120a0f_48%,#08090b_100%)]" />
          <div aria-hidden="true" className="pointer-events-none absolute -right-8 top-0 -z-10 select-none text-[12rem] font-black italic leading-none tracking-tighter text-white/[0.035] sm:text-[19rem]">26</div>
          <p className="inline-flex rounded-full border border-[var(--vv-accent)]/40 bg-[var(--vv-primary)]/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#ffffff]">The Road to State · 2026</p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black uppercase italic leading-[0.92] tracking-[-0.055em] sm:text-7xl lg:text-8xl">Playoff <span className="text-[var(--vv-accent)]">Central</span></h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-white/75 sm:text-lg sm:leading-7">The regular season is over. Every game matters now. Follow the matchups, kickoff times and verified results on the road to state.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <a href="#schedule" className="inline-flex min-h-11 items-center rounded-xl bg-[var(--vv-primary)] px-5 text-xs font-black uppercase tracking-wider text-white hover:bg-[var(--vv-primary-hover)]">Explore matchups →</a>
            <a href="#results" className="inline-flex min-h-11 items-center rounded-xl border border-white/25 bg-white/[0.06] px-5 text-xs font-black uppercase tracking-wider">Final scores</a>
            <Link href="/games?intent=scores" className="inline-flex min-h-11 items-center rounded-xl border border-white/25 bg-white/[0.06] px-5 text-xs font-black uppercase tracking-wider">Full scoreboard</Link>
          </div>
        </header>
        {scoreLoadStatus === "failed" && <p role="status" className="mt-4 text-sm text-[#ffffff]">Score updates are temporarily unavailable. The published schedule is shown below.</p>}
        {sections.map(({ title, id, kinds }) => {
          const entries = schedule.filter(({ presentation }) => kinds.includes(presentation.kind));
          if (id === "updates" && !entries.length) return null;
          return (
            <section key={id} id={id} className="mt-11 scroll-mt-24" aria-labelledby={`${id}-heading`}>
              <div className="flex items-center gap-3"><span className="h-7 w-1 rounded-full bg-[var(--vv-primary-hover)]" /><h2 id={`${id}-heading`} className="text-2xl font-black uppercase italic tracking-tight sm:text-3xl">{title}</h2></div>
              {entries.length ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">{entries.map((entry) => <PlayoffCard key={entry.game.id} {...entry} />)}</div>
              ) : <p className="mt-2 text-sm text-white/70">{id === "results" ? "Finals will appear here once verified." : "The next confirmed matchups will appear here."}</p>}
            </section>
          );
        })}
        <TeamPlayoffPath games={games} />
        <LivePlayoffBrackets games={games} />
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
