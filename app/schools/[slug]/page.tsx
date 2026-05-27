import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { SchoolTheme } from "../../../types/school-theme";

import { getSchoolBySlug } from "@/lib/schools";
import {
  getUpcomingGamesForSchool,
  getRecentScoresForSchool,
} from "@/lib/games";
import { getDistrictById } from "@/lib/districts";
import { getStandingsForSchool } from "@/lib/standings";
import { getArticlesForSchool } from "@/lib/articles";

import SchoolHero from "../../../components/SchoolHero";
import SponsorBanner from "../../../components/SponsorBanner";
import UpcomingGames from "../../../components/UpcomingGames";
import RecentScores from "../../../components/RecentScores";
import StandingsTable from "../../../components/StandingsTable";
import NewsFeed from "../../../components/NewsFeed";
import SchoolSubnav from "../../../components/SchoolSubnav";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);

  if (!school) {
    return {
      title: "Page Not Found | VarsityVue",
    };
  }

  return {
    title: `${school.fullName} Football Hub | VarsityVue`,
    description: `${school.fullName} schedules, scores, standings, game coverage, sponsors, and football updates on VarsityVue.`,
  };
}

export default async function SchoolPage({
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

  const theme: SchoolTheme = {
    primary: school.colors.primary,
    secondary: school.colors.secondary,
    accent: school.colors.accent,
  };

  const upcomingGames = getUpcomingGamesForSchool(slug);
  const recentScores = getRecentScoresForSchool(slug);
  const standings = getStandingsForSchool(slug);
  const articles = getArticlesForSchool(slug);

  const schoolSchema = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: school.fullName,
    alternateName: school.name,
    sport: "Football",
    url: `https://varsityvue.com/schools/${school.slug}`,
    memberOf: district
      ? {
        "@type": "SportsOrganization",
        name: district.name,
        url: `https://varsityvue.com/districts/${district.slug}`,
      }
      : undefined,
    publisher: {
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
          __html: JSON.stringify(schoolSchema),
        }}
      />

      <SchoolHero school={school} />

      <SchoolSubnav
        schoolSlug={school.slug}
        districtSlug={districtSlug}
        theme={theme}
      />

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.45fr_0.75fr] lg:px-8">
        <div className="space-y-6">
          <SponsorBanner theme={theme} schoolId={school.id} />

          <UpcomingGames
            games={upcomingGames}
            theme={theme}
            schoolSlug={slug}
          />

          {recentScores.length > 0 && (
            <RecentScores
              scores={recentScores}
              theme={theme}
              schoolSlug={slug}
            />
          )}

          <StandingsTable standings={standings} theme={theme} />

          <NewsFeed articles={articles} theme={theme} />
        </div>

        <aside className="space-y-6">
          <section
            className="rounded-[1.75rem] border p-6 shadow-2xl"
            style={{
              borderColor: `${theme.primary}66`,
              background: `linear-gradient(135deg, ${theme.primary}66, rgba(0,0,0,0.94) 48%, rgba(0,0,0,1))`,
            }}
          >
            <p
              className="text-xs font-black uppercase tracking-[0.28em]"
              style={{ color: theme.secondary }}
            >
              School Sponsor
            </p>

            <h2 className="mt-3 text-3xl font-black text-white">
              Sponsor this school hub.
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/55">
              Put your business in front of fans, families, athletes, alumni, and the
              local community across this school’s VarsityVue coverage.
            </p>

            <Link
              href="/sponsor-inquiry"
              className="mt-6 block rounded-xl border border-white/15 bg-white/10 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
            >
              Sponsor This School →
            </Link>
          </section>

          <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
              School Utility
            </p>

            <h2 className="mt-3 text-2xl font-black text-white">
              Quick links for fans.
            </h2>

            <div className="mt-5 flex flex-col gap-3">
              <Link
                href={`/schools/${school.slug}/schedule`}
                className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                Full Schedule
              </Link>

              <Link
                href={`/districts/${districtSlug}`}
                className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                Standings
              </Link>

              <Link
                href="/scoreboard"
                className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                Live Scoreboard
              </Link>

              <Link
                href="/coverage"
                className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white"
              >
                Team Coverage
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}