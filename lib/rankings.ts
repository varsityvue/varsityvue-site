import { footballRankings } from "@/data/rankings";

export function getFootballRankings() {
  return [...footballRankings].sort((a, b) => a.rank - b.rank);
}