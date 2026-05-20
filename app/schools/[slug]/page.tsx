import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { SchoolTheme } from "../../../types/school-theme";

import { getSchoolBySlug } from "../../../data/schools";
import {
  getUpcomingGamesForSchool,
  getRecentScoresForSchool,
} from "../../../data/games";
import { getStandingsForSchool } from "../../../data/standings";
import { getArticlesForSchool } from "../../../data/articles";

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

  const theme: SchoolTheme = {
    primary: school.colors.primary,
    secondary: school.colors.secondary,
    accent: school.colors.accent,
  };

  const upcomingGames = getUpcomingGamesForSchool(slug);
  const recentScores = getRecentScoresForSchool(slug);
  const standings = getStandingsForSchool(slug);
  const articles = getArticlesForSchool(slug);

  return (
    <main className="min-h-screen bg-black text-white">
    
      <SchoolHero school={school} />

      <SchoolSubnav
        schoolSlug={school.slug}
        districtSlug={school.districtId}
        theme={theme}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <SponsorBanner theme={theme} />

        <UpcomingGames games={upcomingGames} theme={theme} />

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
    </main>
  );
}