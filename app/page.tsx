import type { Metadata } from "next";
import Link from "next/link";
import { schools } from "@/data/schools";
import { districts } from "@/data/districts";
import { games } from "@/data/games";
import { articles } from "@/data/articles";
import { sponsors } from "@/data/sponsors";

export const metadata: Metadata = {
  title: "VarsityVue | Texas High School Sports Platform",
  description:
    "VarsityVue is a Texas high school sports platform for school hubs, schedules, scores, district coverage, game pages, stories, and sponsor visibility.",
};

function formatGameDate(kickoff: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(new Date(kickoff));
}

export default function Home() {
  const featuredGame =
    games.find((game) => game.status === "upcoming" && game.gameType !== "bye") ??
    games.find((game) => game.gameType !== "bye") ??
    games[0];

  const upcomingGames = games
    .filter((game) => game.status === "upcoming" && game.gameType !== "bye")
    .slice(0, 5);

  const featuredSchools = schools
    .filter((school) => school.status === "pilot")
    .slice(0, 6);

  const latestArticles = articles.slice(0, 4);
  const activeSponsors = sponsors.filter((sponsor) => sponsor.active).slice(0, 4);

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.48),transparent_38%)] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-[#d65a6d]">
              Texas High School Sports Platform
            </p>

            <h1 className="mt-5 text-5xl font-black leading-tight sm:text-7xl">
              The game,
              <br />
              seen smarter.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
              School hubs, district ecosystems, schedules, matchup pages,
              coverage, and sponsor inventory built for local Texas sports.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/schools"
                className="rounded-full bg-[#7A1022] px-6 py-4 text-center font-bold transition hover:bg-[#93142a]"
              >
                Explore Schools
              </Link>

              <Link
                href="/games"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-4 text-center font-bold transition hover:bg-white/10"
              >
                Browse Games
              </Link>

              <Link
                href="/sponsors"
                className="rounded-full border border-white/15 bg-white/5 px-6 py-4 text-center font-bold transition hover:bg-white/10"
              >
                Sponsor
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3">
              <Stat value={schools.length.toString()} label="Schools" />
              <Stat value={districts.length.toString()} label="Districts" />
              <Stat value={games.length.toString()} label="Games" />
            </div>
          </div>

          {featuredGame && (
            <Link
              href={`/games/${featuredGame.id}`}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl transition hover:-translate-y-1 hover:bg-white/[0.08]"
            >
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
                Featured Matchup
              </p>

              <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
                {featuredGame.awayTeam} at {featuredGame.homeTeam}
              </h2>

              <div className="mt-8 grid grid-cols-3 items-center gap-3 text-center">
                <TeamBadge label="Away" team={featuredGame.awayTeam} />
                <div className="text-2xl font-black text-white/35">VS</div>
                <TeamBadge label="Home" team={featuredGame.homeTeam} />
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Info label="Date" value={formatGameDate(featuredGame.kickoff)} />
                <Info label="Week" value={`Week ${featuredGame.week}`} />
                <Info label="Venue" value={featuredGame.venue} />
              </div>

              <p className="mt-6 text-sm font-bold text-[#d65a6d]">
                View matchup →
              </p>
            </Link>
          )}
        </div>
      </section>

      <section className="border-b border-white/10 bg-white/[0.03] px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl gap-4 overflow-x-auto">
          {upcomingGames.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="min-w-[260px] rounded-2xl border border-white/10 bg-black/50 p-4 transition hover:bg-white/10"
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                {formatGameDate(game.kickoff)} · Week {game.week}
              </p>
              <p className="mt-2 font-black">
                {game.awayTeam} at {game.homeTeam}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <SectionHeader
            kicker="School Hubs"
            title="Featured Schools"
            href="/schools"
            linkLabel="View all"
          />

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featuredSchools.map((school) => (
              <Link
                key={school.id}
                href={`/schools/${school.slug}`}
                className="rounded-3xl border bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
                style={{
                  borderColor: `${school.colors.secondary}33`,
                  boxShadow: `0 18px 50px ${school.colors.primary}22`,
                }}
              >
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black"
                  style={{
                    backgroundColor: `${school.colors.primary}66`,
                    color: school.colors.accent,
                  }}
                >
                  {school.name.slice(0, 2).toUpperCase()}
                </div>

                <h3 className="mt-5 text-2xl font-black">{school.name}</h3>
                <p className="mt-1 text-white/55">{school.mascot}</p>

                <p className="mt-5 text-sm font-bold text-[#d65a6d]">
                  View school hub →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.03] px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <SectionHeader
              kicker="District Ecosystem"
              title="District Hubs"
              href="/districts"
              linkLabel="View districts"
            />

            <div className="mt-8 grid gap-4">
              {districts.slice(0, 5).map((district) => (
                <Link
                  key={district.id}
                  href={`/districts/${district.slug}`}
                  className="rounded-2xl border border-white/10 bg-black/45 p-5 transition hover:bg-white/10"
                >
                  <h3 className="text-xl font-black">{district.name}</h3>
                  <p className="mt-1 text-sm text-white/50">
                    Region {district.uilRegion} · District coverage hub
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <SectionHeader
              kicker="Coverage"
              title="Latest Stories"
              href="/coverage"
              linkLabel="View coverage"
            />

            <div className="mt-8 grid gap-4">
              {latestArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/coverage/${article.slug}`}
                  className="rounded-2xl border border-white/10 bg-black/45 p-5 transition hover:bg-white/10"
                >
                  <h3 className="text-xl font-black">{article.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    {article.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-[#7A1022]/30 bg-[#7A1022]/10 p-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
            Sponsor Network
          </p>

          <h2 className="mt-3 text-3xl font-black">
            Built for local business visibility
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {activeSponsors.length > 0 ? (
              activeSponsors.map((sponsor) => (
                <Link
                  key={sponsor.id}
                  href={sponsor.website || "/sponsors"}
                  target={sponsor.website ? "_blank" : undefined}
                  className="rounded-2xl border border-white/10 bg-black/35 p-5 transition hover:bg-white/10"
                >
                  <p className="text-lg font-black">{sponsor.name}</p>
                  <p className="mt-1 text-sm capitalize text-white/50">
                    {sponsor.tier} sponsor
                  </p>
                </Link>
              ))
            ) : (
              <p className="text-white/60">Sponsor placements available.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
      <p className="text-3xl font-black">{value}</p>
      <p className="text-xs uppercase tracking-[0.2em] text-white/40">{label}</p>
    </div>
  );
}

function TeamBadge({ label, team }: { label: string; team: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">
        {label}
      </p>
      <div className="mt-3 flex min-h-24 items-center justify-center rounded-3xl bg-white/10 p-4 text-lg font-black">
        {team}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/40 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-white/35">{label}</p>
      <p className="mt-1 font-bold">{value}</p>
    </div>
  );
}

function SectionHeader({
  kicker,
  title,
  href,
  linkLabel,
}: {
  kicker: string;
  title: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
          {kicker}
        </p>
        <h2 className="mt-3 text-3xl font-black sm:text-4xl">{title}</h2>
      </div>

      <Link
        href={href}
        className="shrink-0 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/70 transition hover:bg-white/10 hover:text-white"
      >
        {linkLabel}
      </Link>
    </div>
  );
}