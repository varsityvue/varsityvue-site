import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSchools } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";
import { assignContributorSchool, removeContributorSchool } from "./actions";

export const metadata: Metadata = {
  title: "Contributor Access | VarsityVue",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams: Promise<{ message?: string; updated?: string }>;
};

export default async function ContributorAccessPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect("/login");

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (!roles?.some((row) => row.role === "admin")) redirect("/account");

  const params = await searchParams;
  const [{ data: profiles }, { data: assignments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, username")
      .order("display_name", { ascending: true, nullsFirst: false }),
    supabase
      .from("contributor_school_assignments")
      .select("user_id, school_slug, assignment_role, active, created_at")
      .eq("active", true)
      .order("created_at", { ascending: true }),
  ]);

  const schools = getSchools()
    .filter((school) => school.status !== "inactive")
    .sort((a, b) => a.name.localeCompare(b.name));

  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">Internal Tool</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Contributor access</h1>
          <p className="mt-4 text-base leading-7 text-white/50">
            Assign a scorekeeper or coach to a program. Their score-entry dashboard will only show identity-ready games involving an assigned school.
          </p>
        </section>

        {params.updated ? (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
            Contributor access {params.updated}.
          </div>
        ) : null}
        {params.message ? (
          <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">{params.message}</div>
        ) : null}

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <h2 className="text-xl font-black">Add assignment</h2>
          <form action={assignContributorSchool} className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_1.2fr_0.8fr_auto] lg:items-end">
            <div>
              <label htmlFor="user_id" className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">Member</label>
              <select id="user_id" name="user_id" required defaultValue="" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--vv-accent)] focus:outline-none">
                <option value="" disabled>Select member</option>
                {(profiles ?? []).map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.display_name || profile.username || profile.id}{profile.username ? ` (@${profile.username})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="school_slug" className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">Program</label>
              <select id="school_slug" name="school_slug" required defaultValue="" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--vv-accent)] focus:outline-none">
                <option value="" disabled>Select school</option>
                {schools.map((school) => (
                  <option key={school.slug} value={school.slug}>{school.name} {school.mascot}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="assignment_role" className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">Access Type</label>
              <select id="assignment_role" name="assignment_role" defaultValue="scorekeeper" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--vv-accent)] focus:outline-none">
                <option value="scorekeeper">Scorekeeper</option>
                <option value="coach">Coach</option>
              </select>
            </div>

            <button type="submit" className="rounded-full bg-[var(--vv-primary)] px-5 py-3 text-sm font-black transition hover:bg-[#93142a]">Assign</button>
          </form>
        </section>

        <section className="mt-6 space-y-3">
          {(assignments ?? []).length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/50">No contributor program assignments yet.</div>
          ) : (
            assignments!.map((assignment) => {
              const profile = profileMap.get(assignment.user_id);
              const school = schools.find((item) => item.slug === assignment.school_slug);
              return (
                <article key={`${assignment.user_id}-${assignment.school_slug}`} className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-white">{profile?.display_name || profile?.username || assignment.user_id}</p>
                    <p className="mt-1 text-sm text-white/60">{school ? `${school.name} ${school.mascot}` : assignment.school_slug}</p>
                    <span className="mt-2 inline-flex rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/50">
                      {assignment.assignment_role === "coach" ? "Coach" : "Scorekeeper"}
                    </span>
                  </div>
                  <form action={removeContributorSchool}>
                    <input type="hidden" name="user_id" value={assignment.user_id} />
                    <input type="hidden" name="school_slug" value={assignment.school_slug} />
                    <button type="submit" className="rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-sm font-black text-red-100 transition hover:bg-red-500/20">Remove</button>
                  </form>
                </article>
              );
            })
          )}
        </section>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6">
          <Link href="/account" className="text-sm font-bold text-white/55 transition hover:text-white">← Back to account</Link>
          <Link href="/internal/score-review" className="text-sm font-bold text-white/55 transition hover:text-white">Score review →</Link>
        </div>
      </div>
    </main>
  );
}
