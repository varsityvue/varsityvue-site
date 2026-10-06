export function addOptionalStatTotal(
  current: number | undefined,
  value: number | undefined
): number | undefined {
  if (current === undefined || value === undefined) return undefined;
  return current + value;
}

export function sumOptionalStats(values: (number | undefined)[]): number | undefined {
  return values.reduce<number | undefined>(addOptionalStatTotal, 0);
}

export function compareOptionalStatsDescending(
  first: number | undefined,
  second: number | undefined
) {
  if (first === undefined && second === undefined) return 0;
  if (first === undefined) return 1;
  if (second === undefined) return -1;
  return second - first;
}

export function formatTouchdownCount(value: number | undefined): string {
  return value === undefined ? "—" : value.toString();
}

export function formatTouchdownDetail(value: number | undefined): string {
  return value === undefined ? "TD unavailable" : `${value} TD`;
}

export function sumVerifiedStats(values: (number | undefined)[]): {
  value: number | undefined;
  complete: boolean;
} {
  const verified = values.filter((value): value is number => value !== undefined);
  if (verified.length === 0) return { value: undefined, complete: false };
  return {
    value: verified.reduce((total, value) => total + value, 0),
    complete: verified.length === values.length,
  };
}
