import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { getSchools, getPilotSchools, getSchoolBySlug } from "@/lib/schools";
import { getNextGameForSchool } from "@/lib/games";
import { getDistricts, getDistrictById } from "@/lib/districts";
import { getGameOfTheWeek } from "@/lib/scoreboard";
import { getLatestArticles } from "@/lib/articles";
import { getActiveSponsors } from "@/lib/sponsors";
import {
  getStandingForSchool,
  getStandingsForDistrictId,
} from "@/lib/standings";
import GameBadges from "@/components/GameBadges";
import DistrictSpotlight from "@/components/DistrictSpotlight";
import HomeSponsorSlot from "@/components/HomeSponsorSlot";
import SchoolBadge from "@/components/SchoolBadge";
import ScoreStrip from "@/components/ScoreStrip";
import SchoolSearch from "../components/SchoolSearch";
import PilotSchoolSpotlight from "@/components/PilotSchoolSpotlight";
import FeaturedMatchups from "@/components/FeaturedMatchups";
import FeaturedCoverage from "@/components/FeaturedCoverage";
import PilotSchools from "@/components/PilotSchools";

export const metadata: Metadata = {
  title: "VarsityVue | Texas High School Sports Platform",
  description:
    "VarsityVue is a Texas high school sports platform for school hubs, schedules, scores, district standings, matchup pages, coverage, and sponsor visibility.",
};

