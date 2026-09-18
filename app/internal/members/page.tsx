import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireActiveMember } from "@/lib/member-access";
import {
  permanentlyDeleteMember,
  restoreMember,
  suspendMember,
  updateMemberRole,
} from "./actions";

export const metadata: Metadata = {
  title: "Members & Roles",
  robots: { index: false, follow: false, nocache: true },
};

const PAGE_SIZE = 25;
const FILTERS = [
  { key: "all", label: "All Members" },
  { key: "general", label: "General Members" },
  { key: "scorekeepers", label: "Scorekeepers" },
  { key: "moderators", label: "Moderators" },
  { key: "admins", label: "Admins" },
  { key: "suspended", label: "Suspended" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];
type MemberRow = {
  user_id: string;
  email: string | null;
  display_name: string | null;
  username: string | null;
  created_at: string;
  account_status: "active" | "suspended";
  roles: string[];
  total_count: number;
};
type ViewCounts = Record<FilterKey, number>;

type PageProps = {
  searchParams: Promise<{
    message?: string;
    updated?: string;
    view?: string;
    q?: string;
    page?: string;
  }>;
};

function normalizeFilter(value?: string): FilterKey {
  return FILTERS.some((filter) => filter.key === value) ? value as FilterKey : "all";
}

function normalizePage(value?: string) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function formatJoined(value?: string | null) {
  if (!value) return "Join date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Join date unavailable";
  return `Joined ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function memberHref(view: FilterKey, query: string, page = 1) {
  const params = new URLSearchParams();
  if (view !== "all") params.set("view", view);
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  return params.size ? `/internal/members?${params.toString()}` : "/internal/members";
}

function countValue(counts: Partial<ViewCounts> | null, key: FilterKey) {
  const value = counts?.[key];
  return typeof value === "number" ? value : 0;
}

export default async function MembersPage({ searchParams }: PageProps) {
  const { supabase, userId } = await requireActiveMember();
  const { data: currentRoles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!currentRoles?.some((row) => row.role === "admin")) redirect("/account");

  const params = await searchParams;
  const activeFilter = normalizeFilter(params.view);
  const query = params.q?.trim().slice(0, 100) ?? "";
  const requestedPage = normalizePage(params.page);

  const [{ data: memberData, error: memberError }, { data: countData, error: countError }] = await Promise.all([
    supabase.rpc("admin_list_members", {
      member_filter: activeFilter,
      search_query: query,
      page_size: PAGE_SIZE,
      page_offset: (requestedPage - 1) * PAGE_SIZE,
    }),
    supabase.rpc("admin_member_view_counts"),
  ]);

  const members = (memberData ?? []) as MemberRow[];
  const counts = (countData ?? null) as Partial<ViewCounts> | null;
  const totalResults = Number(members[0]?.total_count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const returnTo = memberHref(activeFilter, query, page);
  const loadError = memberError || countError;

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">Admin</p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">Members & Roles</h1>
            <p className="mt-4 text-base leading-7 text-white/50">
              Search member identity, manage overlapping operational roles, and control account access. Suspension preserves member data and is the normal moderation action.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center">
            <p className="text-3xl font-black">{countValue(counts, "all")}</p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Total Members</p>
          </div>
        </section>

        {params.updated ? <div role="status" className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">{params.updated}</div> : null}
        {params.message ? <div role="alert" className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">{params.message}</div> : null}
        {loadError ? <div role="alert" className="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm text-red-50">Member management data is temporarily unavailable.</div> : null}

        <section className="mt-7 rounded-2xl border border-white/10 bg-white/[0.035] p-4 sm:p-5">
          <nav aria-label="Member views" className="flex gap-2 overflow-x-auto pb-1">
            {FILTERS.map((filter) => {
              const active = filter.key === activeFilter;
              return (
                <Link
                  key={filter.key}
                  href={memberHref(filter.key, query)}
                  className={`shrink-0 rounded-full border px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.1em] transition ${active ? "border-[var(--vv-primary)] bg-[var(--vv-primary)] text-white" : "border-white/10 bg-black/20 text-white/50 hover:bg-white/[0.07] hover:text-white"}`}
                >
                  {filter.label} <span className="ml-1 text-white/60">{countValue(counts, filter.key)}</span>
                </Link>
              );
            })}
          </nav>

          <form method="get" className="mt-4 flex flex-col gap-2 sm:flex-row">
            {activeFilter !== "all" ? <input type="hidden" name="view" value={activeFilter} /> : null}
            <label className="min-w-0 flex-1">
              <span className="sr-only">Search members</span>
              <input
                type="search"
                name="q"
                defaultValue={query}
                maxLength={100}
                placeholder="Search display name, username, or email"
                className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[var(--vv-accent)]"
              />
            </label>
            <button className="rounded-xl bg-white/10 px-5 py-3 text-sm font-black transition hover:bg-white/15">Search</button>
            {query ? <Link href={memberHref(activeFilter, "")} className="rounded-xl border border-white/10 px-5 py-3 text-center text-sm font-black text-white/55 transition hover:text-white">Clear</Link> : null}
          </form>
          <p className="mt-3 text-xs text-white/35">
            Roles control platform-level permissions. School-specific contributor access is managed separately. Suspended is an independent account status; role assignments remain intact.
          </p>
        </section>

        <section className="mt-6 space-y-4">
          {!loadError && members.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-8 text-center text-sm text-white/45">No members match this view and search.</div>
          ) : null}

          {members.map((member) => {
            const roleSet = new Set(member.roles);
            const name = member.display_name || member.username || member.email || "VarsityVue Member";
            const isSelf = member.user_id === userId;
            const suspended = member.account_status === "suspended";

            return (
              <article key={member.user_id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="break-words text-lg font-black">{name}</h2>
                      {isSelf ? <StatusBadge label="You" tone="accent" /> : null}
                      {suspended ? <StatusBadge label="Suspended" tone="warning" /> : <StatusBadge label="Active" tone="success" />}
                    </div>
                    {member.username ? <p className="mt-1 break-all text-xs font-bold text-white/45">@{member.username}</p> : null}
                    <p className="mt-1 break-all text-sm text-white/60">{member.email || "Email unavailable"}</p>
                    <p className="mt-1 text-xs text-white/30">{formatJoined(member.created_at)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["member", "scorekeeper", "moderator", "admin"].filter((role) => roleSet.has(role)).map((role) => (
                        <span key={role} className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/55">{role}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <div className="flex flex-wrap gap-2">
                      <RoleButton userId={member.user_id} role="scorekeeper" active={roleSet.has("scorekeeper")} label="Scorekeeper" returnTo={returnTo} />
                      <RoleButton userId={member.user_id} role="moderator" active={roleSet.has("moderator")} label="Moderator" returnTo={returnTo} />
                      {roleSet.has("admin") ? <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-black text-amber-100">Admin role protected</span> : null}
                    </div>

                    {isSelf ? (
                      <p className="text-xs font-bold text-white/35">Self-suspension and self-deletion are blocked.</p>
                    ) : (
                      <details className="w-full rounded-xl border border-white/10 bg-black/20 p-3 lg:max-w-md">
                        <summary className="cursor-pointer text-xs font-black text-white/65">Account lifecycle actions</summary>
                        <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                          {suspended ? (
                            <form action={restoreMember}>
                              <LifecycleFields userId={member.user_id} returnTo={returnTo} />
                              <p className="mb-2 text-xs leading-5 text-white/45">Restore signed-in member access without changing roles, follows, or contribution history.</p>
                              <button className="rounded-full border border-emerald-300/25 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-50 transition hover:bg-emerald-400/15">Restore Account</button>
                            </form>
                          ) : (
                            <form action={suspendMember}>
                              <LifecycleFields userId={member.user_id} returnTo={returnTo} />
                              <p className="mb-2 text-xs leading-5 text-white/45">Suspend signed-in member functionality while preserving the account and all related data.</p>
                              <button className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-black text-amber-50 transition hover:bg-amber-300/15">Suspend Account</button>
                            </form>
                          )}

                          <form action={permanentlyDeleteMember} className="rounded-xl border border-red-400/15 bg-red-500/[0.06] p-3">
                            <LifecycleFields userId={member.user_id} returnTo={returnTo} />
                            <p className="text-xs font-black text-red-100">Permanently delete {member.email || name}?</p>
                            <p className="mt-1 text-xs leading-5 text-red-100/60">This cannot be undone. Historical score records are retained without member attribution.</p>
                            <label className="mt-3 block">
                              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-red-100/60">Type the member email to confirm</span>
                              <input
                                name="confirmation"
                                type="email"
                                required
                                autoComplete="off"
                                placeholder={member.email || "Member email"}
                                disabled={!member.email}
                                className="mt-1.5 w-full rounded-lg border border-red-300/20 bg-black/35 px-3 py-2 text-sm text-white outline-none placeholder:text-white/20 focus:border-red-300/40 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </label>
                            <button disabled={!member.email} className="mt-3 rounded-full border border-red-300/25 bg-red-500/15 px-4 py-2 text-xs font-black text-red-50 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50">Permanently Delete Account</button>
                          </form>
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        {totalPages > 1 ? (
          <nav aria-label="Member result pages" className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] p-4">
            {page > 1 ? <Link href={memberHref(activeFilter, query, page - 1)} className="rounded-full border border-white/10 px-4 py-2 text-xs font-black text-white/65">← Previous</Link> : <span />}
            <span className="text-xs font-bold text-white/40">Page {page} of {totalPages} · {totalResults} results</span>
            {page < totalPages ? <Link href={memberHref(activeFilter, query, page + 1)} className="rounded-full border border-white/10 px-4 py-2 text-xs font-black text-white/65">Next →</Link> : <span />}
          </nav>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/10 pt-6 text-sm font-bold text-white/55">
          <Link href="/account" className="transition hover:text-white">← Back to account</Link>
          <Link href="/internal/contributor-access" className="transition hover:text-white">School assignments →</Link>
          <Link href="/internal/score-review" className="transition hover:text-white">Score review →</Link>
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ label, tone }: { label: string; tone: "accent" | "warning" | "success" }) {
  const classes = tone === "warning"
    ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
    : tone === "success"
      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
      : "border-[var(--vv-accent)]/30 bg-[var(--vv-primary)]/20 text-red-100";
  return <span className={`rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] ${classes}`}>{label}</span>;
}

function LifecycleFields({ userId, returnTo }: { userId: string; returnTo: string }) {
  return (
    <>
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="return_to" value={returnTo} />
    </>
  );
}

function RoleButton({ userId, role, active, label, returnTo }: { userId: string; role: "scorekeeper" | "moderator"; active: boolean; label: string; returnTo: string }) {
  return (
    <form action={updateMemberRole}>
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="enabled" value={active ? "false" : "true"} />
      <input type="hidden" name="return_to" value={returnTo} />
      <button type="submit" className={active ? "rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/20" : "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-50 transition hover:bg-emerald-400/15"}>
        {active ? `Remove ${label}` : `Make ${label}`}
      </button>
    </form>
  );
}
