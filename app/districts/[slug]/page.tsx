import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Game, UILClassification } from "@/types/platform";

import DistrictCoverage from "@/components/DistrictCoverage";
import SchoolBadge from "@/components/SchoolBadge";
import StandingsTable from "@/components/StandingsTable";
import { getDistrictBySlug } from "@/lib/districts";
import { getDynamicGames } from "@/lib/dynamic-games";
import { getSchoolBySlug, getSchoolsByDistrictId } from "@/lib/schools";
import { getStandingsForDistrictIdFromGames } from "@/lib/standings";

type DistrictPageProps = {
  params: Promise<{ slug: string }>;
};

type DistrictGame = Game;

function getGameTimestamp(kickoff?: string) {
  if (!kickoff) return Number.MAX_SAFE_INTEGER;

  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day, 12));
    return Number.isNaN(parsedDate.getTime())
      ? Number.MAX_SAFE_INTEGER
      : parsedDate.getTime();
  }

  const timestamp = new Date(kickoff);
  return Number.isNaN(timestamp.getTime())
    ? Number.MAX_SAFE_INTEGER
    : timestamp.getTime();
}

function formatClassification(classification: UILClassification) {
  if (!classification.division) return classification.conference;

  return `${classification.conference} Division ${
    classification.division === "D1" ? "I" : "II"
  }`;
}

function formatRegion(region: 1 | 2 | 3 | 4) {
  return {
    1: "Region I",
    2: "Region II",
    3: "Region III",
    4: "Region IV",
  }[region];
}

function formatDistrictDisplayName(name: string) {
  const match = name.match(/District\s+(\d+)/i);
  return match?.[1] ? `District ${match[1]}` : name;
}

function formatGameDate(kickoff?: string) {
  if (!kickoff) return "TBD";

  if (!kickoff.includes("T")) {
    const [year, month, day] = kickoff.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day, 12));

    if (Number.isNaN(parsedDate.getTime())) return "TBD";

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "America/Chicago",
    }).format(parsedDate);
  }

  const parsedDate = new Date(kickoff);
  if (Number.isNaN(parsedDate.getTime())) return "TBD";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(parsedDate);
}

function getTeamName(team?: string) {
  return team ?? "Team TBD";
}

function getWeekLabel(week?: number) {
  return week === undefined ? "Week TBD" : `Week ${week}`;
}

function getDistrictGameStatus(game: DistrictGame) {
  if (
    game.status === "final" &&
    typeof game.homeScore === "number" &&
    typeof game.awayScore === "number"
  ) {
    return `${game.awayScore}-${game.homeScore} Final`;
  }

  if (game.status === "live") return "Live";
  if (game.status === "scheduled") return "Result Pending";
  return "Upcoming";
}

function getDistrictGamesForDisplay(games: DistrictGame[], limit = 6) {
  const currentOrUpcoming = games
    .filter((game) => game.status === "live" || game.status === "upcoming")
    .sort((a, b) => getGameTimestamp(a.kickoff) - getGameTimestamp(b.kickoff));

  const pendingResults = games
    .filter((game) => game.status === "scheduled")
    .sort((a, b) => getGameTimestamp(b.kickoff) - getGameTimestamp(a.kickoff));

  const recentFinals = games
    .filter((game) => game.status === "final")
    .sort((a, b) => getGameTimestamp(b.kickoff) - getGameTimestamp(a.kickoff));

  return [...currentOrUpcoming, ...pendingResults, ...recentFinals].slice(0, limit);
}

export async function generateMetadata({
  params,
}: DistrictPageProps): Promise<Metadata> {
  const { slug } = await params;
  const district = getDistrictBySlug(slug);

  if (!district) {
    return { title: "District Not Found" };
  }

  return {
    title: `${district.name} District Hub`,
    description: `${district.name} football standings, schedules, school hubs, district matchups, and verified results currently available on VarsityVue.`,
    alternates: {
      canonical: `/districts/${district.slug}`,
    },
    robots:
      district.status === "pilot"
        ? { index: true, follow: true }
        : { index: false, follow: true },
  };
}

