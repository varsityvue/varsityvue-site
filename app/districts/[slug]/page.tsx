import Link from "next/link";
import { notFound } from "next/navigation";
import type { UILClassification } from "@/types/platform";
import {
  getDistrictBySlug,
  getSchoolsByDistrictSlug,
} from "../../../lib/pilotData";
import { getGamesForSchool } from "../../../data/games";
import { getArticlesForSchool } from "../../../data/articles";
import { sponsors } from "../../../data/sponsors";

type DistrictPageProps = {
  params: Promise<{ slug: string }>;
};

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

function formatGameDate(kickoff: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "America/Chicago",
  }).format(new Date(kickoff));
}

export default async function DistrictPage({ params }: DistrictPageProps) {
  const { slug } = await params;
  const district = getDistrictBySlug(slug);

  if (!district) {
    notFound();
  }

  const districtSchools = getSchoolsByDistrictSlug(slug);

  const schoolIds = districtSchools.map((school) => school.id);

  const districtGames = districtSchools
    .flatMap((school) => getGamesForSchool(school.slug))
    .filter(
      (game, index, self) =>
        self.findIndex((item) => item.id === game.id) === index
    )
    .filter((game) => game.districtGame)
    .sort(
      (a, b) =>
        new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
    )
    .slice(0, 5);

  const districtArticles = districtSchools
    .flatMap((school) => getArticlesForSchool(school.slug))
    .filter(
      (article, index, self) =>
        self.findIndex((item) => item.id === article.id) === index
    )
    .slice(0, 4);

  const districtSponsor = sponsors.find(
    (sponsor) =>
      sponsor.active &&
      sponsor.placementTypes.includes("district-hub") &&
      sponsor.districtIds?.includes(district.id)
  );

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/districts"
          className="text-sm font-bold text-[#d65a6d] transition hover:text-white"
        >
          ← Back to Districts
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl md:p-10">
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#7A1022] to-[#d65a6d]" />

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d] sm:text-sm">
            VarsityVue District Hub
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            {district.name}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60 sm:text-xl">
            Schools, standings, schedules, scores, coverage, and sponsor
            visibility across this VarsityVue district.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <DistrictStat
              label="Class"
              value={formatClassification(district.classification)}
            />
            <DistrictStat
              label="Region"
              value={formatRegion(district.uilRegion)}
            />
            <DistrictStat
              label="Schools"
              value={districtSchools.length.toString()}
            />
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-[#7A1022]/30 bg-[#7A1022]/10 p-6 text-center">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d65a6d]">
            District Sponsor
          </p>

          <h2 className="mt-3 text-2xl font-black">
            {districtSponsor
              ? `Presented by ${districtSponsor.name}`
              : "This district placement is available"}
          </h2>

          <p className="mt-2 text-sm text-white/50">
            Premium district-level sponsor inventory for local businesses.
          </p>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d]">
              District Games
            </p>

            <h2 className="mt-3 text-3xl font-black">Upcoming District Matchups</h2>

            <div className="mt-6 space-y-4">
              {districtGames.length === 0 ? (
                <p className="text-white/60">No district games listed yet.</p>
              ) : (
                districtGames.map((game) => (
                  <Link
                    key={game.id}
                    href={`/games/${game.id}`}
                    className="block rounded-2xl border border-white/10 bg-black/35 p-4 transition hover:bg-white/10"
                  >
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/45">
                      {formatGameDate(game.kickoff)} · Week {game.week}
                    </p>
                    <h3 className="mt-2 text-xl font-black">
                      {game.awayTeam} at {game.homeTeam}
                    </h3>
                    <p className="mt-1 text-sm text-white/55">{game.venue}</p>
                  </Link>
                ))
              )}
            </div>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d]">
              Legacy
            </p>

            <h2 className="mt-3 text-3xl font-black">Coming Soon</h2>

            <p className="mt-4 leading-7 text-white/60">
              Rivalry records, playoff history, notable teams, and community
              submitted historical notes will live here.
            </p>
          </aside>
        </section>

        <section className="mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d] sm:text-sm">
            Member Schools
          </p>

          <h2 className="mt-3 text-3xl font-black">District Schools</h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {districtSchools.map((school) => {
              const accentColor = school.colors.accent || school.colors.secondary;

              return (
                <Link
                  key={school.slug}
                  href={`/schools/${school.slug}`}
                  className="group rounded-3xl border bg-white/5 p-6 shadow-lg transition hover:-translate-y-1 hover:bg-white/[0.08]"
                  style={{
                    borderColor: `${school.colors.secondary}33`,
                    boxShadow: `0 18px 50px ${school.colors.primary}22`,
                  }}
                >
                  <div
                    className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl text-xl font-black ring-1"
                    style={{
                      backgroundColor: `${school.colors.primary}66`,
                      color: accentColor,
                      borderColor: `${accentColor}55`,
                    }}
                  >
                    {school.name.slice(0, 2).toUpperCase()}
                  </div>

                  <h3 className="text-2xl font-black">{school.name}</h3>
                  <p className="mt-2 text-white/60">{school.mascot}</p>

                  <p className="mt-6 text-sm font-bold" style={{ color: accentColor }}>
                    View school hub →
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d]">
            Coverage
          </p>

          <h2 className="mt-3 text-3xl font-black">Latest District Coverage</h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {districtArticles.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white/60">
                No district coverage yet.
              </div>
            ) : (
              districtArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/coverage/${article.slug}`}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:bg-white/10"
                >
                  <h3 className="text-2xl font-black">{article.title}</h3>
                  <p className="mt-3 text-white/60">{article.excerpt}</p>
                  <p className="mt-5 text-sm font-bold text-[#d65a6d]">
                    Read story →
                  </p>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function DistrictStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">
        {label}
      </p>
      <p className="mt-3 text-2xl font-black">{value}</p>
    </div>
  );
}