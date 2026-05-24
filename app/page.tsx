import type { Metadata } from "next";
import Link from "next/link";

import { schools } from "@/data/schools";
import { districts } from "@/data/districts";
import { getFeaturedScoreboardGame } from "@/lib/scoreboard";
import { articles } from "@/data/articles";
import { sponsors } from "@/data/sponsors";
import { getStandingsForDistrictId } from "@/lib/standings";
import ScoreStrip from "@/components/ScoreStrip";
import SchoolSearch from "../components/SchoolSearch";

export const metadata: Metadata = {
  title: "VarsityVue | Texas High School Sports Platform",
  description:
    "VarsityVue is a Texas high school sports platform for school hubs, schedules, scores, district standings, matchup pages, coverage, and sponsor visibility.",
};

function formatGameDate(kickoff: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(new Date(kickoff));
}

function formatGameTime(kickoff: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(new Date(kickoff));
}

export default function Home() {
  const featuredGame = getFeaturedScoreboardGame();

  const pilotSchools = schools
    .filter((school) => school.status === "pilot")
    .slice(0, 6);

  const latestArticles = articles.slice(0, 3);
  const activeSponsors = sponsors.filter((sponsor) => sponsor.active).slice(0, 5);

  const featuredDistrict = districts[0];
  const featuredStandings = featuredDistrict
    ? getStandingsForDistrictId(featuredDistrict.id).slice(0, 6)
    : [];

  const featuredSchool = pilotSchools[0];

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.72),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)] px-4 pb-6 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[1.22fr_0.88fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#080808] shadow-2xl">
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(0,0,0,0.98),rgba(0,0,0,0.75)_45%,rgba(122,16,34,0.45))]" />
            <div className="absolute -right-28 top-10 h-96 w-96 rounded-full bg-[#d65a6d]/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-48 w-2/3 bg-gradient-to-t from-[#7A1022]/35 to-transparent" />

            <div className="relative z-10 flex min-h-[590px] flex-col justify-between p-6 sm:p-8 lg:p-10">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <p className="inline-flex rounded bg-[#7A1022] px-3 py-2 text-xs font-black uppercase tracking-[0.24em] text-white shadow-lg">
                    Game of the Week
                  </p>

                  <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">
                    Presented by VarsityVue
                  </p>
                </div>

                <h1 className="mt-7 max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-tight text-[#fff7df] sm:text-7xl lg:text-8xl">
                  {featuredGame
                    ? `${featuredGame.awayTeam} vs ${featuredGame.homeTeam}`
                    : "The Game, Seen Smarter"}
                </h1>

                <div className="mt-7 space-y-2">
                  {featuredGame ? (
                    <>
                      <p className="text-xl font-black text-white">
                        {formatGameDate(featuredGame.kickoff)} ·{" "}
                        {formatGameTime(featuredGame.kickoff)}
                      </p>
                      <p className="text-base font-semibold text-white/55">
                        {featuredGame.venue}
                      </p>
                    </>
                  ) : (
                    <p className="max-w-2xl text-lg leading-8 text-white/65">
                      Texas high school sports hubs, scores, standings,
                      coverage, and sponsor visibility.
                    </p>
                  )}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {featuredGame && (
                    <Link
                      href={`/games/${featuredGame.id}`}
                      className="rounded-xl bg-[#d7193f] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white shadow-[0_0_30px_rgba(215,25,63,0.35)] transition hover:bg-[#f02a4f]"
                    >
                      View Matchup
                    </Link>
                  )}

                  <Link
                    href="/schools"
                    className="rounded-xl border border-white/20 bg-white/[0.06] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/10"
                  >
                    Find Your School
                  </Link>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <Stat value={schools.length.toString()} label="Schools Covered" />
                <Stat value={districts.length.toString()} label="District Hubs" />
                <Stat value="2026" label="Pilot Season" />
              </div>
            </div>
          </div>
          <SchoolSearch schools={schools} />
        </div>
      </section>

      <ScoreStrip />

      <section className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-4 lg:grid-cols-[1fr_0.85fr_0.85fr]">
          <Panel title="Latest Coverage" kicker="News" href="/coverage">
            <div className="space-y-4">
              {latestArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/coverage/${article.slug}`}
                  className="block border-b border-white/10 pb-4 last:border-0 last:pb-0"
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#d65a6d]">
                    {article.type}
                  </p>
                  <h3 className="mt-2 font-black leading-snug text-white">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    {article.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel
            title="District Standings"
            kicker={featuredDistrict?.name ?? "Standings"}
            href="/districts"
          >
            <div className="space-y-3">
              {featuredStandings.map((team, index) => (
                <Link
                  key={team.schoolSlug}
                  href={`/schools/${team.schoolSlug}`}
                  className="grid grid-cols-[32px_1fr_70px_70px] items-center gap-3 rounded-xl bg-black/35 px-3 py-3 text-sm transition hover:bg-white/10"
                >
                  <span className="font-black text-white/45">{index + 1}</span>
                  <span className="truncate font-black text-white">
                    {team.team}
                  </span>
                  <span className="font-bold text-white">
                    {team.districtWins}-{team.districtLosses}
                  </span>
                  <span className="font-bold text-white/55">
                    {team.overallWins}-{team.overallLosses}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel title="Featured Schools" kicker="Pilot Hubs" href="/schools">
            <div className="space-y-3">
              {pilotSchools.slice(0, 4).map((school) => (
                <Link
                  key={school.id}
                  href={`/schools/${school.slug}`}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/35 p-3 transition hover:bg-white/10"
                >
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 text-sm font-black text-white"
                    style={{
                      backgroundColor: `${school.colors.primary}88`,
                    }}
                  >
                    {school.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-white">{school.name}</p>
                    <p className="text-sm text-white/45">{school.mascot}</p>
                  </div>
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </section>

      <section className="px-4 pb-5 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          {featuredSchool && (
            <Link
              href={`/schools/${featuredSchool.slug}`}
              className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl transition hover:-translate-y-1 hover:bg-white/[0.07]"
            >
              <div
                className="absolute inset-0 opacity-45"
                style={{
                  background: `radial-gradient(circle at top right, ${featuredSchool.colors.primary}, transparent 58%)`,
                }}
              />

              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d65a6d]">
                  Featured School
                </p>

                <div className="mt-6 flex items-center gap-5">
                  <div
                    className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 text-2xl font-black text-white"
                    style={{
                      backgroundColor: `${featuredSchool.colors.primary}aa`,
                    }}
                  >
                    {featuredSchool.name.slice(0, 2).toUpperCase()}
                  </div>

                  <div>
                    <h2 className="text-4xl font-black">
                      {featuredSchool.name}
                    </h2>
                    <p className="mt-1 text-white/55">
                      {featuredSchool.mascot}
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <FeatureLink label="Team Home" />
                  <FeatureLink label="Schedule" />
                  <FeatureLink label="District" />
                  <FeatureLink label="Coverage" />
                </div>
              </div>
            </Link>
          )}

          <div className="rounded-[2rem] border border-[#7A1022]/40 bg-gradient-to-r from-[#7A1022]/45 via-black to-black p-6 shadow-2xl">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
                  Local Partners
                </p>
                <h2 className="mt-2 text-3xl font-black">
                  Sponsor inventory built into the platform.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                  VarsityVue gives local businesses visible placement across
                  school hubs, district pages, game pages, and coverage modules.
                </p>
              </div>

              <Link
                href="/sponsors"
                className="rounded-xl border border-white/20 bg-white/10 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
              >
                Become a Sponsor
              </Link>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {activeSponsors.length > 0 ? (
                activeSponsors.map((sponsor) => (
                  <Link
                    key={sponsor.id}
                    href={sponsor.website || "/sponsors"}
                    target={sponsor.website ? "_blank" : undefined}
                    className="rounded-2xl border border-white/10 bg-black/35 p-5 transition hover:bg-white/10"
                  >
                    <p className="font-black text-white">{sponsor.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/45">
                      {sponsor.tier} sponsor
                    </p>
                  </Link>
                ))
              ) : (
                <p className="text-white/60">Sponsor placements available.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-4 md:grid-cols-4">
          <Feature
            title="Live Scores & Alerts"
            body="Real-time score behavior built for game nights."
          />
          <Feature
            title="In-Depth Coverage"
            body="Previews, recaps, spotlights, and district storylines."
          />
          <Feature
            title="Stats & Data"
            body="Standings, schedules, matchup pages, and future rankings."
          />
          <Feature
            title="Built for Fans"
            body="School-native hubs that keep communities coming back."
          />
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/50 p-4 shadow-lg">
      <p className="text-3xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/40">
        {label}
      </p>
    </div>
  );
}

function Panel({
  kicker,
  title,
  href,
  children,
}: {
  kicker: string;
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#d65a6d]">
            {kicker}
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
        </div>

        <Link
          href={href}
          className="text-xs font-black uppercase tracking-[0.16em] text-[#d65a6d]"
        >
          View →
        </Link>
      </div>

      {children}
    </section>
  );
}

function FeatureLink({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white/75">
      {label}
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
      <h3 className="font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/55">{body}</p>
    </div>
  );
}