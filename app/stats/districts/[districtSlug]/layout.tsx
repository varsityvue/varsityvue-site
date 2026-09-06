import type { Metadata } from "next";

import { getDistrictBySlug } from "@/lib/districts";
import { getPlayerSeasonStats } from "@/lib/player-stats";
import { getSchoolBySlug } from "@/lib/schools";

const SEASON = 2026;

type DistrictStatsLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ districtSlug: string }>;
};

export async function generateMetadata({
  params,
}: Omit<DistrictStatsLayoutProps, "children">): Promise<Metadata> {
  const { districtSlug } = await params;
  const district = getDistrictBySlug(districtSlug);

  if (!district) {
    return {
      title: {
        default: "District Stats Not Found",
        template: "%s",
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const hasVerifiedStats = getPlayerSeasonStats(SEASON).some(
    (player) => getSchoolBySlug(player.schoolSlug)?.districtId === district.id && player.gamesRecorded > 0
  );
  const shouldIndex = district.status === "pilot" && hasVerifiedStats;

  return {
    title: {
      default: `${district.name} 2026 Stat Leaders | VarsityVue`,
      template: "%s",
    },
    alternates: {
      canonical: `/stats/districts/${district.slug}`,
    },
    openGraph: {
      url: `/stats/districts/${district.slug}`,
    },
    robots: shouldIndex
      ? {
          index: true,
          follow: true,
        }
      : {
          index: false,
          follow: true,
        },
  };
}

export default function DistrictStatsLayout({ children }: DistrictStatsLayoutProps) {
  return children;
}
