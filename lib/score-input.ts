/** Require an explicit decimal score; an empty form field is not a shutout. */
export function parseScoreInput(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^\d{1,3}$/.test(value.trim())) return null;
  const score = Number(value.trim());
  return score <= 150 ? score : null;
}
