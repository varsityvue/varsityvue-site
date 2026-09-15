import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { updateMemberRole } from "./actions";

export const metadata: Metadata = {
  title: "Members & Roles | VarsityVue",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams: Promise<{ message?: string; updated?: string }>;
};

function formatJoined(value?: string | null) {
  if (!value) return "Join date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Join date unavailable";
  return `Joined ${date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

export default async function MembersPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: currentRoles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!currentRoles?.some((row) => row.role === "admin")) redirect("/account");

  const params = await searchParams;
  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, username, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
  ]);

  const rolesByUser = new Map<string, Set<string>>();
  for (const row of roles ?? []) {
    const set = rolesByUser.get(row.user_id) ?? new Set<string>();
    set.add(row.role);
    rolesByUser.set(row.user_id, set);
  }

  const members = profiles ?? [];

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">Admin</p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">Members & Roles</h1>
            <p className="mt-4 text-base leading-7 text-white/50">Manage VarsityVue access without leaving the site. Moderator access includes score-review tools; scorekeeper program assignments remain in Contributor Access.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-center">
            <p className="text-3xl font-black">{members.length}</p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-white/35">Total Members</p>
          </div>
        </section>

        {params.updated ? <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">Member role {params.updated}.</div> : null}
        {params.message ? <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">{params.message}</div> : null}

        <section className="mt-8 space-y-4">
          {members.map((profile) => {
            const memberRoles = rolesByUser.get(profile.id) ?? new Set<string>();
            const name = profile.display_name || profile.username || "VarsityVue Member";
            const isSelf = profile.id === userId;

            return (
              <article key={profile.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-black">{name}</h2>
                      {isSelf ? <span className="rounded-full border border-[var(--vv-accent)]/30 bg-[var(--vv-primary)]/20 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-red-100">You</span> : null}
                    </div>
                    <p className="mt-1 text-xs text-white/40">{profile.username ? `@${profile.username} · ` : ""}{formatJoined(profile.created_at)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["member", "scorekeeper", "moderator", "admin"].filter((role) => memberRoles.has(role)).map((role) => (
                        <span key={role} className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/55">{role}</span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <RoleButton userId={profile.id} role="scorekeeper" active={memberRoles.has("scorekeeper")} label="Scorekeeper" />
                    <RoleButton userId={profile.id} role="moderator" active={memberRoles.has("moderator")} label="Moderator" />
                    {memberRoles.has("admin") ? <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-black text-amber-100">Admin protected</span> : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 border-t border-white/10 pt-6 text-sm font-bold text-white/55">
          <Link href="/account" className="transition hover:text-white">← Back to account</Link>
          <Link href="/internal/contributor-access" className="transition hover:text-white">Contributor access →</Link>
          <Link href="/internal/score-review" className="transition hover:text-white">Score review →</Link>
        </div>
      </div>
    </main>
  );
}

function RoleButton({ userId, role, active, label }: { userId: string; role: "scorekeeper" | "moderator"; active: boolean; label: string }) {
  return (
    <form action={updateMemberRole}>
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="enabled" value={active ? "false" : "true"} />
      <button type="submit" className={active ? "rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/20" : "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-black text-emerald-50 transition hover:bg-emerald-400/15"}>
        {active ? `Remove ${label}` : `Make ${label}`}
      </button>
    </form>
  );
}
