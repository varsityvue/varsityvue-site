import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { Game } from "../../../../data/games";
import { getSchoolBySlug } from "../../../../data/schools";
import { getGamesForSchool } from "../../../../data/games";

import type { SchoolTheme } from "../../../../types/school-theme";
import SchoolSubnav from "../../../../components/SchoolSubnav";

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

function getGameTypeLabel(game: Game) {
  if (game.gameType === "scrimmage") return "Scrimmage";
  if (game.gameType === "bye") return "BYE";
  if (game.gameType === "playoff") return "Playoff";
  return `Week ${game.week}`;
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

  const games = getGamesForSchool(slug).sort(
    (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
  );

  const accentColor = school.colors.accent || school.colors.secondary;

  const theme: SchoolTheme = {
    primary: school.colors.primary,
    secondary: school.colors.secondary,
    accent: accentColor,
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <SchoolSubnav
        schoolSlug={school.slug}
        districtSlug={school.districtId}
        theme={theme}
      />

      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href={`/schools/${school.slug}`}
            className="text-sm font-bold text-white/70 transition hover:text-white"
          >
            ← Back to {school.name}
          </Link>

          <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/60 sm:text-sm">
              VarsityVue Schedule
            </p>

            <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
              {school.fullName} Football Schedule
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60">
              Full season schedule, scores, venues, district matchups, and game
              coverage links.
            </p>
          </section>

          <section className="mt-10">
            {games.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
                No games listed yet.
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                {games.map((game) => {
                  const isBye = game.gameType === "bye";
                  const isHome = game.homeSchoolSlug === slug;
                  const opponent = isHome ? game.awayTeam : game.homeTeam;
                  const locationLabel = isHome ? "Home" : "Away";

                  const rowContent = (
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p
                          className="text-xs font-bold uppercase tracking-[0.25em]"
                          style={{ color: accentColor }}
                        >
                          {getGameTypeLabel(game)}
                          {!isBye && ` · ${locationLabel}`}
                          {game.districtGame ? " · District" : ""}
                        </p>

                        <h2 className="mt-3 text-2xl font-black">
                          {isBye
                            ? "BYE Week"
                            : `${isHome ? "vs" : "at"} ${opponent}`}
                        </h2>

                        {!isBye && (
                          <p className="mt-2 text-white/60">{game.venue}</p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {game.gameType === "scrimmage" && (
                            <Badge label="Scrimmage" />
                          )}

                          {game.districtGame && <Badge label="District" />}

                          {game.specialEvent && (
                            <Badge label={game.specialEvent} />
                          )}
                        </div>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="font-bold">
                          {formatGameDate(game.kickoff)}
                        </p>

                        {!isBye && (
                          <p className="text-white/60">
                            {formatGameTime(game.kickoff)}
                          </p>
                        )}

                        {game.status === "final" &&
                          game.homeScore !== undefined &&
                          game.awayScore !== undefined && (
                            <p className="mt-2 text-lg font-black">
                              Final:{" "}
                              {isHome
                                ? `${game.homeScore}-${game.awayScore}`
                                : `${game.awayScore}-${game.homeScore}`}
                            </p>
                          )}
                      </div>
                    </div>
                  );

                  if (isBye) {
                    return (
                      <div
                        key={game.id}
                        className="border-b border-white/10 bg-white/[0.03] p-6 last:border-none"
                      >
                        {rowContent}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={game.id}
                      href={`/games/${game.id}`}
                      className="block border-b border-white/10 p-6 transition hover:bg-white/[0.06] last:border-none"
                    >
                      {rowContent}
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-bold text-white/70">
      {label}
    </span>
  );
}