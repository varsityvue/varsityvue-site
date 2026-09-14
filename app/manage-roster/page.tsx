import Link from "next/link";
import { redirect } from "next/navigation";

import { getSchoolBySlug, getSchools } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";
import { addRosterPlayer, removeRosterPlayer } from "./actions";

type ManageRosterPageProps = {
  searchParams: Promise<{ school?: string; message?: string; updated?: string }>;
};

export default async function ManageRosterPage({ searchParams }: ManageRosterPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    const next = params.school ? `/manage-roster?school=${encodeURIComponent(params.school)}` : "/manage-roster";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const [{ data: roles }, { data: assignments }] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase
      .from("contributor_school_assignments")
      .select("school_slug, assignment_role, active")
      .eq("user_id", userId)
      .eq("assignment_role", "coach")
      .eq("active", true)
      .order("school_slug", { ascending: true }),
  ]);

  const isAdmin = roles?.some((row) => row.role === "admin") ?? false;
  const coachSlugs = new Set((assignments ?? []).map((row) => row.school_slug));
  const accessibleSchools = isAdmin
    ? getSchools().filter((school) => school.status !== "archived")
    : getSchools().filter((school) => coachSlugs.has(school.slug));

  if (!isAdmin && accessibleSchools.length === 0) redirect("/account");

  const selectedSlug = params.school && accessibleSchools.some((school) => school.slug === params.school)
    ? params.school
    : accessibleSchools[0]?.slug;
  const selectedSchool = selectedSlug ? getSchoolBySlug(selectedSlug) : undefined;

  const { data: roster } = selectedSlug
    ? await supabase
        .from("school_roster_players")
        .select("id, first_name, last_name, jersey_number, position, grade")
        .eq("school_slug", selectedSlug)
        .eq("season", 2026)
        .eq("active", true)
        .order("jersey_number", { ascending: true, nullsFirst: false })
        .order("last_name", { ascending: true })
    : { data: [] };

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-8 text-white sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <Link href="/account" className="text-xs font-black uppercase tracking-[0.12em] text-white/45 transition hover:text-white">← Account</Link>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/45">2026 Roster</span>
        </div>

        <section className="mt-4 rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.35),transparent_42%),rgba(255,255,255,0.04)] p-5 shadow-2xl sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vv-accent)]">Team Management</p>
          <h1 className="mt-2 text-3xl font-black sm:text-5xl">Manage Roster</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55 sm:text-base">
            {isAdmin
              ? "Admins can manage roster records for any active VarsityVue program."
              : "Roster editing is limited to programs where your contributor assignment is Coach."}
          </p>
        </section>

        {params.message ? <div className="mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">{params.message}</div> : null}
        {params.updated ? <div className="mt-4 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">Roster updated.</div> : null}

        <section className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {accessibleSchools.map((school) => (
              <Link
                key={school.slug}
                href={`/manage-roster?school=${encodeURIComponent(school.slug)}`}
                className={`rounded-full border px-3 py-2 text-xs font-black transition ${school.slug === selectedSlug ? "border-[var(--vv-primary)] bg-[var(--vv-primary)] text-white" : "border-white/10 bg-black/20 text-white/60 hover:text-white"}`}
              >
                {school.name}
              </Link>
            ))}
          </div>
        </section>

        {selectedSchool ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <section className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Current Roster</p>
                  <h2 className="mt-1 text-2xl font-black">{selectedSchool.name}</h2>
                </div>
                <span className="text-xs font-black text-white/35">{roster?.length ?? 0} players</span>
              </div>

              <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/25">
                {(roster ?? []).length ? (roster ?? []).map((player) => (
                  <div key={player.id} className="flex items-center gap-3 border-b border-white/10 px-3 py-3 last:border-b-0 sm:px-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-xs font-black text-white/70">
                      {player.jersey_number ?? "—"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-black">{player.first_name} {player.last_name}</p>
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">
                        {[player.position, player.grade].filter(Boolean).join(" · ") || "Details pending"}
                      </p>
                    </div>
                    <form action={removeRosterPlayer}>
                      <input type="hidden" name="school_slug" value={selectedSchool.slug} />
                      <input type="hidden" name="player_id" value={player.id} />
                      <button className="rounded-full border border-red-300/15 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-red-100/65 transition hover:bg-red-400/10 hover:text-red-100" type="submit">Remove</button>
                    </form>
                  </div>
                )) : <p className="p-4 text-sm text-white/45">No active players have been added for 2026 yet.</p>}
              </div>
            </section>

            <section className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Add Player</p>
              <h2 className="mt-1 text-xl font-black">Roster entry</h2>
              <p className="mt-2 text-xs leading-5 text-white/40">Player search and duplicate matching can layer onto this form next. This first pass writes directly into the verified school roster.</p>

              <form action={addRosterPlayer} className="mt-4 space-y-3">
                <input type="hidden" name="school_slug" value={selectedSchool.slug} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name" name="first_name" required />
                  <Field label="Last name" name="last_name" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Jersey #" name="jersey_number" type="number" min="0" max="99" />
                  <Field label="Position" name="position" placeholder="QB, WR, LB..." />
                </div>
                <label className="block">
                  <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">Grade</span>
                  <select name="grade" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-white/25" defaultValue="">
                    <option value="">Unknown</option>
                    <option value="Fr">Freshman</option>
                    <option value="So">Sophomore</option>
                    <option value="Jr">Junior</option>
                    <option value="Sr">Senior</option>
                  </select>
                </label>
                <button type="submit" className="w-full rounded-xl bg-[var(--vv-primary)] px-4 py-3 text-sm font-black transition hover:bg-[#93142a]">Add Player</button>
              </form>
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}

function Field({ label, name, type = "text", required = false, min, max, placeholder }: { label: string; name: string; type?: string; required?: boolean; min?: string; max?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">{label}</span>
      <input name={name} type={type} required={required} min={min} max={max} placeholder={placeholder} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25" />
    </label>
  );
}
