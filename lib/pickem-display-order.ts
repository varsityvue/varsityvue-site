/** Keep the open Week 6 slate's database order and game identities intact. */
export function orderPickemSlateRows<T extends { id: string }>(
  rows: T[],
  season: number,
  week: number,
  tiebreakerGameId: string | null,
): T[] {
  if (season !== 2026 || week !== 6 || !tiebreakerGameId) return rows;
  const tiebreaker = rows.find((row) => row.id === tiebreakerGameId);
  return tiebreaker ? [tiebreaker, ...rows.filter((row) => row.id !== tiebreakerGameId)] : rows;
}
