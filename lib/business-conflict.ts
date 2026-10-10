const legacyBusinessMessages = new Set([
  "Stale schedule revision. Refresh and try again.",
  "Stale outcome revision. Refresh and try again.",
  "Stale lock revision. Refresh and try again.",
  "Game changed after opening the editor. Refresh and review it again.",
  "The draft changed. Refresh before saving.",
  "The draft changed. Refresh before opening.",
  "The schedule changed. Refresh and save the draft before opening.",
  "Game mapping changed — review the evidence again.",
  "Evidence changed — review the evidence again.",
  "Game changed — review the current score."
]);

export function isBusinessConflict(error: { code?: string; message?: string }) {
  return error.code === "PT409" || (error.code === "40001" && legacyBusinessMessages.has(error.message ?? ""));
}
