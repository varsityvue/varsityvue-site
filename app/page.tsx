import type { Metadata } from "next";
import Link from "next/link";

import { getSchools, getSchoolBySlug } from "@/lib/schools";
import { getGameOfTheWeek } from "@/lib/scoreboard";
import { getGamePreview } from "@/data/game-previews";
import { getStandingForSchool } from "@/lib/standings";
import DistrictSpotlight from "@/components/DistrictSpotlight";
import ScoreStrip from "@/components/ScoreStrip";
import SchoolSearch from "../components/SchoolSearch";
import FeaturedSchoolSpotlight from "@/components/PilotSchoolSpotlight";
import FeaturedMatchups from "@/components/FeaturedMatchups";
import FeaturedCoverage from "@/components/FeaturedCoverage";

export const metadata: Metadata = {
  title: {
    absolute: "VarsityVue | Texas High School Football Scores & Coverage",
  },
  description:
    "Texas high school football scores, schedules, standings, school hubs, matchup pages, player statistics, and local coverage on VarsityVue.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "VarsityVue | Texas High School Football Scores & Coverage",
    description:
      "Texas high school football scores, schedules, standings, school hubs, matchup pages, player statistics, and local coverage on VarsityVue.",
    url: "https://varsityvue.com",
    type: "website",
  },
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

export default function Home() {
  const schools = getSchools();
  const featuredGame = getGameOfTheWeek();
  const featuredPreview = featuredGame ? getGamePreview(featuredGame.id) : undefined;

  const featuredHomeSchool = featuredGame?.homeSchoolSlug
    ? getSchoolBySlug(featuredGame.homeSchoolSlug)
    : undefined;

  const featuredAwaySchool = featuredGame?.awaySchoolSlug
    ? getSchoolBySlug(featuredGame.awaySchoolSlug)
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
      <h1 className="sr-only">
        Texas High School Football Scores, Schedules, Standings and Local Coverage
      </h1>

      <section className="border-b border-white/10 bg-[linear-gradient(120deg,#050505_0%,#090909_52%,#000_100%)] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#080808] shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(139,16,32,0.18),transparent_34%),linear-gradient(115deg,rgba(0,0,0,0.98),rgba(0,0,0,0.82)_55%,rgba(0,0,0,0.96))]" />

            <div className="relative z-10 p-5 sm:p-7 lg:p-9">
              <div className="flex justify-center">
                <p className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/50 px-4 py-2 text-center text-xs font-black uppercase tracking-[0.22em] text-white/75">
                  Game of the Week
                </p>
              </div>

              {featuredGame ? (
                <>
                  <div className="mt-6 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
                    <HeroTeam
                      school={featuredAwaySchool}
                      team={featuredGame.awayTeam ?? "Away"}
                      standing={featuredAwayStanding}
                      align="left"
                    />

                    <div className="flex min-w-[120px] flex-col items-center justify-center py-2 md:px-4">
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
                        <p className="text-sm font-black uppercase tracking-[0.3em] text-white/35">
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

                  <div className="mt-6 text-center">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
                      {featuredGame.week !== undefined ? `Week ${featuredGame.week} · ` : ""}
                      {featuredGame.districtGame ? "District Game" : "Non-District"}
                    </p>
                    <p className="mt-3 text-xl font-black text-white">
                      {formatGameDateTime(featuredGame.kickoff)}
                    </p>

                    {featuredGame.venue && (
                      <p className="mt-1.5 text-sm font-semibold text-white/50">
                        {featuredGame.venue}
                      </p>
                    )}
                  </div>

                  <div className="mx-auto mt-6 max-w-3xl text-center">
                    <h2 className="text-2xl font-black text-white md:text-3xl">
                      {featuredGameFinal
                        ? featuredGame.week !== undefined
                          ? `Week ${featuredGame.week} final is on the board.`
                          : "The final is on the board."
                        : featuredPreview?.title ??
                          (featuredGame.week !== undefined
                            ? `Week ${featuredGame.week} takes center stage.`
                            : "This matchup takes center stage.")}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/55">
                      {featuredGameFinal
                        ? "The verified final is posted. Visit the matchup center for the result and program links."
                        : featuredPreview?.excerpt ??
                          `${featuredGame.awayTeam} and ${featuredGame.homeTeam} meet in one of VarsityVue's featured matchups of the week.`}
                    </p>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <Link
                      href={`/games/${featuredGame.id}`}
                      className="rounded-xl bg-white px-6 py-3.5 text-center text-sm font-black uppercase tracking-[0.16em] text-black transition hover:bg-white/85"
                    >
                      {featuredGameFinal ? "View Final Result" : "View Game of the Week"}
                    </Link>
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <h2 className="text-5xl font-black uppercase leading-[0.9] tracking-tight text-white sm:text-7xl">
                    The Game, Seen Smarter
                  </h2>
                  <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/65">
                    Texas high school football hubs, verified scores, schedules,
                    district standings, player stats, and local coverage.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <SchoolSearch schools={schools} />
          </div>
        </div>
      </section>

      <ScoreStrip />
      <DistrictSpotlight />
      <FeaturedSchoolSpotlight />
      <FeaturedMatchups />
      <FeaturedCoverage />
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
      <h2 className={`${teamNameSize} font-black uppercase leading-none tracking-tight text-white`}>
        {team}
      </h2>
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
