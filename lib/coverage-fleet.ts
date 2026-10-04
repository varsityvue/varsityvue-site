import type { CoverageHealthCategory, HeartbeatSignal } from "./coverage-operations";
import { FLEET_CENTRAL_SCRIPT, FLEET_PREFIX, FLEET_RECORD_SCRIPT } from "./coverage-fleet-scripts";

export const FLEET_WINDOW_MS = 300000;
export const FLEET_LIMIT = 1000000;
export type FleetDelta = { accepted: number; database_failure: number; capacity_failure: number; indeterminate: boolean };
export type FleetSnapshot = { window: number; incident: number; revision: number; transport_fault: number; clean_windows: number; evaluated_at: number };
export interface FleetStore {
  record(window: number, delta: FleetDelta): Promise<boolean>;
  central(operation: "evaluate" | "review" | "recover" | "claim" | "ack" | "fault", revision?: number, window?: number, delivered?: boolean): Promise<number[]>;
}

export function validFleetUrl(value: string | undefined): value is string {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && /^[a-z0-9-]+\.upstash\.io$/.test(u.hostname)
      && !u.port && !u.username && !u.password && !u.search && !u.hash && u.pathname === "/";
  } catch { return false; }
}

// No SDK retries, diagnostics, command-in-URL, trace attributes or credentials in responses.
export function redisFleetStore(url: string, token: string, send: typeof fetch = fetch, clock = Date.now): FleetStore {
  if (!validFleetUrl(url) || !token || token.length > 4096 || /[\r\n]/.test(token)) throw new Error("Fleet unavailable");
  const evalScript = async (script: string, keys: string[], args: (string | number)[]): Promise<unknown> => {
    const response = await send(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["EVAL", script, keys.length, ...keys, ...args]), redirect: "error", cache: "no-store",
      credentials: "omit", referrerPolicy: "no-referrer", signal: AbortSignal.timeout(1500) });
    if (!response.ok) { await response.body?.cancel(); throw new Error("Fleet unavailable"); }
    const reader = response.body?.getReader();
    if (!reader) throw new Error("Fleet unavailable");
    let bytes = 0, text = ""; const decoder = new TextDecoder();
    try {
      while (true) {
        const { value, done } = await reader.read(); if (done) break;
        bytes += value.byteLength;
        if (bytes > 2048) { await reader.cancel(); throw new Error("Fleet unavailable"); }
        text += decoder.decode(value, { stream: true });
      }
      const result = JSON.parse(text + decoder.decode());
      if (Object.keys(result).join() !== "result") throw new Error("Fleet unavailable");
      return result.result;
    } catch { throw new Error("Fleet unavailable"); } finally { reader.releaseLock(); }
  };
  return {
    async record(window, delta) {
      if (!Number.isSafeInteger(window) || window < 0 || !validDelta(delta)) throw new Error("Fleet unavailable");
      const result = await evalScript(FLEET_RECORD_SCRIPT, [FLEET_PREFIX + "state", FLEET_PREFIX + "b:" + window],
        [window, delta.accepted, delta.database_failure, delta.capacity_failure, delta.indeterminate ? 1 : 0]);
      if (result !== 0 && result !== 1) throw new Error("Fleet unavailable");
      return result === 1;
    },
    async central(operation, revision = 0, window = 0, delivered = false) {
      const current = Math.floor(clock() / FLEET_WINDOW_MS);
      const keys = [FLEET_PREFIX + "state", ...Array.from({ length: 15 }, (_, i) => FLEET_PREFIX + "b:" + (current - 14 + i))];
      const result = await evalScript(FLEET_CENTRAL_SCRIPT, keys, [operation, current, revision, window, delivered ? 1 : 0]);
      if (!Array.isArray(result) || result.length > 6 || result.some(n => !Number.isSafeInteger(n) || n < 0)) throw new Error("Fleet unavailable");
      return result;
    },
  };
}
export function validDelta(value: FleetDelta): boolean {
  return Object.keys(value).sort().join() === "accepted,capacity_failure,database_failure,indeterminate"
    && [value.accepted, value.database_failure, value.capacity_failure].every(n => Number.isSafeInteger(n) && n >= 0 && n <= FLEET_LIMIT)
    && typeof value.indeterminate === "boolean";
}
const emptyDelta = (): FleetDelta => ({ accepted: 0, database_failure: 0, capacity_failure: 0, indeterminate: false });

