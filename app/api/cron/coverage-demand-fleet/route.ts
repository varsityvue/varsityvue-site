import { fleetRoute } from "@/lib/coverage-fleet-runtime";
export const runtime = "nodejs";
export const maxDuration = 15;
export function GET(request: Request) { return fleetRoute(request, "evaluate"); }
