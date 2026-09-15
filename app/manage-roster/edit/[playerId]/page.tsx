import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getSchoolBySlug } from "@/lib/schools";
import { createClient } from "@/lib/supabase/server";
import { updateRosterPlayer } from "../../actions";

type EditRosterPlayerPageProps = {
  params: Promise<{ playerId: string }>;
};

export default async function EditRosterPlayerPage({ params }: EditRosterPlayerPageProps) {
  const { playerId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) redirect(`/login?next=${encodeURIComponent(`/manage-roster/edit/${playerId}`)}`);

  const { data: player } = await supabase
    .from("school_roster_players")
    .select("id, school_slug, first_name, last_name, jersey_number, position, grade, player_profile_id")
    .eq("id", playerId)
    .eq("season", 2026)
    .eq("active", true)
    .maybeSingle();

  if (!player) notFound();

  const [{ data: adminRole }, { data: coachAssignment }] = await Promise.all([
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle(),
    supabase
      .from("contributor_school_assignments")
      .select("school_slug")
      .eq("user_id", userId)
      .eq("school_slug", player.school_slug)
      .eq("assignment_role", "coach")
      .eq("active", true)
      .maybeSingle(),
  ]);

  if (!adminRole && !coachAssignment) redirect("/account");

  const school = getSchoolBySlug(player.school_slug);
  if (!school) notFound();

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-8 text-white sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-xl">
        <Link
          href={`/manage-roster?school=${encodeURIComponent(school.slug)}`}
          className="text-xs font-black uppercase tracking-[0.12em] text-white/45 transition hover:text-white"
        >
          ← {school.name} Roster
        </Link>

        <section className="mt-4 rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.35),transparent_42%),rgba(255,255,255,0.04)] p-5 shadow-2xl sm:p-7">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vv-accent)]">Team Management</p>
            {player.player_profile_id && <span className="rounded-full border border-sky-300/15 bg-sky-300/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-sky-100/80">Verified identity</span>}
          </div>
          <h1 className="mt-2 text-3xl font-black">Edit Player</h1>
          <p className="mt-2 text-sm text-white/50">Update this player&apos;s 2026 roster details for {school.name}.</p>
        </section>

        <section className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4 sm:p-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-sm font-black text-white/70">
              {player.jersey_number ?? "—"}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-black">{player.first_name} {player.last_name}</p>
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-white/35">
                {[player.position, player.grade].filter(Boolean).join(" · ") || "Details pending"}
              </p>
            </div>
          </div>

          {player.player_profile_id && <div className="mt-4 rounded-xl border border-sky-300/15 bg-sky-300/[0.08] px-3 py-2.5"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-sky-100/80">Connected player profile</p><p className="mt-1 text-xs leading-5 text-white/50">The verified player name is locked here. Jersey number, position, and grade can still be updated for this roster.</p></div>}

          <form action={updateRosterPlayer} className="mt-5 space-y-3">
            <input type="hidden" name="school_slug" value={school.slug} />
            <input type="hidden" name="player_id" value={player.id} />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="First name" name="first_name" required defaultValue={player.first_name} disabled={Boolean(player.player_profile_id)} />
              <Field label="Last name" name="last_name" required defaultValue={player.last_name} disabled={Boolean(player.player_profile_id)} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Jersey #" name="jersey_number" type="number" min="0" max="99" defaultValue={player.jersey_number ?? undefined} />
              <Field label="Position" name="position" placeholder="QB, WR, LB..." defaultValue={player.position ?? undefined} />
            </div>
            <label className="block">
              <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">Grade</span>
              <select
                name="grade"
                defaultValue={player.grade ?? ""}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white outline-none focus:border-white/25"
              >
                <option value="">Unknown</option>
                <option value="Fr">Freshman</option>
                <option value="So">Sophomore</option>
                <option value="Jr">Junior</option>
                <option value="Sr">Senior</option>
              </select>
            </label>
            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <button type="submit" className="flex-1 rounded-xl bg-[var(--vv-primary)] px-4 py-3 text-sm font-black transition hover:bg-[#93142a]">
                Save Changes
              </button>
              <Link href={`/manage-roster?school=${encodeURIComponent(school.slug)}`} className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-center text-sm font-black text-white/60 transition hover:bg-white/10 hover:text-white">
                Cancel
              </Link>
            </div>
          </form>
        </section>
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
  disabled = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  min?: string;
  max?: string;
  placeholder?: string;
  defaultValue?: string | number;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        min={min}
        max={max}
        placeholder={placeholder}
        defaultValue={defaultValue}
        disabled={disabled}
        className={`mt-1.5 w-full rounded-xl border border-white/10 px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/20 ${disabled ? "cursor-not-allowed bg-white/[0.04] text-white/45" : "bg-black/40 focus:border-white/25"}`}
      />
    </label>
  );
}
