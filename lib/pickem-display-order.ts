/** Display the saved tiebreaker first without changing stored order or game identities. */
export function orderPickemSlateRows<T extends { id: string }>(
  rows: T[],
  tiebreakerGameId: string | null,
): T[] {
  if (!tiebreakerGameId) return rows;
  const index = rows.findIndex((row) => row.id === tiebreakerGameId);
  if (index <= 0) return rows;
  return [rows[index], ...rows.slice(0, index), ...rows.slice(index + 1)];
}
