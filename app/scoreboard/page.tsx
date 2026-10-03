import { permanentRedirect } from "next/navigation";
import { scoresDestination } from "@/lib/unified-games";
export default async function ScoreboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  permanentRedirect(scoresDestination(await searchParams));
}