// At most two windows, one outstanding after task, two sends/task. No timer or request context.
export function fleetCollector(clock = Date.now) {
  const pending = new Map<number, FleetDelta>();
  let scheduled = false, uncertain = false;
  return {
    observe(category: CoverageHealthCategory): boolean {
      if (!["accepted", "database_failure", "capacity_failure"].includes(category)) return false;
      const window = Math.floor(clock() / FLEET_WINDOW_MS);
      for (const old of pending.keys()) if (old < window - 1 || old > window) { pending.delete(old); uncertain = true; }
      const delta = pending.get(window) ?? emptyDelta();
      delta[category] = Math.min(FLEET_LIMIT, delta[category] + 1);
      if (delta[category] === FLEET_LIMIT) delta.indeterminate = true;
      pending.set(window, delta);
      if (scheduled) return false;
      scheduled = true; return true;
    },
    async flush(store: FleetStore) {
      try {
        // Snapshot and discard before sending: an ambiguous acknowledgment is never replayed.
        const batches = [...pending]; pending.clear();
        for (const [window, delta] of batches) {
          delta.indeterminate ||= uncertain;
          try { if (!await store.record(window, delta)) uncertain = true; }
          catch { uncertain = true; }
        }
        // This idempotent flag is safe to retry; it is not a delivery ledger.
        if (uncertain) { try { const r = await store.central("fault"); if (r.length === 1 && r[0] === 1) uncertain = false; } catch { /* deadman/next flush required */ } }
      } finally { scheduled = false; }
    },
  };
}

export function fleetSnapshot(values: number[]): FleetSnapshot {
  if (values.length !== 6 || values.some(n => !Number.isSafeInteger(n) || n < 0)
    || values[1] > 7 || values[3] > 1 || values[4] > 2) throw new Error("Fleet unavailable");
  const [window, incident, revision, transport_fault, clean_windows, evaluated_at] = values;
  return { window, incident, revision, transport_fault, clean_windows, evaluated_at };
}
export async function notifyFleet(store: FleetStore, signal: (s: HeartbeatSignal) => Promise<boolean>): Promise<boolean> {
  const claim = await store.central("claim");
  if (claim.length === 1 && claim[0] === 0) return true;
  if (claim.length !== 2 || claim[0] < 1 || claim[1] > 7) throw new Error("Fleet unavailable");
  let delivered = false;
  try { delivered = await signal(claim[1] === 0 ? "success" : "fail"); } catch { /* preserve pending */ }
  await store.central("ack", claim[0], 0, delivered);
  return delivered;
}
export type FleetConfig = { enabled: boolean; configured: boolean; secret?: string };
export async function runFleet(request: Request, action: "evaluate" | "review" | "recover", config: FleetConfig,
  store: FleetStore, evaluator: (s: HeartbeatSignal) => Promise<boolean>, incident: (s: HeartbeatSignal) => Promise<boolean>): Promise<Response> {
  const respond = (status: number, state: string, review?: FleetSnapshot) => Response.json(review ? { state, review } : { state },
    { status, headers: { "Cache-Control": "no-store" } });
  if (!config.secret || request.headers.get("authorization") !== `Bearer ${config.secret}`) return respond(401, "unauthorized");
  if (new URL(request.url).search || request.method !== (action === "recover" ? "POST" : "GET")) return respond(400, "invalid_request");
  if (!config.enabled || !config.configured) return respond(503, "unconfigured");
  let revision = 0, window = 0;
  if (action === "recover") {
    try {
      const reader = request.body?.getReader(); if (!reader) return respond(400, "invalid_request");
      let text = "", size = 0;
      try { while (true) { const r = await reader.read(); if (r.done) break; size += r.value.byteLength;
        if (size > 512) { await reader.cancel(); return respond(400, "invalid_request"); } text += new TextDecoder().decode(r.value); } }
      finally { reader.releaseLock(); }
      const v = JSON.parse(text);
      if (Object.keys(v).sort().join() !== "cause_resolved,expected_revision,loss_accepted,reviewed_window,transport_reviewed"
        || v.cause_resolved !== true || v.transport_reviewed !== true || v.loss_accepted !== true
        || !Number.isSafeInteger(v.expected_revision) || v.expected_revision < 1
        || !Number.isSafeInteger(v.reviewed_window) || v.reviewed_window < 0) return respond(400, "invalid_request");
      revision = v.expected_revision; window = v.reviewed_window;
    } catch { return respond(400, "invalid_request"); }
  } else if (request.body) return respond(400, "invalid_request");
  try {
    if (action === "review") return respond(200, "review", fleetSnapshot(await store.central("review")));
    if (action === "recover") {
      const result = await store.central("recover", revision, window);
      if (result.length !== 1 || result[0] !== 1) return respond(409, "recovery_rejected");
    } else fleetSnapshot(await store.central("evaluate"));
    const notified = await notifyFleet(store, incident);
    let alive = true;
    if (action === "evaluate") { try { alive = await evaluator("success"); } catch { alive = false; } }
    return respond(notified && alive ? 200 : 502, notified && alive ? "completed" : "notification_pending");
  } catch {
    if (action === "evaluate") {
      try { await store.central("fault"); } catch { /* independent miss/fail signal required */ }
      try { await evaluator("fail"); } catch { /* bounded external deadman detects absence */ }
    }
    return respond(503, "monitor_unavailable");
  }
}
