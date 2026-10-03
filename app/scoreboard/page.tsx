import { permanentRedirect } from "next/navigation";
import { scoresDestination } from "@/lib/games-route-compatibility";
export default async function ScoreboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  permanentRedirect(scoresDestination(await searchParams));
}
