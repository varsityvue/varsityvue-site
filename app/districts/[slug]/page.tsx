import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { UILClassification } from "@/types/platform";

import DistrictCoverage from "@/components/DistrictCoverage";
import SchoolBadge from "@/components/SchoolBadge";
import StandingsTable from "@/components/StandingsTable";
import { getDistrictBySlug } from "@/lib/districts";
import { getGamesForSchool } from "@/lib/games";
import { getSchoolBySlug, getSchoolsByDistrictId } from "@/lib/schools";
import { getStandingsForDistrictId } from "@/lib/standings";

type DistrictPageProps = {
  params: Promise<{ slug: string }>;
};

type DistrictGame = ReturnType<typeof getGamesForSchool>[number];

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
  const districtStandings = getStandingsForDistrictId(district.id);

  const allDistrictGames = districtSchools
    .flatMap((school) => getGamesForSchool(school.slug))
    .filter(
      (game, index, self) =>
        self.findIndex((item) => item.id === game.id) === index
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

      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.62),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <Link
            href="/districts"
            className="text-sm font-black uppercase tracking-[0.14em] text-white/60 transition hover:text-white"
          >
            ← Back to Districts
          </Link>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-white/70">
              VarsityVue District Hub
            </p>

            <div className="mt-5">
              <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-7xl">
                {displayName}
              </h1>

              <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-white/45">
                {classification} • {region}
              </p>

              <p className="mt-5 max-w-3xl text-base leading-7 text-white/60 sm:text-lg">
                Follow the district race, verified results, upcoming matchups,
                school hubs, player statistics, and local coverage throughout
                the 2026 season.
              </p>
            </div>
          </div>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DistrictStat label="Schools" value={districtSchools.length.toString()} />
            <DistrictStat label="District Games" value={allDistrictGames.length.toString()} />
            <DistrictStat label="District Results" value={districtResults.toString()} />
            <DistrictStat label="Region" value={region.replace("Region ", "")} />
          </section>
        </div>
      </section>

      <section className="border-b border-white/10 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px] rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
            District Snapshot
          </p>

          <h2 className="mt-2 text-3xl font-black text-white">
            {districtSchools.length} schools competing in {classification}
          </h2>

          <p className="mt-4 max-w-4xl leading-7 text-white/60">
            {districtPlayStarted
              ? "District results are now shaping the standings. Follow the race here as verified finals are added throughout district play."
              : "District play has not produced a verified result yet. Overall records may already be available, while the district table remains unranked until district games begin."}
          </p>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-6">
            <StandingsTable standings={districtStandings} theme={districtTheme} />

            <DistrictCoverage districtId={district.id} />

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl sm:p-6">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
                    District Schools
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-white">School Hubs</h2>
                </div>

                <Link
                  href="/schools"
                  className="text-sm font-black uppercase tracking-[0.14em] text-white/60 transition hover:text-white"
                >
                  View all schools →
                </Link>
              </div>

              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/35">
                {districtSchools.map((school) => (
                  <Link
                    key={school.slug}
                    href={`/schools/${school.slug}`}
                    className="grid gap-4 border-b border-white/10 p-4 transition last:border-b-0 hover:bg-white/[0.06] sm:grid-cols-[auto_1fr_auto]"
                  >
                    <SchoolBadge school={school} size="xs" />
                    <div>
                      <p className="font-black text-white">{school.name}</p>
                      <p className="text-sm font-bold uppercase tracking-[0.12em] text-white/40">
                        {school.mascot} • {school.stadium ?? "Stadium TBD"}
                      </p>
                    </div>
                    <p className="self-center text-sm font-black uppercase tracking-[0.14em] text-white/55">
                      View Hub →
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
                District Games
              </p>
              <h2 className="mt-3 text-3xl font-black text-white">District Matchups</h2>

              <div className="mt-6 space-y-3">
                {districtGames.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-white/55">
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

                    return (
                      <Link
                        key={game.id}
                        href={`/games/${game.id}`}
                        className="block rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:bg-white/10"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
                            {formatGameDate(game.kickoff)} · {getWeekLabel(game.week)}
                          </p>
                          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
                            {getDistrictGameStatus(game)}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-[auto_1fr] gap-3">
                          {awaySchool ? (
                            <SchoolBadge school={awaySchool} size="xs" />
                          ) : (
                            <MiniTeamBadge label={getTeamName(game.awayTeam)} />
                          )}
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">Away</p>
                            <p className="font-black text-white">{getTeamName(game.awayTeam)}</p>
                          </div>

                          {homeSchool ? (
                            <SchoolBadge school={homeSchool} size="xs" />
                          ) : (
                            <MiniTeamBadge label={getTeamName(game.homeTeam)} />
                          )}
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.14em] text-white/35">Home</p>
                            <p className="font-black text-white">{getTeamName(game.homeTeam)}</p>
                          </div>
                        </div>

                        {game.venue && (
                          <p className="mt-4 text-sm text-white/55">{game.venue}</p>
                        )}
                      </Link>
                    );
                  })
                )}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">Legacy</p>
              <h2 className="mt-3 text-3xl font-black text-white">Coming Soon</h2>
              <p className="mt-4 leading-7 text-white/60">
                Rivalry records, playoff history, notable teams, and community-submitted historical notes will live here.
              </p>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}

function DistrictStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">{label}</p>
      <p className="mt-3 text-4xl font-black text-white">{value}</p>
    </div>
  );
}

function MiniTeamBadge({ label }: { label: string }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-2 text-center text-[10px] font-black uppercase leading-tight text-white">
      {label.slice(0, 3)}
    </div>
  );
}
