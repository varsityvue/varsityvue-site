import { heartbeat, runRetention, validHeartbeatUrl } from "@/lib/coverage-operations";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const url = process.env.COVERAGE_DEMAND_SUPABASE_URL;
  const key = process.env.COVERAGE_DEMAND_SERVICE_ROLE_KEY;
  const monitor = process.env.COVERAGE_DEMAND_RETENTION_HEARTBEAT_URL;
  return runRetention(request, {
    secret: process.env.CRON_SECRET,
    enabled: process.env.COVERAGE_DEMAND_RETENTION_ENABLED === "true",
    configured: Boolean(url && key && validHeartbeatUrl(monitor)),
  }, async () => {
    // The dedicated variable name does NOT narrow service_role's broad project authority.
    // No user client, production fallback, caller date or diagnostic response body.
    const response = await fetch(`${url}/rest/v1/rpc/server_maintain_coverage_demand`, {
      method: "POST", headers: { apikey: key!, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: "{}", signal: AbortSignal.timeout(45000), cache: "no-store", redirect: "error",
    });
    if (!response.ok) throw new Error("Maintenance unavailable");
    return response.json();
  }, state => heartbeat(monitor, state));
}
