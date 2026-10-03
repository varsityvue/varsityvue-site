import UnifiedGamesPage from "@/components/UnifiedGamesPage";

export default function ScoreboardPage({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <UnifiedGamesPage searchParams={searchParams} route="/scoreboard" />;
}
