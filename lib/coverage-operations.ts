// Server operations only. No request context, payloads or exception text enters monitoring.
export type CoverageHealthCategory = "accepted" | "database_failure" | "capacity_failure";
export type HeartbeatSignal = "start" | "success" | "fail";
export function validHeartbeatUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "hc-ping.com" && !url.port && !url.username && !url.password
      && !url.search && !url.hash && /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(url.pathname);
  } catch { return false; }
}
export async function heartbeat(url: string | undefined, signal: HeartbeatSignal, send: typeof fetch = fetch): Promise<boolean> {
  if (!validHeartbeatUrl(url)) return false;
  try {
    const response = await send(url + (signal === "success" ? "" : `/${signal}`), {
      method: "POST", body: "", credentials: "omit", referrerPolicy: "no-referrer", redirect: "error",
      signal: AbortSignal.timeout(1500), cache: "no-store",
    });
    return response.ok;
  } catch { return false; }
}

// Fixed five-minute tumbling totals only; bounded memory, no event history or keys.
// Per-instance evidence cannot establish fleet health. A provider aggregate alert is also a launch gate.
export function ingestionHealth(clock: () => number = Date.now) {
  let window = -1, accepted = 0, database = 0, capacity = 0;
  let failing = false, pending: HeartbeatSignal | null = null, inFlight = false, nextAttempt = 0;
  return async (category: CoverageHealthCategory, signal: (state: HeartbeatSignal) => Promise<boolean>) => {
    const next = Math.floor(clock() / 300000);
    if (next !== window) { window = next; accepted = 0; database = 0; capacity = 0; }
    if (category === "accepted") accepted = Math.min(1000000, accepted + 1);
    if (category === "database_failure") database = Math.min(1000000, database + 1);
    if (category === "capacity_failure") capacity = Math.min(1000000, capacity + 1);
    const failures = database + capacity;
    if (!failing && failures >= 5 && failures >= accepted) { failing = true; pending = "fail"; }
    if (failing && accepted >= 3 && failures === 0) { failing = false; pending = "success"; }
    if (!pending || inFlight || clock() < nextAttempt) return;
    nextAttempt = clock() + 60000;
    inFlight = true;
    const state = pending;
    try { if (await signal(state) && pending === state) pending = null; }
    catch { /* retry on a later category; never retain exception data */ }
    finally { inFlight = false; }
  };
}

export type RetentionResult = { reporting_date: string; completed_at: string; moved_rows: number; postconditions: "passed"; skipped: boolean };
export function validRetentionResult(value: unknown): value is RetentionResult {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return Object.keys(v).sort().join() === "completed_at,moved_rows,postconditions,reporting_date,skipped"
    && typeof v.reporting_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.reporting_date)
    && typeof v.completed_at === "string" && Number.isFinite(Date.parse(v.completed_at))
    && Number.isSafeInteger(v.moved_rows) && (v.moved_rows as number) >= 0
    && v.postconditions === "passed" && typeof v.skipped === "boolean";
}
export async function runRetention(request: Request, config: { secret?: string; enabled: boolean; configured: boolean },
  retain: () => Promise<unknown>, signal: (state: HeartbeatSignal) => Promise<boolean>): Promise<Response> {
  const respond = (status: number, state: string) => Response.json({ state }, { status, headers: { "Cache-Control": "no-store" } });
  if (!config.secret || request.headers.get("authorization") !== `Bearer ${config.secret}`) return respond(401, "unauthorized");
  if (request.method !== "GET" || new URL(request.url).search || request.body) return respond(400, "invalid_request");
  if (!config.enabled || !config.configured) return respond(503, "unconfigured");
  // Monitoring failure never prevents maintenance or undoes committed database work.
  const ping = async (state: HeartbeatSignal) => { try { return await signal(state); } catch { return false; } };
  await ping("start");
  try {
    const result = await retain();
    if (!validRetentionResult(result)) throw new Error("Maintenance result unavailable");
  } catch { await ping("fail"); return respond(503, "maintenance_failed"); }
  return await ping("success") ? respond(200, "completed") : respond(502, "completed_monitor_failed");
}
