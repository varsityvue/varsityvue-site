import type { CSSProperties } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getGamesForSchool } from "@/lib/games";
import { getSchoolBySlug } from "@/lib/schools";
import { getDistrictById } from "@/lib/districts";
import { getSchoolRecord } from "@/lib/records";

import type { SchoolTheme } from "../../../../types/school-theme";
import SchoolSubnav from "../../../../components/SchoolSubnav";

type ScheduleGame = ReturnType<typeof getGamesForSchool>[number];

const CENTRAL_TIME_ZONE = "America/Chicago";

function parseGameDate(kickoff?: string) {
  if (!kickoff) return null;

  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day, 12));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(kickoff);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getCentralDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: CENTRAL_TIME_ZONE,
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return year && month && day ? `${year}-${month}-${day}` : null;
}

function getGameDateKey(kickoff?: string) {
  if (!kickoff) return null;
  if (!kickoff.includes("T")) return kickoff;

  const parsed = parseGameDate(kickoff);
  return parsed ? getCentralDateKey(parsed) : null;
}

function getGameTimestamp(game: ScheduleGame) {
  return parseGameDate(game.kickoff)?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

function formatGameDate(kickoff?: string) {
  const parsedDate = parseGameDate(kickoff);
  if (!parsedDate) return "TBD";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: CENTRAL_TIME_ZONE,
  }).format(parsedDate);
}

function formatGameTime(kickoff?: string) {
  if (!kickoff || !kickoff.includes("T")) return "TBD";

  const parsedDate = parseGameDate(kickoff);
  if (!parsedDate) return "TBD";

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: CENTRAL_TIME_ZONE,
  }).format(parsedDate);
}

function getGameTypeLabel(game: ScheduleGame) {
  if (game.gameType === "scrimmage") return "Scrimmage";
  if (game.gameType === "bye") return "BYE";
  if (game.gameType === "playoff") return "Playoff";
  return game.week === undefined ? "Week TBD" : `Week ${game.week}`;
}

function getGameStatusLabel(game: ScheduleGame, todayKey: string | null) {
  if (game.gameType === "bye") return "Open Week";
  if (game.status === "final") return "Final";
  if (game.status === "live") return "Live";

  const gameDateKey = getGameDateKey(game.kickoff);
  if (todayKey && gameDateKey && gameDateKey < todayKey) {
    return "Result Pending";
  }

  return "Upcoming";
}

