export const publicKeys = [
  "season",
  "week",
  "q",
  "filter",
  "mode",
  "classification",
  "district",
  "following",
  "radius",
  "state",
  "result",
  "intent",
  "status",
  "view",
] as const;
const scalar = (v: string | string[] | undefined) =>
  typeof v === "string" ? v : "";
export function scoresDestination(
  raw: Record<string, string | string[] | undefined>,
) {
  const q = new URLSearchParams();
  for (const key of publicKeys) {
    const v = scalar(raw[key]);
    if (v) q.set(key, v.slice(0, key === "q" ? 200 : 80));
  }
  // Preserve the existing campaign attribution tokens in explicitly shared Scores links.
  for (const key of ["utm_source", "utm_campaign"] as const) {
    const token = scalar(raw[key]).trim().toLowerCase();
    if (/^[a-z0-9][a-z0-9_-]{0,79}$/.test(token)) q.set(key, token);
  }
  q.set("intent", "scores");
  return `/games?${q}`;
}
