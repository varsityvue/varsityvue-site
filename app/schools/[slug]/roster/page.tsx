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
    description: `${school.fullName} ${SEASON} football roster and verified player profiles on VarsityVue.`,
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
            Verified player information is added from school, coach, or official roster materials. Player names link to season stat profiles when available.
          </p>
        </div>
      </section>

      <SchoolSubnav schoolSlug={school.slug} districtSlug={districtSlug} theme={theme} />

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {roster.length > 0 ? (
            <div className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] shadow-2xl">
              <div className="h-1.5" style={{ backgroundColor: theme.primary }} />
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-sm">
                  <thead className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.12em] text-white/35">
                    <tr>
                      <th className="px-5 py-4 text-left">#</th>
                      <th className="px-5 py-4 text-left">Player</th>
                      <th className="px-5 py-4 text-left">Grade</th>
                      <th className="px-5 py-4 text-left">Position</th>
                      <th className="px-5 py-4 text-left">Height</th>
                      <th className="px-5 py-4 text-left">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roster.map((player) => (
                      <tr key={player.playerId} className="border-t border-white/5 first:border-0">
                        <td className="px-5 py-4 font-black text-white/45">{player.jerseyNumber ?? "—"}</td>
                        <td className="px-5 py-4">
                          <Link href={`/players/${player.playerId}`} className="font-black text-white transition hover:text-white/70">
                            {player.name}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-white/60">{player.grade ?? "—"}</td>
                        <td className="px-5 py-4 text-white/60">{player.positions?.join(" / ") ?? "—"}</td>
                        <td className="px-5 py-4 text-white/60">{player.height ?? "—"}</td>
                        <td className="px-5 py-4 text-white/60">{player.weight ? `${player.weight} lb` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-white/35">Roster Pending</p>
              <h2 className="mt-3 text-3xl font-black">Verified roster information is not available yet.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/50">
                VarsityVue will publish this roster after player details have been verified through the program or another trusted official source.
              </p>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
