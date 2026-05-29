import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { UILClassification } from "@/types/platform";

import { getDistrictBySlug } from "@/lib/districts";
import { getSchoolsByDistrictId } from "@/lib/schools";
import { getGamesForSchool } from "@/lib/games";
import { getActiveSponsors } from "@/lib/sponsors";
import { getStandingsForDistrictId } from "@/lib/standings";

type DistrictPageProps = {
  params: Promise<{ slug: string }>;
};

function formatClassification(classification: UILClassification) {
  if (!classification.division) return classification.conference;

  return `${classification.conference} Division ${classification.division === "D1" ? "I" : "II"
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

  const parsedDate = new Date(kickoff);

  if (Number.isNaN(parsedDate.getTime())) {
    return "TBD";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(parsedDate);
}

function getSchoolInitials(name: string, abbreviation?: string) {
  return abbreviation ?? name.slice(0, 2).toUpperCase();
}

function getTeamName(team?: string) {
  return team ?? "Team TBD";
}

function getVenueName(venue?: string) {
  return venue ?? "Venue TBD";
}

function getWeekLabel(week?: number) {
  return week === undefined ? "Week TBD" : `Week ${week}`;
}

export async function generateMetadata({
  params,
}: DistrictPageProps): Promise<Metadata> {
  const { slug } = await params;
  const district = getDistrictBySlug(slug);

  if (!district) {
    return {
      title: "District Not Found | VarsityVue",
    };
  }

  return {
    title: `${district.name} District Hub | VarsityVue`,
    description: `${district.name} schedules, standings, school hubs, scores, and Texas high school football coverage on VarsityVue.`,
  };
}

export default async function DistrictPage({ params }: DistrictPageProps) {
  const { slug } = await params;
  const district = getDistrictBySlug(slug);

  if (!district) {
    notFound();
  }

  const districtSchools = getSchoolsByDistrictId(district.id);
  const districtStandings = getStandingsForDistrictId(district.id);

  const allDistrictGames = districtSchools
    .flatMap((school) => getGamesForSchool(school.slug))
    .filter(
      (game, index, self) =>
        self.findIndex((item) => item.id === game.id) === index
    )
    .filter((game) => game.districtGame)
    .sort((a, b) => {
      const aTime = a.kickoff ? new Date(a.kickoff).getTime() : Number.MAX_SAFE_INTEGER;
      const bTime = b.kickoff ? new Date(b.kickoff).getTime() : Number.MAX_SAFE_INTEGER;

      return aTime - bTime;
    });

  const districtGames = allDistrictGames.slice(0, 6);

  const districtSponsor = getActiveSponsors().find(
    (sponsor) =>
      sponsor.placementTypes.includes("district-hub") &&
      sponsor.districtIds?.includes(district.id)
  );

  const classification = formatClassification(district.classification);
  const region = formatRegion(district.uilRegion);
  const displayName = formatDistrictDisplayName(district.name);

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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(districtSchema),
        }}
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

            <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-7xl">
                  {displayName}
                </h1>

                <p className="mt-4 text-sm font-black uppercase tracking-[0.18em] text-white/45">
                  {classification} • {region}
                </p>

                <p className="mt-5 max-w-3xl text-base leading-7 text-white/60 sm:text-lg">
                  Standings, schedules, school hubs, district games, sponsor
                  visibility, and future legacy coverage for this VarsityVue
                  district ecosystem.
                </p>

                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-white/70">
                    District Race
                  </p>

                  <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">
                    Every Friday rewrites the playoff race.
                  </h2>

                  <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
                    District championships, playoff positioning, rivalry games,
                    and weekly momentum all collide inside the VarsityVue
                    district ecosystem.
                  </p>
                </div>
              </div>

              <Link
                href="/sponsor-inquiry"
                className="rounded-xl border border-white/15 bg-white/[0.08] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
              >
                Sponsor District
              </Link>
            </div>
          </div>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DistrictStat label="Schools" value={districtSchools.length.toString()} />
            <DistrictStat label="Teams Ranked" value={districtStandings.length.toString()} />
            <DistrictStat label="District Games" value={allDistrictGames.length.toString()} />
            <DistrictStat label="Region" value={region.replace("Region ", "")} />
          </section>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl sm:p-6">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
                    District Race
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-white">
                    Standings
                  </h2>
                </div>

                <p className="text-sm font-bold text-white/45">
                  Top 4 projected playoff positions
                </p>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/35">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-white/10 text-xs uppercase tracking-[0.2em] text-white/55">
                    <tr>
                      <th className="px-4 py-4">Rank</th>
                      <th className="px-4 py-4">Team</th>
                      <th className="px-4 py-4">District</th>
                      <th className="px-4 py-4">Overall</th>
                      <th className="px-4 py-4">PF</th>
                      <th className="px-4 py-4">PA</th>
                      <th className="px-4 py-4">Diff</th>
                    </tr>
                  </thead>

                  <tbody>
                    {districtStandings.map((team, index) => {
                      const differential = team.pointsFor - team.pointsAgainst;

                      return (
                        <tr
                          key={team.schoolSlug}
                          className={`border-t border-white/10 transition hover:bg-white/[0.06] ${index < 4 ? "bg-white/[0.045]" : ""
                            }`}
                        >
                          <td className="px-4 py-4 font-black text-white">
                            <div className="flex items-center gap-2">
                              <span>#{index + 1}</span>
                              {index < 4 && (
                                <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/70">
                                  Playoff
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4 font-black text-white">
                            <Link
                              href={`/schools/${team.schoolSlug}`}
                              className="hover:text-white/70"
                            >
                              {team.team}
                            </Link>
                          </td>

                          <td className="px-4 py-4 font-bold text-white">
                            {team.districtWins}-{team.districtLosses}
                          </td>

                          <td className="px-4 py-4 font-bold text-white/65">
                            {team.overallWins}-{team.overallLosses}
                          </td>

                          <td className="px-4 py-4 font-bold text-white/65">
                            {team.pointsFor}
                          </td>

                          <td className="px-4 py-4 font-bold text-white/65">
                            {team.pointsAgainst}
                          </td>

                          <td className="px-4 py-4 font-black text-white">
                            {differential > 0 ? "+" : ""}
                            {differential}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl sm:p-6">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
                    District Schools
                  </p>
                  <h2 className="mt-2 text-3xl font-black text-white">
                    School Hubs
                  </h2>
                </div>

                <Link
                  href="/schools"
                  className="text-sm font-black uppercase tracking-[0.14em] text-white/60 transition hover:text-white"
                >
                  View all schools →
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {districtSchools.map((school) => (
                  <Link
                    key={school.slug}
                    href={`/schools/${school.slug}`}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:-translate-y-1 hover:bg-white/10"
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-35 transition group-hover:opacity-55"
                      style={{
                        background: `radial-gradient(circle at top right, ${school.colors.primary}, transparent 55%)`,
                      }}
                    />

                    <div className="relative flex items-center gap-4">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 text-sm font-black shadow-lg"
                        style={{
                          backgroundColor: `${school.colors.primary}88`,
                          color: school.colors.secondary,
                        }}
                      >
                        {getSchoolInitials(school.name, school.abbreviation)}
                      </div>

                      <div>
                        <p className="font-black text-white">{school.name}</p>
                        <p className="text-sm font-bold uppercase tracking-[0.12em] text-white/40">
                          {school.mascot}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[1.75rem] border border-[color:var(--vv-primary)]/40 bg-gradient-to-br from-[var(--vv-primary)]/45 via-black to-black p-6 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
                District Sponsor
              </p>

              <h2 className="mt-3 text-3xl font-black text-white">
                {districtSponsor
                  ? `Presented by ${districtSponsor.name}`
                  : "Own this district."}
              </h2>

              <p className="mt-3 text-sm leading-6 text-white/55">
                Premium sponsor visibility across standings, school hubs,
                district games, matchup pages, and local football discovery.
              </p>

              <div className="mt-6 grid gap-3">
                <Link
                  href="/sponsor-inquiry"
                  className="block rounded-xl border border-white/15 bg-white/10 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
                >
                  Sponsor This District
                </Link>

                <Link
                  href="/recommend-school"
                  className="block rounded-xl border border-white/10 bg-black/35 px-5 py-4 text-center text-xs font-black uppercase tracking-[0.16em] text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  Want your school included? Recommend it →
                </Link>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
                District Games
              </p>

              <h2 className="mt-3 text-3xl font-black text-white">
                District Matchups
              </h2>

              <div className="mt-6 space-y-3">
                {districtGames.length === 0 ? (
                  <p className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm text-white/55">
                    2026 district schedule coming soon.
                  </p>
                ) : (
                  districtGames.map((game) => (
                    <Link
                      key={game.id}
                      href={`/games/${game.id}`}
                      className="block rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:bg-white/10"
                    >
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-white/40">
                        {formatGameDate(game.kickoff)} · {getWeekLabel(game.week)}
                      </p>

                      <h3 className="mt-2 text-lg font-black text-white">
                        {getTeamName(game.awayTeam)} at {getTeamName(game.homeTeam)}
                      </h3>

                      <p className="mt-1 text-sm text-white/55">
                        {getVenueName(game.venue)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
                Legacy
              </p>

              <h2 className="mt-3 text-3xl font-black text-white">
                Coming Soon
              </h2>

              <p className="mt-4 leading-7 text-white/60">
                Rivalry records, playoff history, notable teams, and
                community-submitted historical notes will live here.
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
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black text-white">{value}</p>
    </div>
  );
}