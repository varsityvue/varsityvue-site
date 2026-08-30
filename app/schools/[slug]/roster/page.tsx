import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import SchoolSubnav from "../../../../components/SchoolSubnav";
import { getDistrictById } from "@/lib/districts";
import { getSchoolRoster } from "@/lib/rosters";
import { getSchoolBySlug } from "@/lib/schools";

const SEASON = 2026;

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);

  if (!school) return { title: "School Not Found | VarsityVue" };

  return {
    title: `${school.fullName} ${SEASON} Football Roster | VarsityVue`,
    description: `${school.fullName} ${SEASON} football roster with verified jersey numbers, grades, positions, and player profiles currently available on VarsityVue.`,
  };
}

export default async function SchoolRosterPage({ params }: Props) {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);
  if (!school) notFound();

  const district = getDistrictById(school.districtId);
  const districtSlug = district?.slug ?? school.districtId;
  const roster = getSchoolRoster(slug, SEASON);
  const theme = {
    primary: school.colors.primary,
    secondary: school.colors.secondary,
    accent: school.colors.accent,
  };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section
        className="border-b border-white/10 px-4 py-10 sm:px-6 lg:px-8"
        style={{
          background: `radial-gradient(circle at top left, ${theme.primary}66 0%, transparent 35%), radial-gradient(circle at top right, ${theme.secondary}22 0%, transparent 28%), linear-gradient(120deg,#050505 0%,#090909 50%,#000 100%)`,
        }}
      >
        <div className="mx-auto max-w-6xl">
          <Link href={`/schools/${school.slug}`} className="text-xs font-black uppercase tracking-[0.16em] text-white/45 transition hover:text-white">
            ← {school.name} Hub
          </Link>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.28em]" style={{ color: theme.secondary }}>
            {SEASON} Football
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl lg:text-6xl">{school.fullName} Roster</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/55">
            Verified roster information currently available for the {SEASON} season. Select a player to view their VarsityVue profile and any verified game statistics on file.
          </p>

          {roster.length > 0 && (
            <div className="mt-7 flex flex-wrap gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Players Listed</p>
                <p className="mt-1 text-2xl font-black">{roster.length}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/35">Roster Season</p>
                <p className="mt-1 text-2xl font-black">{SEASON}</p>
              </div>
            </div>
          )}
        </div>
      </section>

      <SchoolSubnav schoolSlug={school.slug} districtSlug={districtSlug} theme={theme} />

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {roster.length > 0 ? (
            <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] shadow-2xl">
              <div className="h-1.5" style={{ backgroundColor: theme.primary }} />
              <div className="border-b border-white/10 px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Verified Roster</p>
                    <h2 className="mt-2 text-2xl font-black">{school.name} football</h2>
                  </div>
                  <p className="text-xs text-white/35">Number · Player · Grade · Position</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-sm">
                  <thead className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.12em] text-white/35">
                    <tr>
                      <th className="w-20 px-5 py-4 text-left">#</th>
                      <th className="px-5 py-4 text-left">Player</th>
                      <th className="px-5 py-4 text-left">Grade</th>
                      <th className="px-5 py-4 text-left">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((player) => (
                      <tr key={player.playerId} className="border-t border-white/5 first:border-0 transition hover:bg-white/[0.035]">
                        <td className="px-5 py-4 text-lg font-black text-white/45">{player.jerseyNumber ?? "—"}</td>
                        <td className="px-5 py-4">
                          <Link href={`/players/${player.playerId}`} className="font-black text-white transition hover:text-white/70">
                            {player.name}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-white/60">{player.grade ?? "—"}</td>
                        <td className="px-5 py-4 font-semibold text-white/65">{player.positions?.join(" / ") ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-white/10 px-5 py-4 text-xs leading-5 text-white/35 sm:px-6">
                Roster details reflect verified information currently on file. Player profiles may contain game statistics only when verified statistical reports are available.
              </div>
            </div>
          ) : (
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">Roster Pending</p>
              <h2 className="mt-3 text-3xl font-black">Roster information is not available yet.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
                VarsityVue will add this roster after player information has been verified from a trusted source.
              </p>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
