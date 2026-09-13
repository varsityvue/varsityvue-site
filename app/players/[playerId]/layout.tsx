import type { ReactNode } from "react";
import type { Metadata } from "next";

import { getPlayerSeasonStat } from "@/lib/player-stats";
import { getSchoolBySlug } from "@/lib/schools";

const SEASON = 2026;

type Props = {
  children: ReactNode;
  params: Promise<{ playerId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { playerId } = await params;
  const player = getPlayerSeasonStat(playerId, SEASON);
  const school = player ? getSchoolBySlug(player.schoolSlug) : undefined;
  const shouldIndex = Boolean(
    player &&
      player.gamesRecorded > 0 &&
      school?.status === "pilot"
  );

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

  const schoolName = school?.fullName ?? "Texas High School Football";
  const title = `${player.player} Football Stats | VarsityVue`;
  const description = `${player.player}'s ${SEASON} football stats for ${schoolName}, including verified rushing, passing, receiving, and game data on VarsityVue.`;
  const url = `/players/${player.playerId}`;

  return {
    title: {
      default: title,
      template: "%s",
    },
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${player.player} football stats on VarsityVue`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
    robots: shouldIndex
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default function PlayerLayout({ children }: Props) {
  return children;
}
