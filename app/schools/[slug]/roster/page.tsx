import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import SchoolSubnav from "../../../../components/SchoolSubnav";
import { getDistrictById } from "@/lib/districts";
import { getSchoolRoster } from "@/lib/rosters";
import { getSchoolBySlug } from "@/lib/schools";

const SEASON = 2026;

type Props = { params: Promise<{ slug: string }> };

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
  const theme = { primary: school.colors.primary, secondary: school.colors.secondary, accent: school.colors.accent };

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-8 lg:px-8" style={{ background: `radial-gradient(circle at top left, ${theme.primary}66 0%, transparent 35%), radial-gradient(circle at top right, ${theme.secondary}22 0%, transparent 28%), linear-gradient(120deg,#050505 0%,#090909 50%,#000 100%)` }}>
        <div className="mx-auto max-w-6xl">
          <Link href={`/schools/${school.slug}`} className="text-[9px] font-black uppercase tracking-[0.14em] text-white/40 transition hover:text-white sm:text-xs">← {school.name} Hub</Link>
          <div className="mt-3 flex items-end justify-between gap-3 sm:mt-5 sm:gap-4">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/45 sm:text-xs sm:tracking-[0.28em]">{SEASON} Football</p>
              <h1 className="mt-1 break-words text-2xl font-black leading-tight sm:mt-2 sm:text-5xl lg:text-6xl">Roster</h1>
            </div>
            {roster.length > 0 && <div className="shrink-0 text-right"><p className="text-2xl font-black leading-none text-white sm:text-4xl">{roster.length}</p><p className="mt-0.5 text-[7px] font-black uppercase tracking-[0.1em] text-white/30 sm:mt-1 sm:text-[10px]">Players</p></div>}
          </div>
          <p className="mt-3 hidden max-w-3xl text-sm leading-6 text-white/50 sm:block sm:text-base sm:leading-7">Verified roster information for the {SEASON} season. Select a player to view their VarsityVue profile and verified game statistics on file.</p>
        </div>
      </section>

      <SchoolSubnav schoolSlug={school.slug} districtSlug={districtSlug} theme={theme} />

      <section className="px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {roster.length > 0 ? (
            <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-white/[0.045] shadow-2xl sm:rounded-[1.75rem]">
              <div className="h-1" style={{ backgroundColor: theme.primary }} />
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-3.5 py-3 sm:px-6 sm:py-5">
                <div><p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/40 sm:text-xs sm:tracking-[0.22em]">Verified Roster</p><h2 className="mt-0.5 text-base font-black sm:mt-2 sm:text-2xl">{school.name} football</h2></div>
                <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.08em] text-white/40 sm:hidden">{SEASON}</span>
              </div>

              <div className="divide-y divide-white/10 md:hidden">
                {roster.map((player) => (
                  <Link key={player.playerId} href={`/players/${player.playerId}`} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-center gap-2.5 px-3.5 py-2.5 transition hover:bg-white/[0.04] sm:grid-cols-[40px_minmax(0,1fr)_auto] sm:gap-3 sm:px-4 sm:py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border text-xs font-black sm:h-10 sm:w-10 sm:text-sm" style={{ borderColor: `${theme.primary}66`, backgroundColor: `${theme.primary}22` }}>{player.jerseyNumber ?? "—"}</div>
                    <div className="min-w-0"><p className="break-words text-[13px] font-black leading-4 text-white sm:text-sm">{player.name}</p><p className="mt-0.5 truncate text-[8px] font-bold uppercase tracking-[0.08em] text-white/30 sm:mt-1 sm:text-[9px] sm:tracking-[0.1em]">{player.positions?.join(" / ") ?? "Position TBD"}</p></div>
                    <div className="text-right"><p className="text-[7px] font-black uppercase tracking-[0.08em] text-white/25 sm:text-[8px] sm:tracking-[0.1em]">Grade</p><p className="mt-0.5 text-[11px] font-black text-white/55 sm:text-xs">{player.grade ?? "—"}</p></div>
                  </Link>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm"><thead className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.12em] text-white/35"><tr><th className="w-20 px-5 py-4 text-left">#</th><th className="px-5 py-4 text-left">Player</th><th className="px-5 py-4 text-left">Grade</th><th className="px-5 py-4 text-left">Position</th></tr></thead><tbody>{roster.map((player) => <tr key={player.playerId} className="border-t border-white/5 first:border-0 transition hover:bg-white/[0.035]"><td className="px-5 py-4 text-lg font-black text-white/45">{player.jerseyNumber ?? "—"}</td><td className="px-5 py-4"><Link href={`/players/${player.playerId}`} className="font-black text-white transition hover:text-white/70">{player.name}</Link></td><td className="px-5 py-4 text-white/60">{player.grade ?? "—"}</td><td className="px-5 py-4 font-semibold text-white/65">{player.positions?.join(" / ") ?? "—"}</td></tr>)}</tbody></table>
              </div>

              <div className="hidden border-t border-white/10 px-6 py-4 text-xs leading-5 text-white/35 sm:block">Roster details reflect verified information currently on file.</div>
            </div>
          ) : (
            <section className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-7"><p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/35 sm:text-xs sm:tracking-[0.24em]">Roster Pending</p><h2 className="mt-1.5 text-lg font-black sm:mt-3 sm:text-3xl">Roster information is not available yet.</h2><p className="mt-1.5 max-w-2xl text-[11px] leading-5 text-white/45 sm:mt-3 sm:text-sm sm:leading-7">Send roster information or a trusted source to VarsityVue for review.</p><Link href="/submit" className="mt-3 inline-flex rounded-full px-4 py-2 text-[11px] font-black transition hover:opacity-90 sm:mt-5 sm:px-5 sm:py-3 sm:text-sm" style={{ backgroundColor: theme.secondary, color: theme.primary }}>Submit Roster Information</Link></section>
          )}
        </div>
      </section>
    </main>
  );
}