export default async function DistrictPage({ params }: DistrictPageProps) {
  const { slug } = await params;
  const district = getDistrictBySlug(slug);

  if (!district) notFound();

  const districtSchools = getSchoolsByDistrictId(district.id);
  const dynamicGames = await getDynamicGames();
  const districtStandings = getStandingsForDistrictIdFromGames(district.id, dynamicGames);
  const trackedDistrictTeams = districtStandings.length;
  const districtSchoolSlugs = new Set(districtSchools.map((school) => school.slug));

  const allDistrictGames = dynamicGames
    .filter(
      (game) =>
        (game.homeSchoolSlug && districtSchoolSlugs.has(game.homeSchoolSlug)) ||
        (game.awaySchoolSlug && districtSchoolSlugs.has(game.awaySchoolSlug))
    )
    .filter((game) => game.districtGame)
    .sort((a, b) => getGameTimestamp(a.kickoff) - getGameTimestamp(b.kickoff));

  const districtGames = getDistrictGamesForDisplay(allDistrictGames);
  const districtResults = allDistrictGames.filter(
    (game) =>
      game.status === "final" &&
      typeof game.homeScore === "number" &&
      typeof game.awayScore === "number"
  ).length;
  const districtPlayStarted = districtResults > 0;

  const classification = formatClassification(district.classification);
  const region = formatRegion(district.uilRegion);
  const displayName = formatDistrictDisplayName(district.name);

  const districtTheme = {
    primary: "#7A1022",
    secondary: "#FFFFFF",
    accent: "#000000",
  };

  const districtSchema = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: district.name,
    sport: "Football",
    url: `https://varsityvue.com/districts/${district.slug}`,
    member: districtSchools.map((school) => ({
      "@type": "SportsTeam",
      name: school.fullName,
      url: `https://varsityvue.com/schools/${school.slug}`,
    })),
    organizer: {
      "@type": "Organization",
      name: "VarsityVue",
      url: "https://varsityvue.com",
    },
  };

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(districtSchema) }}
      />

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.62),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)] px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <Link
            href="/districts"
            className="text-[10px] font-black uppercase tracking-[0.12em] text-white/60 transition hover:text-white sm:text-sm sm:tracking-[0.14em]"
          >
            ← Back to Districts
          </Link>

          <div className="mt-3 rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:mt-6 sm:rounded-[2rem] sm:p-6 md:p-8">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/70 sm:text-xs sm:tracking-[0.32em]">
              VarsityVue District Hub
            </p>

            <div className="mt-3 sm:mt-5">
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-7xl">
                {displayName}
              </h1>

              <p className="mt-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/45 sm:mt-4 sm:text-sm sm:tracking-[0.18em]">
                {classification} • {region}
              </p>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60 sm:mt-5 sm:text-lg sm:leading-7">
                Follow the district race, verified results, upcoming matchups,
                school hubs, player statistics, and local coverage throughout
                the 2026 season.
              </p>
            </div>
          </div>

          <section className="mt-3 grid grid-cols-2 gap-2 sm:mt-6 sm:gap-4 lg:grid-cols-4">
            <DistrictStat label="Teams" value={trackedDistrictTeams.toString()} />
            <DistrictStat label="District Games" value={allDistrictGames.length.toString()} />
            <DistrictStat label="District Finals" value={districtResults.toString()} />
            <DistrictStat label="District Play" value={districtPlayStarted ? "Underway" : "Not Started"} compact />
          </section>
        </div>
      </section>

      <section className="px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-4 sm:gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-4 sm:space-y-6">
            {!districtPlayStarted ? (
              <p className="px-1 text-xs leading-5 text-white/40 sm:text-sm sm:leading-6">
                District standings will begin once verified district results are on file. Overall records are shown for context in the meantime.
              </p>
            ) : null}
            <StandingsTable standings={districtStandings} theme={districtTheme} />

            <DistrictCoverage districtId={district.id} />

            <section className="rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-6">
              <div className="mb-3 flex items-end justify-between gap-3 sm:mb-6">
                <div className="min-w-0">
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70 sm:text-xs sm:tracking-[0.28em]">
                    District Schools
                  </p>
                  <h2 className="mt-1.5 text-2xl font-black text-white sm:mt-2 sm:text-3xl">School Hubs</h2>
                </div>

                <Link
                  href="/schools"
                  className="shrink-0 text-[9px] font-black uppercase tracking-[0.1em] text-white/60 transition hover:text-white sm:text-sm sm:tracking-[0.14em]"
                >
                  All schools →
                </Link>
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/35 sm:rounded-2xl">
                {districtSchools.map((school) => (
                  <Link
                    key={school.slug}
                    href={`/schools/${school.slug}`}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 border-b border-white/10 px-3 py-2.5 transition last:border-b-0 hover:bg-white/[0.06] sm:gap-4 sm:p-4"
                  >
                    <SchoolBadge school={school} size="xs" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white sm:text-base">{school.name}</p>
                      <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.08em] text-white/40 sm:text-sm sm:tracking-[0.12em]">
                        {school.mascot} • {school.stadium ?? "Stadium TBD"}
                      </p>
                    </div>
                    <p className="self-center text-[9px] font-black uppercase tracking-[0.08em] text-white/55 sm:text-sm sm:tracking-[0.14em]">
                      Hub →
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4 sm:space-y-6">
            <section className="rounded-[1.4rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-6">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/70 sm:text-xs sm:tracking-[0.28em]">
                Tracked District Games
              </p>
              <h2 className="mt-1.5 text-2xl font-black text-white sm:mt-3 sm:text-3xl">District Matchups</h2>

              <div className="mt-3 space-y-2 sm:mt-6 sm:space-y-3">
                {districtGames.length === 0 ? (
                  <p className="rounded-xl border border-white/10 bg-black/35 p-3 text-xs text-white/55 sm:rounded-2xl sm:p-4 sm:text-sm">
                    No district matchups are currently listed.
                  </p>
                ) : (
                  districtGames.map((game) => {
                    const awaySchool = game.awaySchoolSlug
                      ? getSchoolBySlug(game.awaySchoolSlug)
                      : undefined;
                    const homeSchool = game.homeSchoolSlug
                      ? getSchoolBySlug(game.homeSchoolSlug)
                      : undefined;
                    const awayDisplayName = awaySchool?.name ?? getTeamName(game.awayTeam);
                    const homeDisplayName = homeSchool?.name ?? getTeamName(game.homeTeam);

                    return (
                      <Link
                        key={game.id}
                        href={`/games/${game.id}`}
                        className="block rounded-xl border border-white/10 bg-black/35 p-3 transition hover:bg-white/10 sm:rounded-2xl sm:p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/40 sm:text-xs sm:tracking-[0.18em]">
                            {formatGameDate(game.kickoff)} · {getWeekLabel(game.week)}
                          </p>
                          <span className="text-[8px] font-black uppercase tracking-[0.1em] text-white/45 sm:text-[10px] sm:tracking-[0.14em]">
                            {getDistrictGameStatus(game)}
                          </span>
                        </div>

                        <div className="mt-2.5 grid grid-cols-[auto_1fr] items-center gap-x-2.5 gap-y-2 sm:mt-4 sm:gap-3">
                          {awaySchool ? (
                            <SchoolBadge school={awaySchool} size="xs" />
                          ) : (
                            <MiniTeamBadge label={awayDisplayName} />
                          )}
                          <div className="min-w-0">
                            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white/35 sm:text-xs sm:tracking-[0.14em]">Away</p>
                            <p className="truncate text-sm font-black text-white sm:text-base">{awayDisplayName}</p>
                          </div>

                          {homeSchool ? (
                            <SchoolBadge school={homeSchool} size="xs" />
                          ) : (
                            <MiniTeamBadge label={homeDisplayName} />
                          )}
                          <div className="min-w-0">
                            <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white/35 sm:text-xs sm:tracking-[0.14em]">Home</p>
                            <p className="truncate text-sm font-black text-white sm:text-base">{homeDisplayName}</p>
                          </div>
                        </div>

                        {game.venue && (
                          <p className="mt-2.5 truncate text-[10px] text-white/55 sm:mt-4 sm:text-sm">{game.venue}</p>
                        )}
                      </Link>
                    );
                  })
                )}
              </div>
            </section>

          </aside>
        </div>
      </section>
    </main>
  );
}

function DistrictStat({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className="rounded-[1.15rem] border border-white/10 bg-white/[0.045] p-3.5 shadow-xl sm:rounded-[1.5rem] sm:p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/40 sm:text-xs sm:tracking-[0.22em]">{label}</p>
      <p className={`mt-1.5 font-black text-white sm:mt-3 ${compact ? "text-base sm:text-2xl" : "text-2xl sm:text-4xl"}`}>{value}</p>
    </div>
  );
}

function MiniTeamBadge({ label }: { label: string }) {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 p-1.5 text-center text-[9px] font-black uppercase leading-tight text-white sm:h-14 sm:w-14 sm:rounded-2xl sm:p-2 sm:text-[10px]">
      {label.slice(0, 3)}
    </div>
  );
}
