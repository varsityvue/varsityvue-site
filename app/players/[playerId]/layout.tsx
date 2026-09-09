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

  return {
    alternates: {
      canonical: `/players/${playerId}`,
    },
    robots: shouldIndex
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default function PlayerLayout({ children }: Props) {
  return children;
}
