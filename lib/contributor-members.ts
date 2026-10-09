import type { SupabaseClient } from "@supabase/supabase-js";

type MemberRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  username: string | null;
  total_count: number | string;
};

// The RPC is admin-only and caps each response at 100 rows. Load every page
// before exposing choices so an error cannot masquerade as an empty directory.
export async function loadContributorMembers(supabase: Pick<SupabaseClient, "rpc">) {
  const members: (MemberRow & { id: string })[] = [];
  const ids = new Set<string>();
  let total: number | undefined;
  try {
    do {
      const { data, error } = await supabase.rpc("admin_list_members", {
        member_filter: "all",
        search_query: "",
        page_size: 100,
        page_offset: members.length,
      });
      if (error) throw error;
      const rows = (data ?? []) as MemberRow[];
      if (!rows.length && total === undefined) return { profiles: [], error: false };
      const count = Number(rows[0]?.total_count);
      if (!Number.isSafeInteger(count) || count < 0 || (total !== undefined && count !== total) || !rows.length) {
        throw new Error("Member directory changed or returned an incomplete page");
      }
      total = count;
      for (const row of rows) {
        if (ids.has(row.user_id)) throw new Error("Member directory returned a duplicate page");
        ids.add(row.user_id);
        members.push({ ...row, id: row.user_id });
      }
      if (members.length > total) throw new Error("Member directory count mismatch");
    } while (members.length < total!);
    members.sort((a, b) => (a.display_name || a.username || a.email || a.id).localeCompare(b.display_name || b.username || b.email || b.id));
    return { profiles: members, error: false };
  } catch {
    return { profiles: [], error: true };
  }
}
