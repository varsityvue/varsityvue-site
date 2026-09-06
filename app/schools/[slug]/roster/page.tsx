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

  if (!school) return { title: "School Not Found" };

  return {
    title: `${school.fullName} ${SEASON} Football Roster`,
    description: `${school.fullName} ${SEASON} football roster with verified jersey numbers, grades, positions, and player profiles currently available on VarsityVue.`,
    alternates: { canonical: `/schools/${school.slug}/roster` },
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
        className="border-b border-white/10 px-4 py-7 sm:px-6 sm:py-10 lg:px-8"
        style={{
          background: `radial-gradient(circle at top left, ${theme.primary}66 0%, transparent 35%), radial-gradient(circle at top right, ${theme.secondary}22 0%, transparent 28%), linear-gradient(120deg,#050505 0%,#090909 50%,#000 100%)`,
        }}
      >
        <div className="mx-auto max-w-6xl">
          <Link href={`/schools/${school.slug}`} className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45 transition hover:text-white sm:text-xs">
            ← {school.name} Hub
          </Link>

          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.26em] text-white/55 sm:mt-6 sm:text-xs sm:tracking-[0.28em]">
            {SEASON} Football
          </p>
          <h1 className="mt-2 break-words text-3xl font-black leading-tight sm:mt-3 sm:text-5xl lg:text-6xl">
            {school.name} Roster
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55 sm:mt-4 sm:text-base sm:leading-7">
            Verified roster information for the {SEASON} season. Select a player to view their VarsityVue profile and verified game statistics on file.
          </p>

          {roster.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-7 sm:flex sm:flex-wrap">
              <SummaryCard label="Players Listed" value={roster.length.toString()} />
              <SummaryCard label="Roster Season" value={SEASON.toString()} />
            </div>
          )}
        </div>
      </section>

      <SchoolSubnav schoolSlug={school.slug} districtSlug={districtSlug} theme={theme} />

      <section className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {roster.length > 0 ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.045] shadow-2xl sm:rounded-[1.75rem]">
              <div className="h-1.5" style={{ backgroundColor: theme.primary }} />

              <div className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40 sm:text-xs">Verified Roster</p>
                <h2 className="mt-1.5 text-xl font-black sm:mt-2 sm:text-2xl">{school.name} football</h2>
              </div>

              <div className="divide-y divide-white/10 md:hidden">
                {roster.map((player) => (
                  <Link
                    key={player.playerId}
                    href={`/players/${player.playerId}`}
                    className="grid grid-cols-[46px_1fr_auto] items-center gap-3 px-4 py-4 transition hover:bg-white/[0.04]"
                  >
                    <div
                      className="flex h-11 w-11 items-center justify-center rounded-xl border text-base font-black"
                      style={{ borderColor: `${theme.primary}66`, backgroundColor: `${theme.primary}22` }}
                    >
                      {player.jerseyNumber ?? "—"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">{player.name}</p>
                      <p className="mt-1 truncate text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
                        {player.positions?.join(" / ") ?? "Position TBD"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/30">Grade</p>
                      <p className="mt-1 text-sm font-black text-white/65">{player.grade ?? "—"}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
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

              <div className="border-t border-white/10 px-4 py-3 text-[11px] leading-5 text-white/35 sm:px-6 sm:py-4 sm:text-xs">
                Roster details reflect verified information currently on file.
              </div>
            </div>
          ) : (
            <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl sm:rounded-[1.75rem] sm:p-7">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/35 sm:text-xs">Roster Pending</p>
              <h2 className="mt-3 text-2xl font-black sm:text-3xl">Roster information is not available yet.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/50 sm:leading-7">
                Send roster information or a trusted source to VarsityVue for review.
              </p>
              <Link
                href="/submit"
                className="mt-5 inline-flex rounded-full px-5 py-3 text-sm font-black transition hover:opacity-90"
                style={{ backgroundColor: theme.secondary, color: theme.primary }}
              >
                Submit Roster Information
              </Link>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 sm:px-5 sm:py-4">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35 sm:text-[10px] sm:tracking-[0.16em]">{label}</p>
      <p className="mt-1 text-xl font-black sm:text-2xl">{value}</p>
    </div>
  );
}
