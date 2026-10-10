import type { Metadata } from "next";
import UnifiedGamesPage from "@/components/UnifiedGamesPage";
export const metadata: Metadata = {
  title: "Texas High School Football Games, Scores & Schedules",
  description:
    "Browse weekly Texas high school football matchups, verified live scores, completed games and games near you.",
  alternates: { canonical: "/games" },
};
export default function GamesPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <UnifiedGamesPage searchParams={searchParams} />;
}
