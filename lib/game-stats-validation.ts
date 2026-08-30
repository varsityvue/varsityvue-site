import type { GameStats } from "@/data/game-stats";

export type GameStatsValidationIssue = {
  level: "error" | "warning";
  message: string;
};

export function validateGameStats(stats: GameStats): GameStatsValidationIssue[] {
  const issues: GameStatsValidationIssue[] = [];

  if (!stats.gameId.trim()) {
    issues.push({ level: "error", message: "gameId is required." });
  }

  if (!Number.isInteger(stats.season) || stats.season < 2000) {
    issues.push({ level: "error", message: "season must be a valid four-digit year." });
  }

  const quarterSchools = new Set(stats.quarterScores.map((line) => line.schoolSlug));
  if (quarterSchools.size !== 2) {
    issues.push({ level: "warning", message: "Quarter scores should normally contain exactly two schools." });
  }

  for (const line of stats.quarterScores) {
    const summed = line.quarters.reduce((total, score) => total + score, 0);
    if (summed !== line.total) {
      issues.push({
        level: "error",
        message: `${line.schoolSlug} quarter scores total ${summed}, but listed final score is ${line.total}.`,
      });
    }
  }

  for (const line of stats.teamStats) {
    if (
      line.rushingYards !== undefined &&
      line.passingYards !== undefined &&
      line.totalYards !== undefined &&
      line.rushingYards + line.passingYards !== line.totalYards
    ) {
      issues.push({
        level: "warning",
        message: `${line.schoolSlug} rushing plus passing yards do not equal listed total yards. Verify whether the source uses a different total-yardage convention.`,
      });
    }

    if (
      line.completions !== undefined &&
      line.passAttempts !== undefined &&
      line.completions > line.passAttempts
    ) {
      issues.push({
        level: "error",
        message: `${line.schoolSlug} has more completions than pass attempts.`,
      });
    }
  }

  for (const line of stats.passing) {
    if (line.completions > line.attempts) {
      issues.push({
        level: "error",
        message: `${line.player} has more completions than pass attempts.`,
      });
    }
  }

  const playerIdentity = new Map<string, string>();
  const allPlayerLines = [...stats.rushing, ...stats.passing, ...stats.receiving];
  for (const line of allPlayerLines) {
    if (!line.playerId) continue;
    const identity = `${line.schoolSlug}:${line.player}`;
    const existing = playerIdentity.get(line.playerId);
    if (existing && existing !== identity) {
      issues.push({
        level: "error",
        message: `playerId ${line.playerId} is assigned to multiple player identities in this game.`,
      });
    } else {
      playerIdentity.set(line.playerId, identity);
    }
  }

  return issues;
}

export function hasGameStatsErrors(stats: GameStats) {
  return validateGameStats(stats).some((issue) => issue.level === "error");
}
