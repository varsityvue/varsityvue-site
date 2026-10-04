import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fleetCollector, fleetSnapshot, notifyFleet, redisFleetStore, runFleet, validDelta, validFleetUrl, type FleetStore } from "./coverage-fleet";
import { fleetRuntimeConfig } from "./coverage-fleet-runtime";
import { ingestCoverage, CoverageDatabaseFailure } from "./coverage-demand-server";
import { fixtureSummary } from "./coverage-demand-test-fixture";

const zero = { accepted: 0, database_failure: 0, capacity_failure: 0, indeterminate: false };
const url = "https://fixture.upstash.io/";
const request = (body?: unknown, secret = "disposable", suffix = "") => new Request("https://fixture.invalid/monitor" + suffix,
  { method: body ? "POST" : "GET", headers: { authorization: `Bearer ${secret}` }, body: body ? JSON.stringify(body) : undefined });
const storeStub = (central: FleetStore["central"] = async () => [1]): FleetStore => ({ central, record: async () => true });
test("strict aggregate REST contract, destination/header isolation, no retries, bounded response", async () => {
  for (const u of [undefined, "http://fixture.upstash.io/", url + "?token=x", url + "path", "https://a.upstash.io.evil.invalid/", "https://user@fixture.upstash.io/"]) assert.equal(validFleetUrl(u), false);
  assert.equal(validDelta({ ...zero, accepted: 1 }), true);
  assert.equal(validDelta({ ...zero, accepted: -1 }), false);
  assert.equal(validDelta({ ...zero, accepted: 1, request_id: "forbidden" } as typeof zero), false);
  let calls = 0;
  const send: typeof fetch = async (target, init) => {
    calls++; assert.equal(target, url); assert.equal(init?.redirect, "error"); assert.equal(init?.credentials, "omit");
    assert.equal(init?.referrerPolicy, "no-referrer"); assert.ok(init?.signal);
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer disposable");
    const cmd = JSON.parse(init?.body as string); assert.equal(cmd[0], "EVAL");
    assert.deepEqual(cmd.slice(-5), [1, 2, 3, 4, 0]);
    return Response.json({ result: 1 });
  };
  assert.ok(await redisFleetStore(url, "disposable", send).record(1, { ...zero, accepted: 2, database_failure: 3, capacity_failure: 4 }));
  assert.equal(calls, 1);
  for (const response of [new Response("x".repeat(2049)), Response.json({ error: "sensitive diagnostic" }), Response.json({ result: 1, secret: "x" })]) {
    await assert.rejects(redisFleetStore(url, "disposable", async () => response).record(1, zero), /Fleet unavailable/);
  }
  calls = 0;
  await assert.rejects(redisFleetStore(url, "disposable", async () => { calls++; throw Error("lost acknowledgment"); }).record(1, zero));
  assert.equal(calls, 1);
});
test("collector coalesces only counters, cold resets lose buffered deltas, ambiguous writes are not replayed", async () => {
  let now = 300000, attempts = 0, faults = 0;
  const collector = fleetCollector(() => now);
  assert.ok(collector.observe("accepted")); assert.equal(collector.observe("database_failure"), false);
  const batches: unknown[] = [];
  const store: FleetStore = { record: async (w, d) => { attempts++; batches.push([w, { ...d }]); throw Error("ambiguous"); },
    central: async op => { assert.equal(op, "fault"); faults++; return [1]; } };
  await collector.flush(store); assert.equal(attempts, 1); assert.equal(faults, 1);
  now += 300000; collector.observe("accepted"); await collector.flush({ ...store, record: async (w, d) => { batches.push([w, d]); return true; } });
  assert.deepEqual(batches, [[1, { ...zero, accepted: 1, database_failure: 1 }], [2, { ...zero, accepted: 1 }]]);
  const cold = fleetCollector(() => now); await cold.flush(store); assert.equal(attempts, 1);
  collector.observe("accepted"); now += 900000; collector.observe("capacity_failure");
  let delta: typeof zero | undefined;
  await collector.flush({ ...store, record: async (_, d) => { delta = d; return true; } }); assert.equal(delta?.indeterminate, true);
});
test("in-flight flush has bounded pending memory and does not await ingestion", async () => {
  const collector = fleetCollector(() => 300000);
  let unblock!: () => void; const pause = new Promise<void>(r => { unblock = r; }); let sends = 0;
  collector.observe("accepted");
  const store: FleetStore = { record: async () => { sends++; await pause; return true; }, central: async () => [1] };
  const flushing = collector.flush(store);
  assert.equal(collector.observe("accepted"), false); assert.equal(sends, 1); unblock(); await flushing;
  collector.observe("accepted"); await collector.flush(store); assert.equal(sends, 2);
});
test("disabled, invalid and unapproved requests never count; enabled validated DB/capacity failures do", async () => {
  const counts: string[] = []; const config = { enabled: true, budget: () => true, approved: () => true, health: (s: string) => { counts.push(s); } };
  const req = (v: unknown) => new Request("https://fixture.invalid/api/coverage-demand", { method: "POST", headers: { origin: "https://fixture.invalid", "content-type": "application/json" }, body: JSON.stringify(v) });
  await ingestCoverage(req(fixtureSummary), async () => {}, { ...config, enabled: false });
  await ingestCoverage(req({}), async () => {}, config);
  await ingestCoverage(req(fixtureSummary), async () => {}, { ...config, approved: () => false });
  await ingestCoverage(req(fixtureSummary), async () => {}, { ...config, budget: () => false }); assert.deepEqual(counts, []);
  await ingestCoverage(req(fixtureSummary), async () => {}, config);
  await ingestCoverage(req(fixtureSummary), async () => { throw Error("private"); }, config);
  await ingestCoverage(req(fixtureSummary), async () => { throw new CoverageDatabaseFailure("capacity_failure"); }, config);
  assert.deepEqual(counts, ["accepted", "database_failure", "capacity_failure"]);
});
test("route auth and disabled flags preclude store/notification calls; strict recovery has no free text", async () => {
  let calls = 0; const store = storeStub(async () => { calls++; return [0]; });
  const signal = async () => { calls++; return true; };
  const cfg = { enabled: true, configured: true, secret: "disposable" };
  assert.equal((await runFleet(request(undefined, "bad"), "evaluate", cfg, store, signal, signal)).status, 401);
  assert.equal((await runFleet(request(), "evaluate", { ...cfg, enabled: false }, store, signal, signal)).status, 503);
  assert.equal((await runFleet(request(), "evaluate", { ...cfg, configured: false }, store, signal, signal)).status, 503);
  assert.equal((await runFleet(request(undefined, "disposable", "?window=1"), "review", cfg, store, signal, signal)).status, 400);
  assert.equal((await runFleet(request({ cause: "free text" }), "recover", cfg, store, signal, signal)).status, 400); assert.equal(calls, 0);
  assert.equal(fleetRuntimeConfig({}).enabled, false); assert.equal(fleetRuntimeConfig({}).configured, false);
  const body = { expected_revision: 1, reviewed_window: 1, cause_resolved: true, transport_reviewed: true, loss_accepted: true };
  assert.equal((await runFleet(request(body), "recover", cfg, store, signal, signal)).status, 409);
  assert.throws(() => fleetSnapshot([1, 8, 1, 0, 2, 3]));
});
test("separate evaluator liveness and latched incident notification; failed delivery remains pending", async () => {
  const signals: string[] = [], ack: boolean[] = [];
  const store = storeStub(async (op, rev, _, delivered) => {
    if (op === "evaluate") return [1, 1, 7, 0, 0, 1000];
    if (op === "claim") return [7, 1];
    if (op === "ack") { assert.equal(rev, 7); ack.push(delivered!); return [1]; }
    return [1];
  });
  assert.equal(await notifyFleet(store, async s => { signals.push(s); return false; }), false);
  assert.equal(await notifyFleet(store, async s => { signals.push(s); return true; }), true); assert.deepEqual(ack, [false, true]);
  assert.deepEqual(signals, ["fail", "fail"]);
  const response = await runFleet(request(), "evaluate", { secret: "disposable", enabled: true, configured: true }, store,
    async s => { signals.push("evaluator:" + s); return true; }, async s => { signals.push("incident:" + s); return true; });
  assert.equal(response.status, 200); assert.deepEqual(signals.slice(-2), ["incident:fail", "evaluator:success"]);
  const down = await runFleet(request(), "evaluate", { secret: "disposable", enabled: true, configured: true }, storeStub(async () => { throw Error("secret"); }),
    async s => { signals.push(s); return false; }, async () => true);
  assert.equal(down.status, 503); assert.deepEqual(await down.json(), { state: "monitor_unavailable" }); assert.equal(signals.at(-1), "fail");
});
test("server integration cannot send instance recovery, change discovery, install schedules or disclose secrets", () => {
  const route = readFileSync("app/api/coverage-demand/route.ts", "utf8");
  assert.match(route, /after\(async/); assert.doesNotMatch(route, /heartbeat|ingestionHealth|request\.headers|console\./);
  for (const p of ["lib/coverage-fleet.ts", "lib/coverage-fleet-runtime.ts", "lib/coverage-fleet-scripts.ts"]) {
    assert.doesNotMatch(readFileSync(p, "utf8"), /console\.|getUser\(|cookies\(|request_id|instance_id|latitude|longitude|user_agent|traceId/);
  }
  assert.doesNotMatch(readFileSync("vercel.json", "utf8"), /coverage-demand/);
  const proxy = readFileSync("proxy.ts", "utf8"); assert.ok(proxy.indexOf('"/api/cron/coverage-demand-fleet"') < proxy.indexOf("return updateSession(request)"));
});
