export type ScoreError = { code?: string; message?: string };

// P0001 is transitional for the Week 7 hotfix; unrelated P0001 errors stay errors.
export function isScoreConflict(error: ScoreError) {
  return error.code === "PT409" || error.code === "40001" ||
    (error.code === "P0001" && error.message === "Game changed — review the current score.");
}

export const scoreConflictMessage = "Another scorekeeper updated this game. Refresh to review the latest score, then submit your update again.";
