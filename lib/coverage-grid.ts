import type { GeographicPoint } from "./geo-distance";

export const GRID_VERSION = "tx25-v1" as const;
export const CELL_METERS = 40233.6; // 25 international statute miles
const rad = (degrees: number) => degrees * Math.PI / 180;
const p1 = rad(27.5), p2 = rad(35), p0 = rad(24), l0 = rad(-100);
const n = Math.log(Math.cos(p1) / Math.cos(p2)) / Math.log(Math.tan(Math.PI / 4 + p2 / 2) / Math.tan(Math.PI / 4 + p1 / 2));
const f = Math.cos(p1) * Math.pow(Math.tan(Math.PI / 4 + p1 / 2), n) / n;
const rho0 = 6371008.8 * f / Math.pow(Math.tan(Math.PI / 4 + p0 / 2), n);

// Regional spherical Lambert conformal conic. Only client-side callers supply a point.
export function projectCoveragePoint(point: GeographicPoint): { x: number; y: number } | null {
  const { latitude, longitude } = point;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)
    || latitude < 25 || latitude > 37 || longitude < -107 || longitude > -93) return null;
  const rho = 6371008.8 * f / Math.pow(Math.tan(Math.PI / 4 + rad(latitude) / 2), n);
  const theta = n * (rad(longitude) - l0);
  return { x: rho * Math.sin(theta), y: rho0 - rho * Math.cos(theta) };
}
export function gridBucketFromMeters(x: number, y: number): string | null {
  const c = Math.floor(x / CELL_METERS), r = Math.floor(y / CELL_METERS);
  const id = `${GRID_VERSION}:c${c}r${r}`;
  return validCoverageBucket(id) ? id : null;
}
export function coverageBucket(point: GeographicPoint): string | null {
  const meters = projectCoveragePoint(point);
  return meters ? gridBucketFromMeters(meters.x, meters.y) : null;
}
export function validCoverageBucket(id: unknown): id is string {
  if (typeof id !== "string") return false;
  const match = /^tx25-v1:c(-?(?:0|[1-9]\d?))r(0|[1-9]\d?)$/.exec(id);
  return Boolean(match && Number(match[1]) >= -18 && Number(match[1]) <= 17 && Number(match[2]) >= 2 && Number(match[2]) <= 36 && !match[1].startsWith("-0"));
}
export function coverageParent(id: string): string | null {
  if (!validCoverageBucket(id)) return null;
  const match = /:c(-?\d+)r(\d+)$/.exec(id)!;
  return `${GRID_VERSION}:p${Math.floor(Number(match[1]) / 4)}r${Math.floor(Number(match[2]) / 4)}`;
}
