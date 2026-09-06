import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { SchoolTheme } from "../../../types/school-theme";
import { getSchoolBySlug } from "@/lib/schools";
import { getRecentScoresForSchool } from "@/lib/games";
import { getDistrictById } from "@/lib/districts";
import { getStandingsForSchool } from "@/lib/standings";
import SchoolHero from "../../../components/SchoolHero";
import UpcomingSchedulePreview from "../../../components/UpcomingSchedulePreview";
import RecentScores from "../../../components/RecentScores";
import StandingsTable from "../../../components/StandingsTable";
import SchoolSubnav from "../../../components/SchoolSubnav";
import SchoolSeasonPulse from "../../../components/SchoolSeasonPulse";
import SchoolCoverage from "@/components/SchoolCoverage";
import SchoolTeamLeaders from "@/components/SchoolTeamLeaders";
import RivalryWatch from "../../../components/RivalryWatch";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);
  if (!school) return { title: "Page Not Found" };
  return {
    title: `${school.fullName} Football Hub`,
    description: `${school.fullName} schedules, scores, standings, roster, player statistics, district information, game coverage, and football updates on VarsityVue.`,
    alternates: { canonical: `/schools/${school.slug}` },
  };
}

export default async function SchoolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);
  if (!school) notFound();

  const district = getDistrictById(school.districtId);
  const districtSlug = district?.slug ?? school.districtId;
  const theme: SchoolTheme = { primary: school.colors.primary, secondary: school.colors.secondary, accent: school.colors.accent };
  const recentScores = getRecentScoresForSchool(slug);
  const standings = getStandingsForSchool(slug);

  const schoolSchema = {
    "@context": "https://schema.org", "@type": "SportsTeam", name: school.fullName, alternateName: school.name, sport: "Football",
    url: `https://varsityvue.com/schools/${school.slug}`,
    location: { "@type": "Place", name: school.stadium ?? `${school.name} football stadium` },
    memberOf: district ? { "@type": "SportsOrganization", name: district.name, url: `https://varsityvue.com/districts/${district.slug}` } : undefined,
    publisher: { "@type": "Organization", name: "VarsityVue", url: "https://varsityvue.com" },
  };

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolSchema) }} />
      <SchoolHero school={school} />
      <SchoolSubnav schoolSlug={school.slug} districtSlug={districtSlug} theme={theme} />

      <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
        <SchoolSeasonPulse schoolSlug={school.slug} theme={theme} />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-[1.45fr_0.75fr] lg:px-8">
        <div className="min-w-0 space-y-5 sm:space-y-6">
          {recentScores.length > 0 && <RecentScores scores={recentScores} theme={theme} schoolSlug={slug} />}
          <SchoolTeamLeaders schoolSlug={school.slug} season={2026} primaryColor={theme.primary} secondaryColor={theme.secondary} />
          <UpcomingSchedulePreview schoolSlug={school.slug} theme={theme} />
          <StandingsTable
            standings={standings}
            theme={theme}
            currentSchoolSlug={school.slug}
            districtHref={`/districts/${districtSlug}`}
          />
          <SchoolCoverage schoolSlug={school.slug} />
        </div>

        <aside className="min-w-0 space-y-6">
          <section className="rounded-[1.75rem] border p-5 shadow-2xl sm:p-6" style={{ borderColor: `${theme.primary}55`, background: "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(0,0,0,0.94) 48%, rgba(0,0,0,1))", boxShadow: `inset 4px 0 0 ${theme.primary}, 0 18px 50px rgba(0,0,0,0.45)` }}>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/50 sm:text-xs sm:tracking-[0.28em]">Program Snapshot</p>
            <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">{school.fullName}</h2>
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
              {school.headCoach && <SnapshotTile label="Head Coach" value={school.headCoach} />}
              <SnapshotTile label="Region" value={`Region ${school.uilRegion}`} />
              <SnapshotTile label="District" value={district?.name ?? "TBD"} />
              {school.stadium && <SnapshotTile label="Stadium" value={school.stadium} />}
              {school.stadiumCapacity && <SnapshotTile label="Capacity" value={school.stadiumCapacity.toLocaleString()} />}
              {school.stateTitles !== undefined && <SnapshotTile label="State Titles" value={school.stateTitles.toString()} />}
              {school.lastPlayoffAppearance && <SnapshotTile label="Last Playoff" value={school.lastPlayoffAppearance.toString()} />}
            </div>
          </section>

          <RivalryWatch schoolSlug={school.slug} />

          {(school.officialWebsite || school.facebookUrl || school.instagramUrl || school.xUrl) && (
            <section className="rounded-[1.75rem] border p-6 shadow-2xl" style={{ borderColor: `${theme.primary}55`, background: "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(0,0,0,0.94) 50%, rgba(0,0,0,1))", boxShadow: `inset 4px 0 0 ${theme.primary}, 0 18px 50px rgba(0,0,0,0.45)` }}>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/50">Official Links</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {school.officialWebsite && <ExternalLinkButton href={school.officialWebsite} label="Website" />}
                {school.facebookUrl && <ExternalLinkButton href={school.facebookUrl} label="Facebook" />}
                {school.instagramUrl && <ExternalLinkButton href={school.instagramUrl} label="Instagram" />}
                {school.xUrl && <ExternalLinkButton href={school.xUrl} label="X" />}
              </div>
            </section>
          )}

          <section className="rounded-[1.75rem] border p-6 shadow-2xl" style={{ borderColor: `${theme.secondary}66`, background: `linear-gradient(135deg, ${theme.primary}55, ${theme.secondary}22 52%, rgba(0,0,0,0.96) 82%)`, boxShadow: `inset 4px 0 0 ${theme.secondary}, 0 18px 50px rgba(0,0,0,0.45)` }}>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/55">Help Build This Hub</p>
            <h2 className="mt-3 text-2xl font-black text-white">Have stats, photos or a correction?</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">Send program information to VarsityVue for review.</p>
            <Link href="/submit" className="mt-5 inline-flex rounded-full px-5 py-3 text-sm font-black transition hover:opacity-90" style={{ backgroundColor: theme.secondary, color: theme.primary }}>Submit Information</Link>
          </section>
        </aside>
      </div>
    </main>
  );
}

function SnapshotTile({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-xl border border-white/10 bg-black/35 p-3.5 sm:rounded-2xl sm:p-4"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35 sm:text-[10px] sm:tracking-[0.16em]">{label}</p><p className="mt-1.5 break-words text-xs font-black leading-5 text-white/80 sm:mt-2 sm:text-sm">{value}</p></div>;
}

function ExternalLinkButton({ href, label }: { href: string; label: string }) {
  return <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-full border border-white/10 bg-black/35 px-4 py-2.5 text-xs font-black text-white/70 transition hover:bg-white/10 hover:text-white">{label} ↗</a>;
}
