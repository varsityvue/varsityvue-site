import { gameStats as baseGameStats } from "@/data/game-stats";
import { week2GameStats } from "@/data/week2-game-stats";
import { coachGameStats } from "@/data/coach-game-stats";

export const gameStats = [
  ...baseGameStats,
  ...week2GameStats,
  ...coachGameStats,
];
