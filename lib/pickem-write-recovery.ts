export type PickemWriteIntent = {
  weekId: string; kind: "entry" | "draft"; selections: Record<string, string>; prediction: number | null;
};
export function savedIntentMatches(intent: PickemWriteIntent, saved: {
  selections: Record<string, string>; prediction: number | null; entryExists: boolean; contest: boolean;
}) {
  const choices = Object.entries(intent.selections);
  if (!choices.length && intent.prediction === null) return false;
  if (intent.kind === "entry" && saved.contest && !saved.entryExists) return false;
  return choices.every(([id, slug]) => saved.selections[id] === slug) &&
    (intent.kind === "draft" ? intent.prediction === saved.prediction :
      intent.prediction === null || intent.prediction === saved.prediction);
}
export function isUncertainWriteError(error: { code?: string }, status: number) {
  return !error.code || status === 0 || status >= 500;
}
