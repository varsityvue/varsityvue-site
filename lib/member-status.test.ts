import assert from "node:assert/strict";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";
import { enforceMemberStatus, readMemberAccountStatus } from "./member-status";

function client(fetcher: typeof fetch) {
  return createClient("http://127.0.0.1:9999", "synthetic-test-key", { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetcher } });
}

test("Data API 503 is one attempt, denies protected work, preserves session, then recovers", async () => {
  let reads = 0, signouts = 0, writes = 0;
  const c = client(async () => ++reads === 1
    ? new Response(JSON.stringify({ code: "PGRST003" }), { status: 503 })
    : new Response(JSON.stringify({ status: "active" }), { status: 200, headers: { "Content-Type": "application/json" } }));
  const redirect = (path: string): never => { throw new Error(path); };
  const suspend = async () => { signouts++; };
  const operation = async () => { await enforceMemberStatus(await readMemberAccountStatus(c, "actor"), suspend, redirect); writes++; };
  await assert.rejects(operation(), /account-unavailable/);
  assert.equal(reads, 1); assert.equal(signouts, 0); assert.equal(writes, 0);
  await operation(); assert.equal(reads, 2); assert.equal(signouts, 0); assert.equal(writes, 1);
});

test("active contributors, moderators, administrators and members share the bounded eligibility gate", async () => {
  for (const role of ["scorekeeper", "moderator", "admin", "member"]) {
    const c = client(async () => new Response(JSON.stringify({ status: "active" }), { status: 200 }));
    assert.equal(await readMemberAccountStatus(c, role), "active");
    await enforceMemberStatus("active", async () => assert.fail("sign-out"), () => assert.fail("redirect"));
  }
});

test("suspended and missing account rows still deny access and invoke suspension policy", async () => {
  for (const status of ["suspended", null]) {
    let signouts = 0;
    const c = client(async () => new Response(JSON.stringify(status ? { status } : null), { status: 200 }));
    assert.equal(await readMemberAccountStatus(c, "actor"), "suspended");
    await assert.rejects(enforceMemberStatus("suspended", async () => { signouts++; }, (p): never => { throw new Error(p); }), /account-suspended/);
    assert.equal(signouts, 1);
  }
});

test("network failures are unavailable, never authority", async () => {
  const c = client(async () => { throw new TypeError("network unavailable"); });
  assert.equal(await readMemberAccountStatus(c, "actor"), "unavailable");
});

test("slow account-status read aborts within its budget without retry", async () => {
  let reads = 0;
  const keepAlive = setTimeout(() => undefined, 5000);
  const c = client(async (_url, options) => {
    reads++;
    return new Promise<Response>((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => reject(options.signal?.reason), { once: true });
    });
  });
  try {
    const start = Date.now();
    assert.equal(await readMemberAccountStatus(c, "actor"), "unavailable");
    assert.ok(Date.now() - start < 4500);
    assert.equal(reads, 1);
  } finally { clearTimeout(keepAlive); }
});
