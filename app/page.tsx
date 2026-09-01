import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

import { getSchools, getPilotSchools, getSchoolBySlug } from "@/lib/schools";
import { getNextGameForSchool } from "@/lib/games";
import { getDistricts, getDistrictById } from "@/lib/districts";
import { getGameOfTheWeek } from "@/lib/scoreboard";
import {
  getStandingForSchool,
  getStandingsForDistrictId,
} from "@/lib/standings";
import DistrictSpotlight from "@/components/DistrictSpotlight";
import HomeSponsorSlot from "@/components/HomeSponsorSlot";
import SchoolBadge from "@/components/SchoolBadge";
import ScoreStrip from "@/components/ScoreStrip";
import SchoolSearch from "../components/SchoolSearch";
import PilotSchoolSpotlight from "@/components/PilotSchoolSpotlight";
import FeaturedMatchups from "@/components/FeaturedMatchups";
import FeaturedCoverage from "@/components/FeaturedCoverage";

export const metadata: Metadata = {
  title: "VarsityVue | Texas High School Sports Platform",
  description:
    "VarsityVue is a Texas high school sports platform for school hubs, schedules, scores, district standings, matchup pages, coverage, and program discovery.",
};

function parseGameDate(kickoff?: string) {
  if (!kickoff) return null;

  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day, 12));
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  const parsedDate = new Date(kickoff);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function formatGameDate(kickoff?: string) {
  const parsedDate = parseGameDate(kickoff);
  if (!parsedDate) return "—";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(parsedDate);
}

function formatGameTime(kickoff?: string) {
  if (!kickoff || !kickoff.includes("T")) return "—";

  const parsedDate = parseGameDate(kickoff);
  if (!parsedDate) return "—";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
  }).format(parsedDate);
}

function formatGameDateTime(kickoff?: string) {
  const date = formatGameDate(kickoff);
  const time = formatGameTime(kickoff);

  if (date === "—") return "Schedule TBD";
  if (time === "—") return date;

  return `${date} · ${time}`;
}

function formatClassification(conference: string, division?: string | null) {
  const divisionLabel =
    division === "D1"
      ? "Division I"
      : division === "D2"
        ? "Division II"
        : division;

  return `${conference}${divisionLabel ? ` ${divisionLabel}` : ""}`;
}

