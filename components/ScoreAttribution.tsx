import type { Game } from "@/types/platform";
import { scoreAttributionText } from "@/lib/public-score-state";

export default function ScoreAttribution({ game, detail = false }: {
  game: Pick<Game, "status" | "scoreAttribution">;
  detail?: boolean;
}) {
  const text = scoreAttributionText(game, detail);
  if (!text) return null;
  return <p className="mt-2 min-w-0 text-center text-xs font-normal leading-5 text-[#b0b0b0] [overflow-wrap:anywhere]">{text}</p>;
}
