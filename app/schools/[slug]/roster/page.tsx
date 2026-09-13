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
  if (!school) return { title: "School Not Found", robots: { index: false, follow: false } };
  const description = `${school.fullName} ${SEASON} football roster with verified jersey numbers, grades, positions, and player profiles currently available on VarsityVue.`;
  const shouldIndex = school.status === "pilot";
  return {
    title: `${school.fullName} ${SEASON} Football Roster`,
    description,
    alternates: { canonical: `/schools/${school.slug}/roster` },
    openGraph: {
      title: `${school.fullName} ${SEASON} Football Roster | VarsityVue`,
      description,
      url: `/schools/${school.slug}/roster`,
      type: "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "VarsityVue — Texas High School Football" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${school.fullName} ${SEASON} Football Roster | VarsityVue`,
      description,
      images: ["/opengraph-image"],
    },
    robots: shouldIndex ? { index: true, follow: true } : { index: false, follow: true },
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
            <div className="grid gap-2 sm:gap-3">
              {roster.map((player) => (
                <Link key={player.playerId} href={`/players/${player.playerId}`} className="group grid grid-cols-[2.5rem_1fr_auto] items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5 transition hover:border-white/20 hover:bg-white/[0.07] sm:grid-cols-[3.5rem_1fr_auto] sm:gap-4 sm:rounded-2xl sm:px-5 sm:py-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-black/30 text-sm font-black sm:h-12 sm:w-12 sm:rounded-xl sm:text-lg">{player.jerseyNumber ? `#${player.jerseyNumber}` : "—"}</div>
                  <div className="min-w-0"><p className="truncate text-sm font-black text-white sm:text-lg">{player.name}</p><p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.08em] text-white/35 sm:text-xs sm:tracking-[0.12em]">{[player.grade, player.positions?.join(" / ")].filter(Boolean).join(" · ") || "Roster"}</p></div>
                  <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white/35 transition group-hover:text-white sm:text-xs">Profile →</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 sm:rounded-[1.75rem] sm:p-8">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/40 sm:text-xs sm:tracking-[0.24em]">Roster Status</p>
              <h2 className="mt-1.5 text-xl font-black sm:mt-2 sm:text-3xl">Roster coming soon.</h2>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-white/50 sm:text-base sm:leading-7">VarsityVue only publishes roster details that can be verified from a trusted source.</p>
              <Link href="/submit" className="mt-4 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-white/15 sm:mt-6 sm:px-5 sm:py-3 sm:text-xs sm:tracking-[0.14em]">Submit Roster Information</Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