export default function Home() {
  const schools = getSchools();
  const districts = getDistricts();

  const featuredGame = getGameOfTheWeek();
  const featuredPrograms = getPilotSchools().slice(0, 6);

  const featuredDistrict = districts[0];
  const featuredStandings = featuredDistrict
    ? getStandingsForDistrictId(featuredDistrict.id).slice(0, 6)
    : [];
  const featuredDistrictHasResults = featuredStandings.some(
    (team) => team.districtWins > 0 || team.districtLosses > 0
  );

  const featuredSchool = featuredPrograms[0];

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

  const awayScore = featuredGame?.awayScore ?? featuredGame?.score?.away;
  const homeScore = featuredGame?.homeScore ?? featuredGame?.score?.home;
  const featuredGameFinal = featuredGame?.status === "final";

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.20),transparent_30%),linear-gradient(120deg,#050505_0%,#090909_52%,#000_100%)] px-4 pb-6 pt-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[1.22fr_0.88fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#080808] shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(139,16,32,0.16),transparent_30%),radial-gradient(circle_at_85%_42%,rgba(255,255,255,0.07),transparent_30%),linear-gradient(115deg,rgba(0,0,0,0.98),rgba(0,0,0,0.78)_48%,rgba(255,255,255,0.04))]" />
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
                        {featuredGame.week !== undefined
                          ? `Week ${featuredGame.week} Showcase`
                          : "Featured Matchup"}
                      </p>

                      <div className="mt-6 grid items-center gap-5 md:grid-cols-[1fr_auto_1fr]">
                        <HeroTeam
                          school={featuredAwaySchool}
                          team={featuredGame.awayTeam ?? "Away"}
                          standing={featuredAwayStanding}
                          align="left"
                        />

                        <div className="flex min-w-[150px] flex-col items-center justify-center border-y border-white/10 py-4 md:border-x md:border-y-0 md:px-6 md:py-2">
                          {featuredGameFinal &&
                            awayScore !== undefined &&
                            homeScore !== undefined ? (
                            <>
                              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                                Final
                              </p>
                              <div className="mt-2 flex items-center gap-3">
                                <span className="text-5xl font-black leading-none text-white md:text-6xl">
                                  {awayScore}
                                </span>
                                <span className="text-2xl font-black text-white/25">—</span>
                                <span className="text-5xl font-black leading-none text-white md:text-6xl">
                                  {homeScore}
                                </span>
                              </div>
                            </>
                          ) : (
                            <p className="text-2xl font-black uppercase tracking-[0.3em] text-white/45">
                              VS
                            </p>
                          )}
                        </div>

                        <HeroTeam
                          school={featuredHomeSchool}
                          team={featuredGame.homeTeam ?? "Home"}
                          standing={featuredHomeStanding}
                          align="right"
                        />
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap justify-center gap-2">
                      {featuredGame.week !== undefined && (
                        <HeroPill label={`Week ${featuredGame.week}`} />
                      )}
                      <HeroPill
                        label={
                          featuredGame.districtGame
                            ? "District Game"
                            : "Non-District"
                        }
                      />
                      <HeroPill label="VarsityVue Spotlight" />
                    </div>

                    <div className="mt-5 text-center">
                      <p className="text-xl font-black text-white">
                        {formatGameDateTime(featuredGame.kickoff)}
                      </p>

                      {featuredGame.venue && (
                        <p className="mt-2 text-base font-semibold text-white/55">
                          {featuredGame.venue}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="mt-8">
                    <h1 className="max-w-4xl text-5xl font-black uppercase leading-[0.9] tracking-tight text-white sm:text-7xl lg:text-8xl">
                      The Game, Seen Smarter
                    </h1>

                    <p className="mt-6 max-w-2xl text-lg leading-8 text-white/65">
                      Texas high school sports hubs, verified scores, schedules,
                      district standings, player stats, and local coverage.
                    </p>
                  </div>
                )}

                {featuredGame && (
                  <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-white/55">
                      {featuredGameFinal ? "Game of the Week Result" : "Why This Game Matters"}
                    </p>

                    <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">
                      {featuredGameFinal
                        ? featuredGame.week !== undefined
                          ? `Week ${featuredGame.week} final is on the board.`
                          : "The final is on the board."
                        : featuredGame.week !== undefined
                          ? `Week ${featuredGame.week} takes center stage.`
                          : "This matchup takes center stage."}
                    </h2>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
                      {featuredGameFinal
                        ? `The verified final is posted. Visit the matchup center for the result and program links.`
                        : `${featuredGame.awayTeam} and ${featuredGame.homeTeam} meet in one of VarsityVue's featured matchups of the week.`}
                    </p>
                  </div>
                )}

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  {featuredGame && (
                    <Link
                      href={`/games/${featuredGame.id}`}
                      className="rounded-xl bg-white px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-black transition hover:bg-white/85"
                    >
                      {featuredGameFinal ? "View Final Result" : "View Game of the Week"}
                    </Link>
                  )}

                  <Link
                    href="/school-request"
                    className="rounded-xl border border-white/15 bg-black/40 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white/75 transition hover:bg-white/10 hover:text-white"
                  >
                    Recommend Your School
                  </Link>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <Stat value={schools.length.toString()} label="Programs Indexed" />
                <Stat value={districts.length.toString()} label="District Hubs" />
                <Stat value="2026" label="Season" />
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
      <HomeSponsorSlot />
      <FeaturedCoverage />

      <section className="px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] items-start gap-4 lg:grid-cols-[1fr_0.85fr_0.85fr]">
          <Panel title="Latest Coverage" kicker="News" href="/coverage">
            <div className="rounded-2xl border border-[color:var(--vv-primary)]/30 bg-[var(--vv-primary)]/10 p-5">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--vv-accent-soft)]">
                2026 Coverage
              </p>
              <h3 className="mt-3 text-xl font-black text-white">
                Coverage is just getting started.
              </h3>
              <p className="mt-3 text-sm leading-6 text-white/55">
                Follow the 2026 season as VarsityVue adds game previews,
                results, player performances and stories from across the
                region.
              </p>
              <Link
                href="/coverage"
                className="mt-5 inline-flex text-xs font-black uppercase tracking-[0.16em] text-white/65 transition hover:text-white"
              >
                Explore Coverage →
              </Link>
            </div>
          </Panel>

          <Panel
            title={featuredDistrictHasResults ? "District Standings" : "District Teams"}
            kicker={featuredDistrict?.name ?? "Standings"}
            href="/districts"
          >
            {!featuredDistrictHasResults && (
              <p className="mb-4 rounded-xl border border-white/10 bg-black/35 px-3 py-3 text-xs leading-5 text-white/50">
                District play has not started. Overall records shown are based on verified results currently on file.
              </p>
            )}

            <div className="grid grid-cols-[32px_1fr_58px_58px_44px] gap-3 px-3 pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
              <span>{featuredDistrictHasResults ? "#" : ""}</span>
              <span>Team</span>
              <span>Dist</span>
              <span>Ovr</span>
              <span>Diff</span>
            </div>

            <div className="space-y-3">
              {featuredStandings.map((team, index) => {
                const school = getSchoolBySlug(team.schoolSlug);
                const differential = team.pointsFor - team.pointsAgainst;
                const hasOverallResult = team.overallWins > 0 || team.overallLosses > 0;
                const previousTeam = featuredStandings[index - 1];
                const tiedWithPrevious =
                  featuredDistrictHasResults &&
                  previousTeam &&
                  previousTeam.districtWins === team.districtWins &&
                  previousTeam.districtLosses === team.districtLosses;
                const firstTieIndex = tiedWithPrevious
                  ? featuredStandings.findIndex(
                    (item) =>
                      item.districtWins === team.districtWins &&
                      item.districtLosses === team.districtLosses
                  )
                  : index;
                const tiedWithNext =
                  featuredDistrictHasResults &&
                  featuredStandings[index + 1] &&
                  featuredStandings[index + 1].districtWins === team.districtWins &&
                  featuredStandings[index + 1].districtLosses === team.districtLosses;
                const position =
                  featuredDistrictHasResults && (tiedWithPrevious || tiedWithNext)
                    ? `T-${firstTieIndex + 1}`
                    : featuredDistrictHasResults
                      ? `#${index + 1}`
                      : "—";
                const rowContent = (
                  <>
                    <span className="font-black text-white/45">{position}</span>
                    <span className="truncate font-black text-white">
                      {team.team}
                    </span>
                    <span className="font-bold text-white">
                      {featuredDistrictHasResults
                        ? `${team.districtWins}-${team.districtLosses}`
                        : "—"}
                    </span>
                    <span className="font-bold text-white/55">
                      {hasOverallResult
                        ? `${team.overallWins}-${team.overallLosses}`
                        : "—"}
                    </span>
                    <span className="font-bold text-white/45">
                      {hasOverallResult ? `${differential > 0 ? "+" : ""}${differential}` : "—"}
                    </span>
                  </>
                );

                return school ? (
                  <Link
                    key={team.schoolSlug}
                    href={`/schools/${school.slug}`}
                    className="grid grid-cols-[32px_1fr_58px_58px_44px] items-center gap-3 rounded-xl bg-black/35 px-3 py-3 text-sm transition hover:bg-white/10"
                  >
                    {rowContent}
                  </Link>
                ) : (
                  <div
                    key={team.schoolSlug}
                    className="grid grid-cols-[32px_1fr_58px_58px_44px] items-center gap-3 rounded-xl bg-black/35 px-3 py-3 text-sm"
                  >
                    {rowContent}
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Featured Programs" kicker="School Hubs" href="/schools">
            <div className="space-y-3">
              {featuredPrograms.slice(0, 4).map((school) => (
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
          <div className="mx-auto max-w-[1440px]">
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
                    value={featuredSchoolDistrict?.name ?? "—"}
                  />
                  <MiniProgramStat
                    label="Overall"
                    value={
                      featuredSchoolStanding &&
                        (featuredSchoolStanding.overallWins > 0 ||
                          featuredSchoolStanding.overallLosses > 0)
                        ? `${featuredSchoolStanding.overallWins}-${featuredSchoolStanding.overallLosses}`
                        : "—"
                    }
                  />
                  <MiniProgramStat
                    label="District"
                    value={
                      featuredSchoolStanding &&
                        (featuredSchoolStanding.districtWins > 0 ||
                          featuredSchoolStanding.districtLosses > 0)
                        ? `${featuredSchoolStanding.districtWins}-${featuredSchoolStanding.districtLosses}`
                        : "—"
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
                          {formatGameDateTime(featuredSchoolNextGame.kickoff)}
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
                    href={`/districts/${featuredSchoolDistrict?.slug ?? featuredSchool.districtId}`}
                    label="Standings"
                  />
                  <FeatureLink href="/coverage" label="Coverage" />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-white/10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-4 md:grid-cols-4">
          <Feature
            title="Scores & Results"
            body="Verified scoreboards and matchup pages built for Friday nights."
          />
          <Feature
            title="In-Depth Coverage"
            body="Previews, recaps, spotlights, and district storylines."
          />
          <Feature
            title="Stats & Data"
            body="Standings, schedules, matchup pages, player stats, and district leaderboards as verified data is added."
          />
          <Feature
            title="Built for Fans"
            body="School-native hubs that keep communities connected to their programs."
          />
        </div>
      </section>
    </main>
  );
}

function HeroTeam({
  school,
  team,
  standing,
  align,
}: {
  school?: ReturnType<typeof getSchoolBySlug>;
  team: string;
  standing?: ReturnType<typeof getStandingForSchool>;
  align: "left" | "right";
}) {
  const teamNameSize =
    team.length >= 11
      ? "text-3xl lg:text-3xl xl:text-4xl"
      : team.length >= 8
        ? "text-3xl lg:text-4xl xl:text-4xl"
        : "text-4xl lg:text-5xl xl:text-6xl";

  return (
    <div data-side={align} className="min-w-0 text-center">
      <h1 className={`${teamNameSize} font-black uppercase leading-none tracking-tight text-white`}>
        {team}
      </h1>
      {school?.mascot && (
        <p className="mt-2 text-sm font-black uppercase tracking-[0.22em] text-white/45">
          {school.mascot}
        </p>
      )}
      <RecordLine
        overallWins={standing?.overallWins}
        overallLosses={standing?.overallLosses}
        districtWins={standing?.districtWins}
        districtLosses={standing?.districtLosses}
      />
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
  const hasOverallResult =
    (overallWins ?? 0) > 0 || (overallLosses ?? 0) > 0;
  const hasDistrictResult =
    (districtWins ?? 0) > 0 || (districtLosses ?? 0) > 0;

  return (
    <p className="mt-2 text-sm font-black uppercase tracking-[0.12em] text-white/55">
      {hasOverallResult
        ? `${overallWins ?? 0}-${overallLosses ?? 0} Overall`
        : "Overall —"}{" "}
      ·{" "}
      {hasDistrictResult
        ? `${districtWins ?? 0}-${districtLosses ?? 0} District`
        : "District —"}
    </p>
  );
}

function MiniProgramStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/30 p-3">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
      <p className="mt-1 text-sm font-black capitalize text-white/80">{value}</p>
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
