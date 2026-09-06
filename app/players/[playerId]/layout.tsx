import type { Metadata } from "next";

import { getPlayerSeasonStat } from "@/lib/player-stats";
import { getSchoolBySlug } from "@/lib/schools";

const SEASON = 2026;

type PlayerLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ playerId: string }>;
};

export async function generateMetadata({
  params,
}: Omit<PlayerLayoutProps, "children">): Promise<Metadata> {
  const { playerId } = await params;
  const player = getPlayerSeasonStat(playerId, SEASON);

  if (!player) {
    return {
      title: {
        default: "Player Not Found",
        template: "%s",
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const school = getSchoolBySlug(player.schoolSlug);
  const shouldIndex = player.gamesRecorded > 0 && school?.status === "pilot";

  return {
    title: {
      default: `${player.player} 2026 Football Profile | VarsityVue`,
      template: "%s",
    },
    alternates: {
      canonical: `/players/${playerId}`,
    },
    openGraph: {
      url: `/players/${playerId}`,
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

export default function PlayerLayout({ children }: PlayerLayoutProps) {
  return children;
}
