import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSchools } from "@/lib/schools";
import { requireActiveMember } from "@/lib/member-access";
import { assignContributorSchool, clearContributorRecruitment, removeContributorSchool, reviewContributorApplication, updateContributorRecruitment } from "./actions";

export const metadata: Metadata = {
  title: "Contributor Access",
  robots: { index: false, follow: false, nocache: true },
};

type PageProps = {
  searchParams: Promise<{ message?: string; updated?: string; q?: string }>;
};

const recruitmentLabels: Record<string, string> = {
  uncovered: "Uncovered",
  researching: "Researching",
  contacted: "Contacted",
  interested: "Interested",
  onboarding: "Onboarding",
  paused: "Paused",
};

export default async function ContributorAccessPage({ searchParams }: PageProps) {
  const { supabase, userId } = await requireActiveMember();

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (!roles?.some((row) => row.role === "admin")) redirect("/account");

  const params = await searchParams;
  const [{ data: profiles }, { data: assignments }, { data: recruitmentRows }, { data: applications }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, username, email")
      .order("display_name", { ascending: true, nullsFirst: false }),
    supabase
      .from("contributor_school_assignments")
      .select("user_id, school_slug, assignment_role, active, created_at")
      .eq("active", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("contributor_recruitment_pipeline")
      .select("school_slug, recruitment_status, candidate_name, candidate_contact, recruitment_note, updated_at")
      .order("updated_at", { ascending: false }),
    supabase
      .from("contributor_applications")
      .select("id, applicant_id, school_slug, requested_role, affiliation, contact_detail, experience_note, status, submitted_at, review_note")
      .in("status", ["pending", "deferred"])
      .order("submitted_at", { ascending: true }),
  ]);

  const schools = getSchools()
    .filter((school) => school.status !== "archived")
    .sort((a, b) => a.name.localeCompare(b.name));

  const schoolMap = new Map(schools.map((school) => [school.slug, school]));
  const assignmentsByUser = new Map<string, typeof assignments>();
  const assignmentsBySchool = new Map<string, NonNullable<typeof assignments>>();
  const recruitmentBySchool = new Map((recruitmentRows ?? []).map((row) => [row.school_slug, row]));

  for (const assignment of assignments ?? []) {
    const current = assignmentsByUser.get(assignment.user_id) ?? [];
    current.push(assignment);
    assignmentsByUser.set(assignment.user_id, current);
    const schoolAssignments = assignmentsBySchool.get(assignment.school_slug) ?? [];
    schoolAssignments.push(assignment);
    assignmentsBySchool.set(assignment.school_slug, schoolAssignments);
  }

  const coverageSchools = schools.filter((school) => school.districtId !== "opponent");
  const coveredPrograms = coverageSchools.filter((school) => (assignmentsBySchool.get(school.slug)?.length ?? 0) > 0).length;
  const activeProspects = coverageSchools.filter((school) => {
    const status = recruitmentBySchool.get(school.slug)?.recruitment_status;
    return !assignmentsBySchool.has(school.slug) && status && !["uncovered", "paused"].includes(status);
  }).length;

  const query = params.q?.trim().toLowerCase() ?? "";
  const visibleProfiles = query
    ? (profiles ?? []).filter((profile) =>
        `${profile.display_name ?? ""} ${profile.username ?? ""} ${profile.email ?? ""}`.toLowerCase().includes(query),
      )
    : (profiles ?? []);

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
            Assign school-specific scorekeeper or coach access. This is separate from platform roles such as Moderator or Admin.
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

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"><div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Application Queue</p><h2 className="mt-1 text-xl font-black">Contributor applicants</h2></div><span className="rounded-full border border-white/10 px-3 py-1 text-[10px] font-black text-white/45">{applications?.length ?? 0} open</span></div><div className="mt-4 space-y-4">{applications?.length ? applications.map((application) => { const profile = (profiles ?? []).find((item) => item.id === application.applicant_id); const school = schoolMap.get(application.school_slug); return <article key={application.id} className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black">{profile?.display_name || profile?.username || profile?.email || "Member"}</p><p className="mt-1 text-xs text-white/40">{school ? `${school.name} ${school.mascot}` : application.school_slug} · {application.requested_role}</p></div><span className="rounded-full border border-amber-300/15 bg-amber-300/10 px-2.5 py-1 text-[9px] font-black uppercase text-amber-100">{application.status}</span></div><dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2"><div><dt className="font-black uppercase tracking-[0.1em] text-white/30">Affiliation</dt><dd className="mt-1 text-white/65">{application.affiliation}</dd></div><div><dt className="font-black uppercase tracking-[0.1em] text-white/30">Contact</dt><dd className="mt-1 text-white/65">{application.contact_detail}</dd></div></dl><p className="mt-3 text-xs leading-5 text-white/55">{application.experience_note}</p><form action={reviewContributorApplication} className="mt-4 flex flex-col gap-2 sm:flex-row"><input type="hidden" name="application_id" value={application.id}/><input name="review_note" defaultValue={application.review_note ?? ""} maxLength={1000} placeholder="Decision note (optional)" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-xs"/><button name="decision" value="approve" className="rounded-xl bg-emerald-400/15 px-4 py-2.5 text-xs font-black text-emerald-100">Approve &amp; Assign</button><button name="decision" value="defer" className="rounded-xl border border-amber-300/15 px-4 py-2.5 text-xs font-black text-amber-100/70">Defer</button><button name="decision" value="decline" className="rounded-xl border border-red-300/15 px-4 py-2.5 text-xs font-black text-red-100/70">Decline</button></form></article>; }) : <p className="rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-white/40">No contributor applications are waiting for review.</p>}</div></section>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Coverage Pipeline</p><h2 className="mt-1 text-xl font-black">Programs</h2></div>
            <p className="text-xs text-white/35">Active assignments override recruitment stage and count as covered.</p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-3xl font-black">{coveredPrograms}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100/60">Covered</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-3xl font-black">{activeProspects}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-sky-100/60">Active prospects</p></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"><p className="text-3xl font-black">{coverageSchools.length - coveredPrograms}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100/60">Coverage gaps</p></div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">{coverageSchools.map((school) => {
            const schoolAssignments = assignmentsBySchool.get(school.slug) ?? [];
            const recruitment = recruitmentBySchool.get(school.slug);
            const isCovered = schoolAssignments.length > 0;
            const status = recruitment?.recruitment_status ?? "uncovered";
            return <article key={school.slug} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-base font-black">{school.name} {school.mascot}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/35">{school.classification.conference} {school.classification.division} · {school.districtId.replaceAll("-", " ")}</p></div><span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${isCovered ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : status === "paused" ? "border-white/10 text-white/35" : "border-amber-300/20 bg-amber-300/10 text-amber-100"}`}>{isCovered ? `Covered · ${schoolAssignments.length}` : recruitmentLabels[status] ?? status}</span></div>
              {isCovered ? <p className="mt-3 text-xs text-white/45">{schoolAssignments.map((assignment) => { const profile = (profiles ?? []).find((item) => item.id === assignment.user_id); return `${profile?.display_name || profile?.username || "Contributor"} (${assignment.assignment_role})`; }).join(" · ")}</p> : null}
              <form action={updateContributorRecruitment} className="mt-4 grid gap-2 sm:grid-cols-2"><input type="hidden" name="school_slug" value={school.slug}/><select name="recruitment_status" defaultValue={status} aria-label={`Recruitment status for ${school.name}`} className="rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-xs"><option value="uncovered">Uncovered</option><option value="researching">Researching</option><option value="contacted">Contacted</option><option value="interested">Interested</option><option value="onboarding">Onboarding</option><option value="paused">Paused</option></select><input name="candidate_name" defaultValue={recruitment?.candidate_name ?? ""} maxLength={120} placeholder="Candidate name" className="rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-xs"/><input name="candidate_contact" defaultValue={recruitment?.candidate_contact ?? ""} maxLength={240} placeholder="Email, phone, or social profile" className="rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-xs sm:col-span-2"/><textarea name="recruitment_note" defaultValue={recruitment?.recruitment_note ?? ""} maxLength={1000} rows={2} placeholder="Recruitment notes and next step" className="rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-xs sm:col-span-2"/><div className="flex flex-wrap gap-2 sm:col-span-2"><button className="rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-[10px] font-black text-sky-50">Save Pipeline</button></div></form>
              {recruitment ? <form action={clearContributorRecruitment} className="mt-2"><input type="hidden" name="school_slug" value={school.slug}/><button className="text-[10px] font-bold text-white/30 hover:text-white/60">Clear pipeline details</button></form> : null}
            </article>;
          })}</div>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">New Access</p>
              <h2 className="mt-1 text-xl font-black">Add assignment</h2>
            </div>
            <p className="text-xs text-white/35">Adding another school keeps any existing assignments intact.</p>
          </div>

          <form method="get" className="mt-5 flex gap-2"><input type="search" name="q" defaultValue={params.q ?? ""} placeholder="Find member by name, username, or email" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm outline-none placeholder:text-white/25"/><button className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-xs font-black">Find Member</button>{query ? <Link href="/internal/contributor-access" className="rounded-xl border border-white/10 px-4 py-3 text-xs font-black text-white/45">Clear</Link> : null}</form>
          {query && visibleProfiles.length === 0 ? <p className="mt-3 text-sm text-amber-100/70">No members match “{params.q}”.</p> : null}

          <form action={assignContributorSchool} className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1.2fr_0.8fr_auto] lg:items-end">
            <div>
              <label htmlFor="user_id" className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/40">Member</label>
              <select id="user_id" name="user_id" required defaultValue="" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--vv-accent)] focus:outline-none">
                <option value="" disabled>Select member</option>
                {visibleProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.display_name || profile.username || profile.email || profile.id}{profile.username ? ` (@${profile.username})` : ""}{profile.email ? ` · ${profile.email}` : ""}
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
          <Link href="/internal/members" className="text-sm font-bold text-white/55 transition hover:text-white">← Members & Roles</Link>
          <Link href="/account" className="text-sm font-bold text-white/55 transition hover:text-white">← Back to account</Link>
          <Link href="/internal/score-review" className="text-sm font-bold text-white/55 transition hover:text-white">Score review →</Link>
        </div>
      </div>
    </main>
  );
}
