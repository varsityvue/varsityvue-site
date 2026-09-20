import type { Metadata } from "next";
import Link from "next/link";

import { getSchools, getSchoolBySlug } from "@/lib/schools";
import { getGameOfTheWeek, type DynamicScoreState } from "@/lib/scoreboard";
import { getDynamicGames } from "@/lib/dynamic-games";
import { getGamePreview } from "@/data/game-previews";
import { getStandingForSchoolFromGames } from "@/lib/standings";
import DistrictSpotlight from "@/components/DistrictSpotlight";
import ScoreStrip from "@/components/ScoreStrip";
import SchoolSearch from "../components/SchoolSearch";
import FeaturedSchoolSpotlight from "@/components/PilotSchoolSpotlight";
import FeaturedMatchups from "@/components/FeaturedMatchups";
import FeaturedCoverage from "@/components/FeaturedCoverage";
import ProgramLogo from "@/components/ProgramLogo";

const homeTitle = "VarsityVue | Texas High School Football Scores & Coverage";
const homeDescription =
  "Texas high school football scores, schedules, standings, school hubs, matchup pages, player statistics, and local coverage on VarsityVue.";

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: homeTitle,
    description: homeDescription,
    url: "https://varsityvue.com",
    type: "website",
    images: [{
      url: "/opengraph-image",
      width: 1200,
      height: 630,
      alt: "VarsityVue Texas high school football scores, stats, school hubs, and local coverage",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: homeTitle,
    description: homeDescription,
    images: ["/opengraph-image"],
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

function getMatchupTeamNameSize(teamNames: string[]) {
  const longestNameLength = Math.max(...teamNames.map((teamName) => teamName.length));

  if (longestNameLength >= 16) return "text-xs sm:text-2xl lg:text-3xl xl:text-4xl";
  if (longestNameLength >= 11) return "text-sm sm:text-3xl lg:text-3xl xl:text-4xl";
  if (longestNameLength >= 8) return "text-base sm:text-3xl lg:text-4xl xl:text-4xl";
  return "text-lg sm:text-4xl lg:text-5xl xl:text-6xl";
}

export default async function Home() {
  const schools = getSchools();
  const dynamicGames = await getDynamicGames();
  const dynamicState = new Map(
    dynamicGames.map((game): [string, DynamicScoreState] => [game.id, {
      game_id: game.id,
      status: game.status,
      home_score: game.homeScore ?? null,
      away_score: game.awayScore ?? null,
      period: game.score?.period ?? null,
      clock: null,
      verified: true,
      kickoff_override: game.kickoff ?? null,
    }]),
  );
  const featuredGame = getGameOfTheWeek(dynamicState);
  const featuredPreview = featuredGame ? getGamePreview(featuredGame.id) : undefined;

  const featuredHomeSchool = featuredGame?.homeSchoolSlug
    ? getSchoolBySlug(featuredGame.homeSchoolSlug)
    : undefined;
  const featuredAwaySchool = featuredGame?.awaySchoolSlug
    ? getSchoolBySlug(featuredGame.awaySchoolSlug)
    : undefined;
  const featuredHomeStanding = featuredGame?.homeSchoolSlug
    ? getStandingForSchoolFromGames(featuredGame.homeSchoolSlug, dynamicGames)
    : undefined;
  const featuredAwayStanding = featuredGame?.awaySchoolSlug
    ? getStandingForSchoolFromGames(featuredGame.awaySchoolSlug, dynamicGames)
    : undefined;

  const awayScore = featuredGame?.awayScore ?? featuredGame?.score?.away;
  const homeScore = featuredGame?.homeScore ?? featuredGame?.score?.home;
  const featuredGameFinal = featuredGame?.status === "final";
  const hasFeaturedFinalScore = featuredGameFinal && awayScore !== undefined && homeScore !== undefined;
  const awayResult = hasFeaturedFinalScore
    ? awayScore > homeScore ? "W" : awayScore < homeScore ? "L" : undefined
    : undefined;
  const homeResult = hasFeaturedFinalScore
    ? homeScore > awayScore ? "W" : homeScore < awayScore ? "L" : undefined
    : undefined;
  const featuredTeamNameSize = featuredGame
    ? getMatchupTeamNameSize([
        featuredGame.awayTeam ?? "Away",
        featuredGame.homeTeam ?? "Home",
      ])
    : "";

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <h1 className="sr-only">Texas High School Football Scores, Schedules, Standings and Local Coverage</h1>

      <section className="border-b border-white/10 bg-[linear-gradient(120deg,#050505_0%,#090909_52%,#000_100%)] px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#080808] shadow-2xl sm:rounded-[2rem]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(139,16,32,0.18),transparent_34%),linear-gradient(115deg,rgba(0,0,0,0.98),rgba(0,0,0,0.82)_55%,rgba(0,0,0,0.96))]" />
            <div className="relative z-10 p-3.5 sm:p-7 lg:p-9">
              <div className="flex justify-center">
                <p className="inline-flex items-center justify-center rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-center text-[10px] font-black uppercase tracking-[0.18em] text-white/75 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.22em]">Game of the Week</p>
              </div>

              {featuredGame ? (
                <>
                  <div className="mt-4 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:mt-6 sm:gap-4">
                    <HeroTeam school={featuredAwaySchool} team={featuredGame.awayTeam ?? "Away"} standing={featuredAwayStanding} align="left" result={awayResult} teamNameSize={featuredTeamNameSize} />
                    <div className="flex min-w-[54px] flex-col items-center justify-center py-1 sm:min-w-[90px] sm:py-2 md:px-4">
                      {featuredGameFinal && awayScore !== undefined && homeScore !== undefined ? (
                        <>
                          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/40 sm:text-[10px] sm:tracking-[0.3em]">Final</p>
                          <div className="mt-1 flex items-center gap-1.5 sm:mt-2 sm:gap-3">
                            <span className="text-3xl font-black leading-none text-white sm:text-5xl md:text-6xl">{awayScore}</span>
                            <span className="text-lg font-black text-white/25 sm:text-2xl">—</span>
                            <span className="text-3xl font-black leading-none text-white sm:text-5xl md:text-6xl">{homeScore}</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/35 sm:text-sm sm:tracking-[0.3em]">VS</p>
                      )}
                    </div>
                    <HeroTeam school={featuredHomeSchool} team={featuredGame.homeTeam ?? "Home"} standing={featuredHomeStanding} align="right" result={homeResult} teamNameSize={featuredTeamNameSize} />
                  </div>

                  <div className="mt-4 text-center sm:mt-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45 sm:text-xs sm:tracking-[0.22em]">
                      {featuredGame.week !== undefined ? `Week ${featuredGame.week} · ` : ""}
                      {featuredGame.districtGame ? "District Game" : "Non-District"}
                    </p>
                    <p className="mt-1.5 text-base font-black text-white sm:mt-3 sm:text-xl">{formatGameDateTime(featuredGame.kickoff)}</p>
                    {featuredGame.venue && (
                      <p className="mt-0.5 text-[11px] font-semibold text-white/50 sm:mt-1.5 sm:text-sm">{featuredGame.venue}</p>
                    )}
                  </div>

                  <div className="mx-auto mt-4 max-w-3xl text-center sm:mt-6">
                    <h2 className="text-lg font-black leading-tight text-white sm:text-2xl md:text-3xl">
                      {featuredGameFinal
                        ? featuredGame.week !== undefined
                          ? `Week ${featuredGame.week} final is on the board.`
                          : "The final is on the board."
                        : featuredPreview?.title ?? (featuredGame.week !== undefined
                            ? `Week ${featuredGame.week} takes center stage.`
                            : "This matchup takes center stage.")}
                    </h2>
                    <p className="mx-auto mt-1.5 max-w-2xl text-[11px] leading-[1.45] text-white/55 sm:mt-2 sm:text-sm sm:leading-6">
                      {featuredGameFinal
                        ? "The verified final is posted. Visit the matchup center for the result and program links."
                        : featuredPreview?.excerpt ?? `${featuredGame.awayTeam} and ${featuredGame.homeTeam} meet in one of VarsityVue's featured matchups of the week.`}
                    </p>
                  </div>

                  <div className="mt-4 flex justify-center sm:mt-6">
                    <Link href={`/games/${featuredGame.id}`} className="rounded-full bg-white px-5 py-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-black transition hover:bg-white/85 sm:px-6 sm:py-3 sm:text-xs sm:tracking-[0.16em]">
                      {featuredGameFinal ? "View Final Result" : "View Game of the Week"}
                    </Link>
                  </div>
                </>
              ) : (
                <div className="py-6 text-center sm:py-8">
                  <h2 className="text-4xl font-black uppercase leading-[0.9] tracking-tight text-white sm:text-7xl">The Game, Seen Smarter</h2>
                  <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/65 sm:mt-5 sm:text-lg sm:leading-8">
                    Texas high school football hubs, verified scores, schedules, district standings, player stats, and local coverage.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 sm:mt-4"><SchoolSearch schools={schools} /></div>
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

function HeroTeam({ school, team, standing, align, result, teamNameSize }: {
  school?: ReturnType<typeof getSchoolBySlug>;
  team: string;
  standing?: ReturnType<typeof getStandingForSchoolFromGames>;
  align: "left" | "right";
  result?: "W" | "L";
  teamNameSize: string;
}) {
  const identity = (
    <>
      {school && <div className="mb-1.5 flex justify-center sm:mb-4"><ProgramLogo school={school} size="sm" /></div>}
      <div className="flex items-center justify-center gap-1.5 sm:gap-3">
        <h2 className={`${teamNameSize} min-w-0 text-balance break-normal font-black uppercase leading-[0.95] tracking-tight text-white [hyphens:none]`}>{team}</h2>
        {result && (
          <span className={`hidden h-7 min-w-7 items-center justify-center rounded-full border px-2 text-xs font-black sm:inline-flex ${result === "W" ? "border-emerald-400/35 bg-emerald-400/15 text-emerald-300" : "border-white/15 bg-white/[0.06] text-white/55"}`}>{result}</span>
        )}
      </div>
      {school?.mascot && <p className="mt-1 truncate text-[8px] font-black uppercase tracking-[0.12em] text-white/45 sm:mt-2 sm:text-sm sm:tracking-[0.22em]">{school.mascot}</p>}
    </>
  );

  return (
    <div data-side={align} className="min-w-0 text-center">
      {school ? (
        <Link
          href={`/schools/${school.slug}`}
          aria-label={`View ${school.fullName} school hub`}
          className="group/team block min-h-24 rounded-2xl px-1 py-1 outline-none transition hover:bg-white/[0.04] focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          {identity}
        </Link>
      ) : identity}
      <RecordLine overallWins={standing?.overallWins} overallLosses={standing?.overallLosses} districtWins={standing?.districtWins} districtLosses={standing?.districtLosses} />
    </div>
  );
}

function RecordLine({ overallWins, overallLosses, districtWins, districtLosses }: {
  overallWins?: number;
  overallLosses?: number;
  districtWins?: number;
  districtLosses?: number;
}) {
  const hasOverallResult = (overallWins ?? 0) > 0 || (overallLosses ?? 0) > 0;
  const hasDistrictResult = (districtWins ?? 0) > 0 || (districtLosses ?? 0) > 0;

  return (
    <p className="mt-1 text-[8px] font-black uppercase tracking-[0.08em] text-white/55 sm:mt-2 sm:text-sm sm:tracking-[0.12em]">
      <span>{hasOverallResult ? `${overallWins ?? 0}-${overallLosses ?? 0}` : "—"}</span>
      <span className="hidden sm:inline"> Overall</span>
      <span className="mx-1 text-white/25 sm:mx-1.5">·</span>
      <span>{hasDistrictResult ? `${districtWins ?? 0}-${districtLosses ?? 0}` : "—"}</span>
      <span className="hidden sm:inline"> District</span>
    </p>
  );
}