function getMapUrl(venue: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venue)}`;
}

function getResult(game: ScheduleGame, schoolSlug: string) {
  if (game.gameType === "bye" || game.gameType === "scrimmage") return null;
  if (game.status !== "final") return null;
  if (game.homeScore === undefined || game.awayScore === undefined) return null;

  const isHome = game.homeSchoolSlug === schoolSlug;
  const schoolScore = isHome ? game.homeScore : game.awayScore;
  const opponentScore = isHome ? game.awayScore : game.homeScore;

  if (schoolScore === opponentScore) return "T";
  return schoolScore > opponentScore ? "W" : "L";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);

  if (!school) {
    return { title: "Schedule Not Found" };
  }

  return {
    title: `${school.fullName} Football Schedule`,
    description: `${school.fullName} 2026 football schedule, verified scores, opponents, kickoff times, venues, and matchup coverage on VarsityVue.`,
    alternates: {
      canonical: `/schools/${school.slug}/schedule`,
    },
  };
}

export default async function SchoolSchedulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);
  if (!school) notFound();

  const district = getDistrictById(school.districtId);
  const districtSlug = district?.slug ?? school.districtId;
  const allGames = getGamesForSchool(slug).sort(
    (a, b) => getGameTimestamp(a) - getGameTimestamp(b)
  );
  const todayKey = getCentralDateKey(new Date());
  const games = allGames.filter((game) => {
    if (game.gameType !== "scrimmage") return true;

    const gameDateKey = getGameDateKey(game.kickoff);
    return !todayKey || !gameDateKey || gameDateKey >= todayKey;
  });
  const schoolRecord = getSchoolRecord(slug).record;

  const finalGames = games.filter(
    (game) =>
      game.status === "final" &&
      game.gameType !== "bye" &&
      game.gameType !== "scrimmage"
  );
  const upcomingGames = games.filter((game) => {
    if (
      game.status !== "upcoming" ||
      game.gameType === "bye" ||
      game.gameType === "scrimmage"
    ) {
      return false;
    }
    const gameDateKey = getGameDateKey(game.kickoff);
    return !todayKey || !gameDateKey || gameDateKey >= todayKey;
  });
  const districtGames = games.filter((game) => game.districtGame).length;

  const theme: SchoolTheme = {
    primary: school.colors.primary,
    secondary: school.colors.secondary,
    accent: school.colors.accent || school.colors.secondary,
  };

  const scheduleSchema = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: school.fullName,
    sport: "Football",
    url: `https://varsityvue.com/schools/${school.slug}/schedule`,
    event: games
      .filter((game) => game.gameType !== "bye")
      .map((game) => ({
        "@type": "SportsEvent",
        name: `${game.awayTeam} at ${game.homeTeam}`,
        startDate: game.kickoff,
        location: game.venue
          ? { "@type": "Place", name: game.venue }
          : undefined,
        url: `https://varsityvue.com/games/${game.id}`,
      })),
  };

  return (
    <main
      className="min-h-screen bg-[var(--vv-bg)] text-white"
      style={
        {
          "--vv-primary": school.colors.primary,
          "--vv-accent": school.colors.secondary,
          "--vv-accent-soft": school.colors.secondary,
          "--vv-bg": "#050505",
        } as CSSProperties
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(scheduleSchema) }}
      />

      <SchoolSubnav
        schoolSlug={school.slug}
        districtSlug={districtSlug}
        theme={theme}
      />

      <section
        className="border-b border-white/10 px-4 py-6 sm:px-6 lg:px-8"
        style={{
          background: `radial-gradient(circle at top left, ${school.colors.primary}88 0%, transparent 32%), radial-gradient(circle at top right, ${school.colors.secondary}22 0%, transparent 30%), linear-gradient(120deg, ${school.colors.primary}55 0%, #080808 45%, #000 100%)`,
        }}
      >
        <div className="mx-auto max-w-7xl">
          <Link
            href={`/schools/${school.slug}`}
            className="text-sm font-black uppercase tracking-[0.14em] text-white/55 transition hover:text-white"
          >
            ← Back to School Hub
          </Link>

          <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[var(--vv-accent)]">
              2026 Football
            </p>

            <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-white/45">
                  {school.mascot}
                </p>
                <h1 className="mt-2 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                  {school.name} Schedule
                </h1>
                <p className="mt-3 max-w-3xl text-base leading-7 text-white/60">
                  Full season schedule with verified final scores, upcoming matchups,
                  district games, kickoff information, and game pages.
                </p>
              </div>

              <Link
                href={`/districts/${districtSlug}`}
                className="shrink-0 rounded-xl border border-[color:var(--vv-accent)]/30 bg-[var(--vv-primary)]/30 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-[var(--vv-accent-soft)] transition hover:bg-[var(--vv-primary)]/45 hover:text-white"
              >
                District Hub →
              </Link>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <SummaryCard label="2026 Record" value={schoolRecord} />
              <SummaryCard label="Finals Recorded" value={finalGames.length.toString()} />
              <SummaryCard label="Upcoming Games" value={upcomingGames.length.toString()} />
              <SummaryCard label="District Games" value={districtGames.toString()} />
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
                Season Schedule
              </p>
              <h2 className="mt-2 text-3xl font-black text-white">2026 Games</h2>
            </div>
            <p className="text-sm font-bold text-white/45">
              {games.length} entr{games.length === 1 ? "y" : "ies"} listed
            </p>
          </div>

          {games.length === 0 ? (
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-8 shadow-2xl">
              <h2 className="text-2xl font-black text-white">Schedule coming soon.</h2>
              <p className="mt-2 max-w-2xl text-white/50">
                Games will appear here after schedule information has been verified. Coaches, fans, and community members can send a schedule or trusted source for review.
              </p>
              <Link
                href="/submit"
                className="mt-5 inline-flex rounded-full px-5 py-3 text-sm font-black transition hover:opacity-90"
                style={{ backgroundColor: theme.secondary, color: theme.primary }}
              >
                Submit Schedule Information
              </Link>
            </div>
          ) : (
            <div className="grid gap-4">
              {games.map((game) => {
                const isBye = game.gameType === "bye";
                const isHome = game.homeSchoolSlug === slug;
                const opponent = isHome ? game.awayTeam : game.homeTeam;
                const opponentSlug = isHome ? game.awaySchoolSlug : game.homeSchoolSlug;
                const locationLabel = game.isNeutralSite
                  ? "Neutral Site"
                  : isHome
                    ? "Home"
                    : "Away";
                const opponentRecord = opponentSlug
                  ? getSchoolRecord(opponentSlug).record
                  : "TBD";
                const hasScore =
                  game.status === "final" &&
                  game.homeScore !== undefined &&
                  game.awayScore !== undefined;
                const scoreDisplay = hasScore
                  ? isHome
                    ? `${game.homeScore}-${game.awayScore}`
                    : `${game.awayScore}-${game.homeScore}`
                  : null;
                const result = getResult(game, slug);

                return (
                  <div
                    key={game.id}
                    className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 shadow-xl transition hover:bg-white/[0.07]"
                    style={{ boxShadow: `0 14px 38px ${school.colors.primary}10` }}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-15 transition group-hover:opacity-25"
                      style={{
                        background: `radial-gradient(circle at top right, ${school.colors.primary}, transparent 48%)`,
                      }}
                    />

                    <div className="relative">
                      <div className="flex flex-wrap gap-2">
                        <Badge label={getGameTypeLabel(game)} />
                        <Badge label={getGameStatusLabel(game, todayKey)} />
                        {!isBye && <Badge label={locationLabel} />}
                        {game.districtGame && <Badge label="District" />}
                        {game.specialEvent && <Badge label={game.specialEvent} />}
                      </div>

                      <div className="mt-4 grid gap-5 xl:grid-cols-[1fr_auto] xl:items-end">
                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-3xl font-black leading-tight text-white sm:text-4xl">
                              {isBye
                                ? "BYE Week"
                                : `${game.isNeutralSite || isHome ? "vs" : "at"} ${opponent}`}
                            </h3>
                            {result && <ResultPill result={result} />}
                          </div>

                          {!isBye && (
                            <div className="mt-2 space-y-1 text-sm font-bold text-white/45">
                              <p>
                                {game.awayTeam} at {game.homeTeam}
                                {game.isNeutralSite ? " · Neutral Site" : ""}
                              </p>
                              {game.venue && <p>{game.venue}</p>}
                            </div>
                          )}
                        </div>

                        {!isBye && (
                          <div className="flex flex-wrap gap-3">
                            <InfoCard label="Date" value={formatGameDate(game.kickoff)} />
                            <InfoCard label="Kickoff" value={formatGameTime(game.kickoff)} />
                            <InfoCard
                              label={hasScore ? "Final" : "Opp. Record"}
                              value={hasScore ? scoreDisplay ?? "—" : opponentRecord}
                            />
                          </div>
                        )}
                      </div>

                      {!isBye && (
                        <div className="mt-5 flex flex-wrap gap-3">
                          {game.venue && (
                            <a
                              href={getMapUrl(game.venue)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/15 hover:text-white"
                            >
                              Map Venue →
                            </a>
                          )}

                          <Link
                            href={`/games/${game.id}`}
                            className="inline-flex rounded-full border border-[color:var(--vv-accent)]/30 bg-[var(--vv-primary)]/30 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[var(--vv-accent-soft)] transition hover:bg-[var(--vv-primary)]/45 hover:text-white"
                          >
                            View Matchup →
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/70">
      {label}
    </span>
  );
}

function ResultPill({ result }: { result: "W" | "L" | "T" }) {
  const classes =
    result === "W"
      ? "border-green-400/30 bg-green-500/15 text-green-300"
      : result === "L"
        ? "border-red-400/30 bg-red-500/15 text-red-300"
        : "border-yellow-400/30 bg-yellow-500/15 text-yellow-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-sm font-black ${classes}`}>
      {result}
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-28 rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 font-black text-white">{value}</p>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}
