import { getDynamicGamesSnapshot } from "@/lib/dynamic-games";
import { weeklyGameDto } from "@/lib/weekly-game-dto";
export const dynamic = "force-dynamic";
export async function GET() {
  const snapshot = await getDynamicGamesSnapshot();
  // A failed refresh cannot replace the reader's last verified snapshot with repository fallbacks.
  if (snapshot.scoreLoadStatus === "failed")
    return Response.json(
      { error: "Scores unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  return Response.json(
    {
      games: snapshot.games.map((g) => weeklyGameDto(g, snapshot.games)),
      scoreLoadStatus: snapshot.scoreLoadStatus,
      fetchedAt: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
