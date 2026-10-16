import assert from "node:assert/strict";
import { mock, test } from "node:test";

let userId: string | undefined = "synthetic-member";
let claimsError = false;
let status = "active";
let reads = 0;
let signouts = 0;
const revalidated: string[] = [];
const cookieValues = new Map<string, string>();
let passwordUpdates = 0;
mock.module("next/headers", { namedExports: { cookies: async () => ({
  get: (key: string) => cookieValues.has(key) ? { value: cookieValues.get(key) } : undefined,
  set: (key: string, value: string) => cookieValues.set(key, value),
  delete: (key: string) => cookieValues.delete(key),
}) } });

mock.module("next/cache", { namedExports: { revalidatePath: (path: string) => revalidated.push(path) } });
mock.module("next/navigation", { namedExports: { redirect: (path: string) => { throw new Error(`redirect:${path}`); } } });
mock.module("./supabase/server.ts", { namedExports: { createClient: async () => ({
  auth: {
    getClaims: async () => ({ data: { claims: { sub: userId } }, error: claimsError ? new Error("private-provider-message") : null }),
    getUser: async () => ({ data: { user: { id: userId } }, error: null }),
    updateUser: async () => { passwordUpdates++; return { error: null }; },
    signOut: async () => { signouts++; return { error: null }; },
  },
  from: () => ({ select: () => ({ eq: () => ({ abortSignal: () => ({ maybeSingle: () => ({ retry: async () => {
    reads++;
    return status === "unavailable" ? { error: { message: "private-provider-message" } } : { data: { status } };
  } }) }) }) }) }),
}) } });

const recoveryActionPath = "../app/account-unavailable/actions.ts";
const passwordActionPath = "../app/reset-password/actions.ts";
const { checkAccountAccess } = await import(recoveryActionPath);
const { updatePassword } = await import(passwordActionPath);

test("recovery checks are fresh, preserve sessions on failure, and retain suspension enforcement", async () => {
  const warnings: string[] = [];
  const warning = mock.method(console, "warn", (value: string) => warnings.push(value));
  try {
    status = "unavailable";
    await assert.rejects(checkAccountAccess(), /redirect:\/account-unavailable\?checked=1/);
    assert.equal(reads, 1);
    assert.equal(signouts, 0);
    assert.deepEqual(revalidated, []);

    status = "active";
    await assert.rejects(checkAccountAccess(), /redirect:\/account$/);
    assert.equal(reads, 2);
    assert.deepEqual(revalidated, ["/account"]);
    assert.equal(signouts, 0);

    status = "suspended";
    await assert.rejects(checkAccountAccess(), /redirect:\/account-suspended/);
    assert.equal(signouts, 1);

    userId = undefined;
    await assert.rejects(checkAccountAccess(), /redirect:\/login/);
    assert.equal(reads, 3);

    claimsError = true;
    await assert.rejects(checkAccountAccess(), /redirect:\/account-unavailable\?checked=1/);
    assert.equal(reads, 3);
    assert.equal(signouts, 1);
    assert.ok(warnings.some(value => value.includes("session_check_failed")));
    assert.ok(!warnings.join("").includes("private-provider-message"));
  } finally { warning.mock.restore(); }
});

test("password recovery update, interrupted access check, and subsequent recovery do not repeat the update", async () => {
  userId = "synthetic-member";
  claimsError = false;
  cookieValues.set("vv_password_recovery", "verified");
  const form = new FormData();
  form.set("new_password", "synthetic-password");
  form.set("confirm_password", "synthetic-password");
  await assert.rejects(updatePassword(form), /redirect:\/reset-password\?status=updated/);
  assert.equal(passwordUpdates, 1);
  assert.equal(cookieValues.has("vv_password_recovery"), false);
  assert.equal(cookieValues.get("vv_password_updated"), "confirmed");
  const previousSignouts = signouts;
  status = "unavailable";
  await assert.rejects(checkAccountAccess(), /redirect:\/account-unavailable/);
  assert.equal(signouts, previousSignouts);
  status = "active";
  await assert.rejects(checkAccountAccess(), /redirect:\/account$/);
  assert.equal(signouts, previousSignouts);
  assert.equal(passwordUpdates, 1);
});
