import type { Metadata } from "next";
import Link from "next/link";

import { getSchools } from "@/lib/schools";
import { getGames } from "@/lib/games";
import PageHero from "@/components/PageHero";
import SchoolDirectory, { type DirectorySchool } from "../../components/SchoolDirectory";

const title = "Texas High School Football School Directory";
const description =
  "Search live VarsityVue school hubs for Texas high school football schedules, scores, standings, districts, and game-day information.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/schools",
  },
  openGraph: {
    title: `${title} | VarsityVue`,
    description,
    url: "/schools",
    type: "website",
    images: [
      {
        url: "/schools/opengraph-image",
        width: 1200,
        height: 630,
        alt: "VarsityVue Texas high school football school directory",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${title} | VarsityVue`,
    description,
    images: ["/schools/twitter-image"],
  },
};

export default function SchoolsPage() {
  const trackedSlugs = new Set(getGames().flatMap((game) => [game.homeSchoolSlug, game.awaySchoolSlug].filter((slug): slug is string => Boolean(slug))));
  const liveSchools = getSchools().filter((school) => school.status === "pilot" || trackedSlugs.has(school.slug));
  const knownSlugs = new Set(liveSchools.map((school) => school.slug));
  const additionalTeams = Array.from(new Map(getGames().flatMap((game) => [
    [game.awaySchoolSlug, game.awayTeam], [game.homeSchoolSlug, game.homeTeam],
  ] as Array<[string | undefined, string | undefined]>).filter(([slug, name]) => slug && name && !knownSlugs.has(slug) && !["bye", "opponent", "special-event"].includes(slug)).map(([slug, name]) => [slug!, { slug: slug!, name: name! }])).values()).sort((a, b) => a.name.localeCompare(b.name));
  const directorySchools: DirectorySchool[] = liveSchools.map((school) => ({
    slug: school.slug,
    name: school.name,
    fullName: school.fullName,
    mascot: school.mascot,
    abbreviation: school.abbreviation,
    badgeLabel: school.badgeLabel,
    districtId: school.districtId,
    stadium: school.stadium,
    stateTitles: school.stateTitles,
    lastPlayoffAppearance: school.lastPlayoffAppearance,
    classification: school.classification,
    colors: {
      primary: school.colors.primary,
      secondary: school.colors.secondary,
    },
    featured: school.status === "pilot",
  }));
  const districts = new Set(liveSchools.map((school) => school.districtId));
  const classifications = new Set(
    liveSchools.map(
      (school) =>
        `${school.classification.conference}${school.classification.division
          ? ` ${school.classification.division}`
          : ""
        }`
    )
  );

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <PageHero
        eyebrow="VarsityVue School Directory"
        title="Find your school."
        description="Browse live Texas high school football hubs by school, mascot, district, classification, or game-day venue."
        aside={
          <Link
            href="/school-request"
            className="inline-flex rounded-xl border border-[color:var(--vv-accent)] bg-[var(--vv-primary)] px-4 py-2.5 text-center text-[11px] font-black uppercase tracking-[0.14em] text-[var(--vv-accent-soft)] transition hover:bg-[var(--vv-primary-hover)] hover:text-white sm:px-6 sm:py-4 sm:text-sm sm:tracking-[0.16em]"
          >
            Don&apos;t See Your School?
          </Link>
        }
        footer={
          <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
            <DirectoryStat label="Tracked Teams" value={(liveSchools.length + additionalTeams.length).toString()} />
            <DirectoryStat label="Districts" value={districts.size.toString()} />
            <DirectoryStat label="Classifications" value={classifications.size.toString()} />
            <DirectoryStat label="Season" value="2026" />
          </section>
        }
      />

      <section className="px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <SchoolDirectory schools={directorySchools} additionalTeams={additionalTeams} />
        </div>
      </section>
    </main>
  );
}

function DirectoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.045] p-3 shadow-xl sm:rounded-[1.5rem] sm:p-5">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40 sm:text-xs sm:tracking-[0.22em]">
        {label}
      </p>

      <p className="mt-1.5 text-2xl font-black text-white sm:mt-3 sm:text-4xl">{value}</p>
    </div>
  );
}
