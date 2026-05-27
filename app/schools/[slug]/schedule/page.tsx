import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getGamesForSchool } from "@/lib/games";
import { getSchoolBySlug } from "@/lib/schools";
import { getDistrictById } from "@/lib/districts";
import { getStandingsForSchool } from "@/lib/standings";

import type { SchoolTheme } from "../../../../types/school-theme";
import SchoolSubnav from "../../../../components/SchoolSubnav";

type ScheduleGame = ReturnType<typeof getGamesForSchool>[number];

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

function getGameTypeLabel(game: ScheduleGame) {
  if (game.gameType === "scrimmage") return "Scrimmage";
  if (game.gameType === "bye") return "BYE";
  if (game.gameType === "playoff") return "Playoff";
  return `Week ${game.week}`;
}

function getGameStatusLabel(game: ScheduleGame) {
  if (game.gameType === "bye") return "Open Week";
  if (game.status === "final") return "Final";
  if (game.status === "live") return "Live";
  return "Upcoming";
}

function getMapUrl(venue?: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    venue ?? "Texas high school stadium"
  )}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);

  if (!school) {
    return {
      title: "Schedule Not Found | VarsityVue",
    };
  }

  return {
    title: `${school.fullName} Football Schedule | VarsityVue`,
    description: `${school.fullName} football schedule, scores, opponents, game times, venues, and VarsityVue coverage.`,
  };
}

export default async function SchoolSchedulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);

  if (!school) {
    notFound();
  }

  const district = getDistrictById(school.districtId);
  const districtSlug = district?.slug ?? school.districtId;

  const games = getGamesForSchool(slug).sort(
    (a, b) =>
      new Date(a.kickoff ?? "").getTime() -
      new Date(b.kickoff ?? "").getTime()
  );

  const standings = getStandingsForSchool(slug);

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
        location: {
          "@type": "Place",
          name: game.venue,
        },
        url: `https://varsityvue.com/games/${game.id}`,
      })),
  };

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(scheduleSchema),
        }}
      />

      <SchoolSubnav
        schoolSlug={school.slug}
        districtSlug={districtSlug}
        theme={theme}
      />

      <section
        className="border-b border-white/10 px-4 py-6 sm:px-6 lg:px-8"
        style={{
          background: `
            radial-gradient(circle at top left, ${school.colors.primary}88 0%, transparent 32%),
            radial-gradient(circle at top right, ${school.colors.secondary}22 0%, transparent 30%),
            linear-gradient(120deg, ${school.colors.primary}55 0%, #080808 45%, #000 100%)
          `,
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
              VarsityVue Schedule
            </p>

            <div className="mt-4 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-white/45">
                  {school.mascot}
                </p>

                <h1 className="mt-2 text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                  {school.name} Football Schedule
                </h1>

                <p className="mt-3 max-w-3xl text-base leading-7 text-white/60">
                  Schedules, kickoff times, scores, and matchup coverage.
                </p>
              </div>

              <Link
                href={`/districts/${districtSlug}`}
                className="shrink-0 rounded-xl border border-white/15 bg-white/[0.08] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
              >
                District Hub →
              </Link>
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
              <h2 className="mt-2 text-3xl font-black text-white">
                2026 Games
              </h2>
            </div>

            <p className="text-sm font-bold text-white/45">
              {games.length} game{games.length === 1 ? "" : "s"} listed
            </p>
          </div>

          {games.length === 0 ? (
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-8 shadow-2xl">
              <h2 className="text-2xl font-black text-white">
                Schedule coming soon.
              </h2>
              <p className="mt-2 text-white/50">
                Games will appear here once the schedule is added.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {games.map((game) => {
                const isBye = game.gameType === "bye";
                const isHome = game.homeSchoolSlug === slug;
                const opponent = isHome ? game.awayTeam : game.homeTeam;
                const opponentSlug = isHome
                  ? game.awaySchoolSlug
                  : game.homeSchoolSlug;
                const locationLabel = isHome ? "Home" : "Away";

                const opponentStanding = standings.find(
                  (team) => team.schoolSlug === opponentSlug
                );

                const opponentRecord = opponentStanding
                  ? `${opponentStanding.overallWins}-${opponentStanding.overallLosses}`
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

                return (
                  <div key={game.id}>
                    <div
                      className="group relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-6 shadow-xl transition hover:-translate-y-1 hover:bg-white/[0.07]"
                      style={{
                        boxShadow: `0 14px 38px ${school.colors.primary}10`,
                      }}
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
                          <Badge label={getGameStatusLabel(game)} />
                          {!isBye && <Badge label={locationLabel} />}
                          {game.districtGame && <Badge label="District" />}
                          {game.specialEvent && (
                            <Badge label={game.specialEvent} />
                          )}
                        </div>

                        <div className="mt-4 grid gap-5 xl:grid-cols-[1fr_auto] xl:items-end">
                          <div>
                            <h3 className="text-4xl font-black leading-tight text-white">
                              {isBye
                                ? "BYE Week"
                                : `${isHome ? "vs" : "at"} ${opponent}`}
                            </h3>

                            {!isBye && (
                              <p className="mt-1 text-sm font-bold text-white/45">
                                {game.awayTeam} at {game.homeTeam}
                              </p>
                            )}
                          </div>

                          {!isBye && (
                            <div className="flex flex-wrap gap-3">
                              <InfoCard
                                label="Date"
                                value={formatGameDate(game.kickoff ?? "")}
                              />
                              <InfoCard
                                label="Kickoff"
                                value={formatGameTime(game.kickoff ?? "")}
                              />
                              <InfoCard
                                label={hasScore ? "Final" : "Opp. Record"}
                                value={
                                  hasScore ? scoreDisplay ?? "—" : opponentRecord
                                }
                              />
                            </div>
                          )}
                        </div>

                        {!isBye && (
                          <div className="mt-5 flex flex-wrap gap-3">
                            <a
                              href={getMapUrl(game.venue)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/15 hover:text-white"
                            >
                              Map Venue →
                            </a>

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

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 font-black text-white">{value}</p>
    </div>
  );
}