function parseGameDate(kickoff?: string) {
  if (!kickoff) return null;

  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsedDate = new Date(kickoff);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatGameDate(kickoff?: string) {
  const parsedDate = parseGameDate(kickoff);
  if (!parsedDate) return "TBD";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(parsedDate);
}

function formatGameTime(kickoff?: string) {
  if (!kickoff || !kickoff.includes("T")) return "Time TBD";

  const parsedDate = parseGameDate(kickoff);
  if (!parsedDate) return "Time TBD";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(parsedDate);
}

function formatClassification(
  conference: string,
  division?: string | null
) {
  return `${conference}${division ? ` ${division}` : ""}`;
}

export default function Home() {
  const schools = getSchools();
  const districts = getDistricts();

  const featuredGame = getGameOfTheWeek();
  const pilotSchools = getPilotSchools().slice(0, 6);

  const latestArticles = getLatestArticles(3);
  const activeSponsors = getActiveSponsors(5);

  const featuredDistrict = districts[0];
  const featuredStandings = featuredDistrict
    ? getStandingsForDistrictId(featuredDistrict.id).slice(0, 6)
    : [];

  const featuredSchool = pilotSchools[0];

  const featuredHomeSchool = featuredGame?.homeSchoolSlug
    ? getSchoolBySlug(featuredGame.homeSchoolSlug)
    : undefined;

  const featuredAwaySchool = featuredGame?.awaySchoolSlug
    ? getSchoolBySlug(featuredGame.awaySchoolSlug)
    : undefined;

  const featuredSchoolNextGame = featuredSchool
    ? getNextGameForSchool(featuredSchool.slug)
    : undefined;

  const featuredSchoolDistrict = featuredSchool
    ? getDistrictById(featuredSchool.districtId)
    : undefined;

  const featuredSchoolStanding = featuredSchool
    ? getStandingForSchool(featuredSchool.slug)
    : undefined;

  const featuredHomeStanding = featuredGame?.homeSchoolSlug
    ? getStandingForSchool(featuredGame.homeSchoolSlug)
    : undefined;

  const featuredAwayStanding = featuredGame?.awaySchoolSlug
    ? getStandingForSchool(featuredGame.awaySchoolSlug)
    : undefined;

  const heroLeftColor = featuredAwaySchool?.colors.primary ?? "#8B1020";
  const heroRightColor = featuredHomeSchool?.colors.primary ?? "#001F4D";

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <section
        className="border-b border-white/10 px-4 pb-6 pt-6 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(circle at top left, ${heroLeftColor}55, transparent 34%),
            radial-gradient(circle at top right, ${heroRightColor}44, transparent 34%),
            linear-gradient(120deg, #050505 0%, #090909 52%, #000000 100%)
          `,
        }}
      >
        <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[1.22fr_0.88fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#080808] shadow-2xl">
            <div
              className="absolute inset-0"
              style={{
                background: `
                  radial-gradient(circle at 12% 28%, ${heroLeftColor}33, transparent 30%),
                  radial-gradient(circle at 88% 42%, ${heroRightColor}33, transparent 32%),
                  linear-gradient(115deg, rgba(0,0,0,0.98), rgba(0,0,0,0.75) 48%, rgba(255,255,255,0.05))
                `,
              }}
            />
            <div className="absolute -right-28 top-10 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-48 w-2/3 bg-gradient-to-t from-black/80 to-transparent" />

            <div className="relative z-10 flex min-h-[500px] flex-col justify-between p-6 sm:p-8 lg:p-9">
              <div>
<div className="flex flex-wrap items-center justify-center gap-3">
  <p className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white px-4 py-2 text-center text-xs font-black uppercase tracking-[0.22em] text-black shadow-lg">
    VarsityVue Spotlight
  </p>

  <p className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/50 px-4 py-2 text-center text-xs font-black uppercase tracking-[0.22em] text-white/75">
    Game of the Week
  </p>
</div>
                {featuredGame ? (
                  <>
                    <div className="mt-5 text-center">
                      <p className="text-sm font-black uppercase tracking-[0.35em] text-white/40">
                        Week {featuredGame.week ?? "TBD"} Showcase
                      </p>

                      <div className="mt-4 flex items-center justify-center gap-4">
                        {featuredAwaySchool ? (
                          <SchoolBadge school={featuredAwaySchool} size="sm" />
                        ) : (
                          <TeamChip label="AWY" />
                        )}

                        <div>
                          <h1 className="text-4xl font-black uppercase leading-none tracking-tight text-white md:text-6xl">
                            {featuredGame.awayTeam}
                          </h1>

                          {featuredAwaySchool?.mascot && (
                            <p className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-white/45">
                              {featuredAwaySchool.mascot}
                            </p>
                          )}

                          <RecordLine
                            overallWins={featuredAwayStanding?.overallWins}
                            overallLosses={featuredAwayStanding?.overallLosses}
                            districtWins={featuredAwayStanding?.districtWins}
                            districtLosses={featuredAwayStanding?.districtLosses}
                          />
                        </div>
                      </div>

                      <div className="my-3 text-4xl font-black uppercase tracking-[0.3em] text-[var(--vv-primary)]">
                        VS
                      </div>

                      <div className="flex items-center justify-center gap-4">
                        {featuredHomeSchool ? (
                          <SchoolBadge school={featuredHomeSchool} size="sm" />
                        ) : (
                          <TeamChip label="HME" />
                        )}

                        <div>
                          <h1 className="text-4xl font-black uppercase leading-none tracking-tight text-white md:text-6xl">
                            {featuredGame.homeTeam}
                          </h1>

                          {featuredHomeSchool?.mascot && (
                            <p className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-white/45">
                              {featuredHomeSchool.mascot}
                            </p>
                          )}

                          <RecordLine
                            overallWins={featuredHomeStanding?.overallWins}
                            overallLosses={featuredHomeStanding?.overallLosses}
                            districtWins={featuredHomeStanding?.districtWins}
                            districtLosses={featuredHomeStanding?.districtLosses}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap justify-center gap-2">
                      <HeroPill label={`Week ${featuredGame.week ?? "TBD"}`} />
                      <HeroPill
                        label={
                          featuredGame.districtGame
                            ? "District Game"
                            : "Non-District"
                        }
                      />
                      <HeroPill label="VarsityVue Spotlight" />
                    </div>

                    <div className="mt-5 space-y-3">
                      <GameBadges game={featuredGame} variant="hero" />

                      <p className="text-xl font-black text-white">
                        {formatGameDate(featuredGame.kickoff)} ·{" "}
                        {formatGameTime(featuredGame.kickoff)}
                      </p>

                      <p className="text-base font-semibold text-white/55">
                        {featuredGame.venue}
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="mt-8">
                    <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-tight text-white sm:text-7xl lg:text-8xl">
                      The Game, Seen Smarter
                    </h1>

                    <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
                      Texas high school sports hubs, scores, standings,
                      coverage, and sponsor visibility.
                    </p>
                  </div>
                )}

{featuredGame && (
  <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
    <p className="text-xs font-black uppercase tracking-[0.24em] text-white/55">
      Why This Game Matters
    </p>

    <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">
      Week {featuredGame.week ?? 1} takes center stage.
    </h2>

    <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
      {featuredGame.awayTeam} and {featuredGame.homeTeam} meet in one
      of VarsityVue&apos;s featured matchups of the week. Follow the
      matchup center for kickoff information, program links, game-night
      updates, and postgame results.
    </p>
  </div>
)}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {featuredGame && (
                    <Link
                      href={`/games/${featuredGame.id}`}
                      className="rounded-xl bg-white px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-black transition hover:bg-white/85"
                    >
                      View Game of the Week
                    </Link>
                  )}

                  <Link
                    href="/recommend-school"
                    className="rounded-xl border border-white/15 bg-black/40 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white/75 transition hover:bg-white/10 hover:text-white"
                  >
                    Recommend Your School
                  </Link>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Stat value={schools.length.toString()} label="Programs Indexed" />
                <Stat value={districts.length.toString()} label="District Hubs" />
                <Stat value="2026" label="Pilot Season" />
              </div>
            </div>
          </div>

          <SchoolSearch schools={schools} />
        </div>
      </section>

      <ScoreStrip />

      <DistrictSpotlight />

      <PilotSchoolSpotlight />

      <FeaturedMatchups />

      <PilotSchools />

      <HomeSponsorSlot />

      <FeaturedCoverage />

      <section className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-4 lg:grid-cols-[1fr_0.85fr_0.85fr]">
          <Panel title="Latest Coverage" kicker="News" href="/coverage">
            <div className="space-y-4">
              {latestArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/coverage/${article.slug}`}
                  className="block border-b border-white/10 pb-4 transition hover:text-white last:border-0 last:pb-0"
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
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
            <div className="grid grid-cols-[32px_1fr_58px_58px_44px] gap-3 px-3 pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
              <span>#</span>
              <span>Team</span>
              <span>Dist</span>
              <span>Ovr</span>
              <span>Diff</span>
            </div>

            <div className="space-y-3">
              {featuredStandings.map((team, index) => {
                const differential = team.pointsFor - team.pointsAgainst;

                return (
                  <Link
                    key={team.schoolSlug}
                    href={`/schools/${team.schoolSlug}`}
                    className="grid grid-cols-[32px_1fr_58px_58px_44px] items-center gap-3 rounded-xl bg-black/35 px-3 py-3 text-sm transition hover:bg-white/10"
                  >
                    <span className="font-black text-white/45">#{index + 1}</span>
                    <span className="truncate font-black text-white">
                      {team.team}
                    </span>
                    <span className="font-bold text-white">
                      {team.districtWins}-{team.districtLosses}
                    </span>
                    <span className="font-bold text-white/55">
                      {team.overallWins}-{team.overallLosses}
                    </span>
                    <span className="font-bold text-white/45">
                      {differential > 0 ? "+" : ""}
                      {differential}
                    </span>
                  </Link>
                );
              })}
            </div>
          </Panel>

          <Panel title="Trending Programs" kicker="Pilot Hubs" href="/schools">
            <div className="space-y-3">
              {pilotSchools.slice(0, 4).map((school) => (
                <Link
                  key={school.id}
                  href={`/schools/${school.slug}`}
                  className="flex items-center gap-4 rounded-xl border border-white/10 bg-black/35 p-3 transition hover:bg-white/10"
                >
                  <SchoolBadge school={school} size="xs" />

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

      {featuredSchool && (
        <section className="px-4 pb-5 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1440px] gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div
              className="relative overflow-hidden rounded-[2rem] border border-white/10 p-6 shadow-2xl md:p-8"
              style={{
                background: `
                  radial-gradient(circle at top right, ${featuredSchool.colors.primary}66, transparent 44%),
                  linear-gradient(135deg, rgba(255,255,255,0.07), rgba(0,0,0,0.94) 48%, #000)
                `,
              }}
            >
              <div className="relative">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-white/50">
                      Program Spotlight
                    </p>

                    <h2 className="mt-3 text-4xl font-black uppercase leading-none text-white md:text-5xl">
                      {featuredSchool.name} {featuredSchool.mascot}
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                      A featured VarsityVue school hub built for schedules,
                      standings, matchup coverage, program identity, and fan
                      discovery.
                    </p>
                  </div>

                  <SchoolBadge school={featuredSchool} size="md" />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-4">
                  <MiniProgramStat
                    label="Class"
                    value={formatClassification(
                      featuredSchool.classification.conference,
                      featuredSchool.classification.division
                    )}
                  />
                  <MiniProgramStat
                    label="District"
                    value={featuredSchoolDistrict?.name ?? "TBD"}
                  />
                  <MiniProgramStat
                    label="Overall"
                    value={
                      featuredSchoolStanding
                        ? `${featuredSchoolStanding.overallWins}-${featuredSchoolStanding.overallLosses}`
                        : "0-0"
                    }
                  />
                  <MiniProgramStat
                    label="District"
                    value={
                      featuredSchoolStanding
                        ? `${featuredSchoolStanding.districtWins}-${featuredSchoolStanding.districtLosses}`
                        : "0-0"
                    }
                  />
                </div>

                {featuredSchoolNextGame && (
                  <div className="mt-6 rounded-2xl border border-white/10 bg-black/35 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/45">
                          Next Up
                        </p>

                        <h3 className="mt-2 text-2xl font-black text-white">
                          {featuredSchoolNextGame.awayTeam} at{" "}
                          {featuredSchoolNextGame.homeTeam}
                        </h3>

                        <p className="mt-2 text-sm font-semibold text-white/55">
                          {formatGameDate(featuredSchoolNextGame.kickoff)} ·{" "}
                          {formatGameTime(featuredSchoolNextGame.kickoff)}
                        </p>
                      </div>

                      <Link
                        href={`/games/${featuredSchoolNextGame.id}`}
                        className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 text-center text-xs font-black uppercase tracking-[0.16em] text-white/75 transition hover:bg-white/15 hover:text-white"
                      >
                        View Matchup →
                      </Link>
                    </div>
                  </div>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-4">
                  <FeatureLink
                    href={`/schools/${featuredSchool.slug}`}
                    label="School Hub"
                  />
                  <FeatureLink
                    href={`/schools/${featuredSchool.slug}/schedule`}
                    label="Schedule"
                  />
                  <FeatureLink
                    href={`/districts/${featuredSchoolDistrict?.slug ?? featuredSchool.districtId
                      }`}
                    label="Standings"
                  />
                  <FeatureLink href="/coverage" label="Coverage" />
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-r from-white/[0.08] via-black to-black p-6 shadow-2xl md:p-8">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-white/45">
                  Founding Sponsor Opportunities
                </p>

                <h2 className="mt-2 text-3xl font-black">
                  Own visible placement before the pilot fills up.
                </h2>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                  Founding sponsors receive early visibility across school hubs,
                  district pages, game pages, score modules, and coverage
                  inventory while VarsityVue builds regional attention.
                </p>

                <Link
                  href="/sponsors"
                  className="mt-6 inline-flex rounded-xl border border-white/20 bg-white/10 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
                >
                  Become a Founding Sponsor
                </Link>
              </div>

              <div className="mt-7 grid gap-3">
                {activeSponsors.length > 0 ? (
                  activeSponsors.slice(0, 4).map((sponsor) => (
                    <Link
                      key={sponsor.id}
                      href={sponsor.website || "/sponsors"}
                      target={sponsor.website ? "_blank" : undefined}
                      className="rounded-2xl border border-white/10 bg-black/35 p-5 transition hover:bg-white/10"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-black text-white">{sponsor.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/45">
                            {sponsor.tier} sponsor
                          </p>
                        </div>

                        <span className="text-xs font-black uppercase tracking-[0.14em] text-white/35">
                          View →
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-white/60">Sponsor placements available.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-white/10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-4 md:grid-cols-4">
          <Feature
            title="Live Scores & Alerts"
            body="Real-time scoreboard experiences built for Friday nights."
          />
          <Feature
            title="In-Depth Coverage"
            body="Previews, recaps, spotlights, and district storylines."
          />
          <Feature
            title="Stats & Data"
            body="Standings, schedules, matchup pages, player watchlists, and future rankings."
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

function TeamChip({
  label,
  primary,
  secondary,
}: {
  label: string;
  primary?: string;
  secondary?: string;
}) {
  return (
    <div
      className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl text-xl font-black shadow-lg"
      style={{
        backgroundColor: primary ?? "#8B1020",
        color: secondary ?? "#ffffff",
      }}
    >
      {label}
    </div>
  );
}

function HeroPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black uppercase tracking-[0.14em] text-white/60">
      {label}
    </span>
  );
}

function RecordLine({
  overallWins,
  overallLosses,
  districtWins,
  districtLosses,
}: {
  overallWins?: number;
  overallLosses?: number;
  districtWins?: number;
  districtLosses?: number;
}) {
  return (
    <p className="mt-2 text-sm font-black uppercase tracking-[0.12em] text-white/55">
      {overallWins ?? 0}-{overallLosses ?? 0} Overall · {districtWins ?? 0}-
      {districtLosses ?? 0} District
    </p>
  );
}

function MiniProgramStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-sm font-black capitalize text-white/80">
        {value}
      </p>
    </div>
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
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
            {kicker}
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
        </div>

        <Link
          href={href}
          className="text-xs font-black uppercase tracking-[0.16em] text-white/55 transition hover:text-white"
        >
          View →
        </Link>
      </div>

      {children}
    </section>
  );
}

function FeatureLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-black uppercase tracking-[0.12em] text-white/75 transition hover:bg-white/10 hover:text-white"
    >
      {label}
    </Link>
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