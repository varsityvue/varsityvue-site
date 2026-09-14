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
    .filter((school) => school.status !== "archived")
    .sort((a, b) => a.name.localeCompare(b.name));

  const schoolMap = new Map(schools.map((school) => [school.slug, school]));
  const assignmentsByUser = new Map<string, typeof assignments>();

  for (const assignment of assignments ?? []) {
    const current = assignmentsByUser.get(assignment.user_id) ?? [];
    current.push(assignment);
    assignmentsByUser.set(assignment.user_id, current);
  }

  const contributorProfiles = (profiles ?? [])
    .filter((profile) => (assignmentsByUser.get(profile.id)?.length ?? 0) > 0)
    .sort((a, b) => {
      const aName = a.display_name || a.username || a.id;
      const bName = b.display_name || b.username || b.id;
      return aName.localeCompare(bName);
    });

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">Internal Tool</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Contributor access</h1>
          <p className="mt-4 text-base leading-7 text-white/50">
            Assign scorekeepers or coaches to programs. Contributors only see identity-ready games involving schools they are authorized to cover.
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
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">New Access</p>
              <h2 className="mt-1 text-xl font-black">Add assignment</h2>
            </div>
            <p className="text-xs text-white/35">Adding another school keeps any existing assignments intact.</p>
          </div>

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

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Current Access</p>
              <h2 className="mt-1 text-xl font-black">Contributors</h2>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-white/45">
              {contributorProfiles.length} {contributorProfiles.length === 1 ? "Contributor" : "Contributors"}
            </span>
          </div>

          <div className="mt-4 space-y-4">
            {contributorProfiles.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/50">No contributor program assignments yet.</div>
            ) : (
              contributorProfiles.map((profile) => {
                const memberAssignments = assignmentsByUser.get(profile.id) ?? [];
                const name = profile.display_name || profile.username || profile.id;

                return (
                  <article key={profile.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
                      <div>
                        <p className="text-base font-black text-white">{name}</p>
                        {profile.username ? <p className="mt-1 text-xs text-white/35">@{profile.username}</p> : null}
                      </div>
                      <span className="rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100/75">
                        {memberAssignments.length} {memberAssignments.length === 1 ? "Program" : "Programs"}
                      </span>
                    </div>

                    <div className="mt-4 space-y-3">
                      {memberAssignments.map((assignment) => {
                        const school = schoolMap.get(assignment.school_slug);
                        const schoolName = school ? `${school.name} ${school.mascot}` : assignment.school_slug;

                        return (
                          <div key={`${assignment.user_id}-${assignment.school_slug}`} className="rounded-xl border border-white/10 bg-black/20 p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-black text-white">{schoolName}</p>
                                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
                                  {assignment.assignment_role === "coach" ? "Coach Access" : "Scorekeeper Access"}
                                </p>
                              </div>

                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                <form action={assignContributorSchool} className="flex gap-2">
                                  <input type="hidden" name="user_id" value={assignment.user_id} />
                                  <input type="hidden" name="school_slug" value={assignment.school_slug} />
                                  <select
                                    name="assignment_role"
                                    defaultValue={assignment.assignment_role}
                                    aria-label={`Access type for ${schoolName}`}
                                    className="min-w-[8.5rem] rounded-full border border-white/10 bg-black/40 px-3 py-2 text-xs font-bold text-white focus:border-[var(--vv-accent)] focus:outline-none"
                                  >
                                    <option value="scorekeeper">Scorekeeper</option>
                                    <option value="coach">Coach</option>
                                  </select>
                                  <button type="submit" className="rounded-full border border-white/15 px-4 py-2 text-xs font-black text-white/75 transition hover:border-white/30 hover:text-white">
                                    Save
                                  </button>
                                </form>

                                <form action={removeContributorSchool}>
                                  <input type="hidden" name="user_id" value={assignment.user_id} />
                                  <input type="hidden" name="school_slug" value={assignment.school_slug} />
                                  <button type="submit" className="w-full rounded-full border border-red-400/25 bg-red-500/10 px-4 py-2 text-xs font-black text-red-100 transition hover:bg-red-500/20 sm:w-auto">
                                    Remove
                                  </button>
                                </form>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-white/10 pt-6">
          <Link href="/account" className="text-sm font-bold text-white/55 transition hover:text-white">← Back to account</Link>
          <Link href="/internal/score-review" className="text-sm font-bold text-white/55 transition hover:text-white">Score review →</Link>
        </div>
      </div>
    </main>
  );
}
