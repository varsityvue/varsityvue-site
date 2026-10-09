import assert from "node:assert/strict";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadContributorMembers } from "./contributor-members";

function client(rpc: (name: string, args: Record<string, unknown>) => Promise<unknown>) {
  return { rpc } as unknown as Pick<SupabaseClient, "rpc">;
}
const rows = Array.from({ length: 205 }, (_, i) => ({
  user_id: String(i), display_name: i === 204 ? "jweaver" : `Member ${i}`,
  username: i === 150 ? "chappy" : null, email: `member${i}@example.test`, total_count: 205,
}));
test("loads all RPC pages including members and emails beyond page one", async () => {
  const offsets: number[] = [];
  const result = await loadContributorMembers(client(async (name, args) => {
    assert.equal(name, "admin_list_members");
    assert.equal(args.member_filter, "all");
    assert.equal(args.page_size, 100);
    const offset = Number(args.page_offset); offsets.push(offset);
    return { data: rows.slice(offset, offset + 100), error: null };
  }));
  assert.equal(result.error, false);
  assert.equal(result.profiles.length, 205);
  assert.deepEqual(offsets, [0, 100, 200]);
  for (const query of ["jweaver", "chappy", "member204@example.test"]) {
    assert.equal(result.profiles.filter(p => `${p.display_name ?? ""} ${p.username ?? ""} ${p.email ?? ""}`.toLowerCase().includes(query)).length, 1);
  }
});
test("a later query failure discards partial results", async () => {
  const result = await loadContributorMembers(client(async (_name, args) => Number(args.page_offset) === 0
    ? { data: rows.slice(0, 100), error: null }
    : { data: null, error: { message: "Unavailable" } }));
  assert.deepEqual(result, { profiles: [], error: true });
});
test("empty results are successful; rejected and incomplete pages are failures", async () => {
  assert.deepEqual(await loadContributorMembers(client(async () => ({ data: [], error: null }))), { profiles: [], error: false });
  assert.deepEqual(await loadContributorMembers(client(async () => { throw new Error("Network"); })), { profiles: [], error: true });
  for (const response of [[], rows.slice(0, 100), [{ ...rows[100], total_count: 206 }]]) {
    assert.deepEqual(await loadContributorMembers(client(async (_name, args) => ({ data: Number(args.page_offset) === 0 ? rows.slice(0, 100) : response, error: null }))), { profiles: [], error: true });
  }
});
