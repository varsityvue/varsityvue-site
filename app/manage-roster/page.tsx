import Link from "next/link";
import { redirect } from "next/navigation";

import { getSchoolBySlug, getSchools } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";
import { addRosterPlayer, removeRosterPlayer } from "./actions";

type ManageRosterPageProps = {
  searchParams: Promise<{
    school?: string;
    q?: string;
    player?: string;
    message?: string;
    updated?: string;
  }>;
};

type RosterPlayer = {
  id: string;
  school_slug: string;
  first_name: string;
  last_name: string;
  jersey_number: number | null;
  position: string | null;
  grade: string | null;
};

function normalized(value: string) {
  return value.trim().toLowerCase();
}

function playerMatchesQuery(player: RosterPlayer, query: string) {
  const haystack = normalized(
    `${player.first_name} ${player.last_name} ${player.jersey_number ?? ""} ${player.position ?? ""}`,
  );
  return haystack.includes(query);
}

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
        .select("id, school_slug, first_name, last_name, jersey_number, position, grade")
        .eq("school_slug", selectedSlug)
        .eq("season", 2026)
        .eq("active", true)
        .order("jersey_number", { ascending: true, nullsFirst: false })
        .order("last_name", { ascending: true })
    : { data: [] };

  const searchQuery = normalized(params.q ?? "");
  let searchResults: RosterPlayer[] = [];

  if (searchQuery.length >= 2) {
    const { data: searchPool } = await supabase
      .from("school_roster_players")
      .select("id, school_slug, first_name, last_name, jersey_number, position, grade")
      .eq("season", 2026)
      .eq("active", true)
      .limit(500);

    searchResults = ((searchPool ?? []) as RosterPlayer[])
      .filter((player) => playerMatchesQuery(player, searchQuery))
      .sort((a, b) => {
        const aSameSchool = a.school_slug === selectedSlug ? 0 : 1;
        const bSameSchool = b.school_slug === selectedSlug ? 0 : 1;
        if (aSameSchool !== bSameSchool) return aSameSchool - bSameSchool;
        return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`);
      })
      .slice(0, 8);
  }

  let selectedCandidate: RosterPlayer | null = null;
  if (params.player) {
    const { data } = await supabase
      .from("school_roster_players")
      .select("id, school_slug, first_name, last_name, jersey_number, position, grade")
      .eq("id", params.player)
      .eq("season", 2026)
      .eq("active", true)
      .maybeSingle();
    selectedCandidate = (data as RosterPlayer | null) ?? null;
  }

  const selectedRosterIds = new Set((roster ?? []).map((player) => player.id));

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
          <>
            <section className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Player Search</p>
                  <h2 className="mt-1 text-xl font-black">Find an existing player</h2>
                  <p className="mt-1 text-xs leading-5 text-white/40">Search existing 2026 VarsityVue roster records before creating a new player entry.</p>
                </div>
                {searchQuery ? (
                  <Link href={`/manage-roster?school=${encodeURIComponent(selectedSchool.slug)}`} className="text-xs font-black text-white/45 transition hover:text-white">Clear search</Link>
                ) : null}
              </div>

              <form method="get" className="mt-4 flex gap-2">
                <input type="hidden" name="school" value={selectedSchool.slug} />
                <input
                  type="search"
                  name="q"
                  defaultValue={params.q ?? ""}
                  minLength={2}
                  placeholder="Search name, jersey, or position"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/35 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
                />
                <button type="submit" className="rounded-xl bg-white/10 px-4 py-2.5 text-xs font-black text-white transition hover:bg-white/15">Search</button>
              </form>

              {searchQuery.length > 0 && searchQuery.length < 2 ? (
                <p className="mt-3 text-xs text-amber-100/70">Enter at least 2 characters to search players.</p>
              ) : null}

              {searchQuery.length >= 2 ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/25">
                  {searchResults.length ? searchResults.map((player) => {
                    const playerSchool = getSchoolBySlug(player.school_slug);
                    const isOnSelectedRoster = player.school_slug === selectedSchool.slug || selectedRosterIds.has(player.id);
                    const useHref = `/manage-roster?school=${encodeURIComponent(selectedSchool.slug)}&q=${encodeURIComponent(params.q ?? "")}&player=${encodeURIComponent(player.id)}`;

                    return (
                      <div key={player.id} className="flex items-center gap-3 border-b border-white/10 px-3 py-3 last:border-b-0 sm:px-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-xs font-black text-white/70">
                          {player.jersey_number ?? "—"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-black">{player.first_name} {player.last_name}</p>
                          <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.08em] text-white/35">
                            {playerSchool?.name ?? player.school_slug}{player.position ? ` · ${player.position}` : ""}{player.grade ? ` · ${player.grade}` : ""}
                          </p>
                        </div>
                        {isOnSelectedRoster ? (
                          <span className="shrink-0 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-emerald-100/70">On roster</span>
                        ) : (
                          <Link href={useHref} className="shrink-0 rounded-full border border-white/15 bg-white/[0.05] px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.08em] text-white/75 transition hover:bg-white/10 hover:text-white">Use Player</Link>
                        )}
                      </div>
                    );
                  }) : <p className="p-4 text-sm text-white/45">No matching 2026 roster players found. Add a new player below.</p>}
                </div>
              ) : null}
            </section>

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
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Add Player</p>
                    <h2 className="mt-1 text-xl font-black">{selectedCandidate ? "Review player details" : "New roster entry"}</h2>
                  </div>
                  {selectedCandidate ? (
                    <Link href={`/manage-roster?school=${encodeURIComponent(selectedSchool.slug)}${params.q ? `&q=${encodeURIComponent(params.q)}` : ""}`} className="text-[9px] font-black uppercase tracking-[0.08em] text-white/40 transition hover:text-white">Reset</Link>
                  ) : null}
                </div>
                <p className="mt-2 text-xs leading-5 text-white/40">
                  {selectedCandidate
                    ? `Details were copied from ${getSchoolBySlug(selectedCandidate.school_slug)?.name ?? selectedCandidate.school_slug}. Review the jersey number, position, and grade before adding.`
                    : "Search first to avoid duplicate player records, or create a new roster entry here."}
                </p>

                <form action={addRosterPlayer} className="mt-4 space-y-3">
                  <input type="hidden" name="school_slug" value={selectedSchool.slug} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First name" name="first_name" required defaultValue={selectedCandidate?.first_name} />
                    <Field label="Last name" name="last_name" required defaultValue={selectedCandidate?.last_name} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Jersey #" name="jersey_number" type="number" min="0" max="99" defaultValue={selectedCandidate?.jersey_number ?? undefined} />
                    <Field label="Position" name="position" placeholder="QB, WR, LB..." defaultValue={selectedCandidate?.position ?? undefined} />
                  </div>
                  <label className="block">
                    <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">Grade</span>
                    <select name="grade" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-white/25" defaultValue={selectedCandidate?.grade ?? ""}>
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
          </>
        ) : null}
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  min,
  max,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  defaultValue?: string | number;
}) {
  return (
    <label className="block">
      <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">{label}</span>
      <input name={name} type={type} required={required} min={min} max={max} placeholder={placeholder} defaultValue={defaultValue} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/25" />
    </label>
  );
}
