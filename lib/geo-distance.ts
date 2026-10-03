export type GeographicPoint = { latitude: number; longitude: number };

export function validPoint(point: GeographicPoint): boolean {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
    && Math.abs(point.latitude) <= 90 && Math.abs(point.longitude) <= 180;
}

// Great-circle distance, not driving distance. Check radius before rounding.
export function distanceMiles(a: GeographicPoint, b: GeographicPoint): number {
  if (!validPoint(a) || !validPoint(b)) throw new Error("Invalid geographic point");
  const radians = (n: number) => n * Math.PI / 180;
  const deltaLat = radians(b.latitude - a.latitude);
  const deltaLon = radians(b.longitude - a.longitude);
  const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(radians(a.latitude))
    * Math.cos(radians(b.latitude)) * Math.sin(deltaLon / 2) ** 2;
  return 3958.7613 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

export function distanceLabel(miles: number): string {
  return miles < 0.5 ? "Less than 1 mi away" : `${Math.round(miles)} mi away`;
}
