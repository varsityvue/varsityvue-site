import { after } from "next/server";
import { fleetCollector } from "@/lib/coverage-fleet";
import { fleetRuntimeConfig, lazyFleetStore } from "@/lib/coverage-fleet-runtime";
import { ingestCoverage, coverageBudget, CoverageDatabaseFailure, coverageFailureCategory } from "@/lib/coverage-demand-server";
import { getGames } from "@/lib/games";
import { pilotGate } from "@/lib/game-discovery";
import { resolveGameLocation, toDiscoveryGame } from "@/lib/game-location";
import { venues } from "@/data/venues";
import { schoolFootballVenues } from "@/data/school-football-venues";
import { gameVenueOverrides } from "@/data/game-venue-overrides";

export const runtime = "nodejs";
const budget = coverageBudget();
const health = fleetCollector();
const slates = getGames().map(game => toDiscoveryGame(game, resolveGameLocation(game, venues, schoolFootballVenues, gameVenueOverrides)));

export async function POST(request: Request) {
  const url = process.env.COVERAGE_DEMAND_SUPABASE_URL;
  const key = process.env.COVERAGE_DEMAND_SERVICE_ROLE_KEY;
  return ingestCoverage(request, async summary => {
    // Dedicated server configuration; deliberately no production URL fallback,
    // cookie client, getClaims, getUser, conversion tracker or payload logging.
    const response = await fetch(`${url}/rest/v1/rpc/server_record_coverage_demand_summary`, {
      method: "POST", headers: { apikey: key!, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ p_summary: summary }), signal: AbortSignal.timeout(2000), cache: "no-store", redirect: "error",
    });
    if (!response.ok) throw new CoverageDatabaseFailure(await coverageFailureCategory(response));
  }, { enabled: process.env.COVERAGE_DEMAND_ENABLED === "true" && Boolean(url && key), budget,
    health: category => {
      if (process.env.COVERAGE_DEMAND_INGESTION_MONITOR_ENABLED === "true" && fleetRuntimeConfig().enabled) {
        if (health.observe(category)) after(async () => {
          try { await health.flush(lazyFleetStore()); } catch { /* monitoring never changes ingestion */ }
        });
      }
    },
    approved: summary => { const gate = pilotGate(slates, summary.week);
      return gate.enabled && summary.week_real_game_count === gate.total
        && summary.week_located_game_count === gate.total - gate.unresolved
        && summary.week_unlocated_game_count === gate.unresolved;
    } });
}
