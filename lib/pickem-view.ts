export type PickemView = "picks" | "results" | "standings";
export function pickemViewForHash(hash: string, fallback: PickemView): PickemView {
  if (["#results", "#my-picks"].includes(hash)) return "results";
  if (["#standings", "#weekly-standings", "#season-leaderboard"].includes(hash)) return "standings";
  return hash === "#picks" ? "picks" : fallback;
}
