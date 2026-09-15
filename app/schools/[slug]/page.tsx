import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { SchoolTheme } from "../../../types/school-theme";
import { getSchoolBySlug } from "@/lib/schools";
import { getRecentScoresForSchool } from "@/lib/games";
import { getDistrictById } from "@/lib/districts";
import { getStandingsForSchool } from "@/lib/standings";
import { createClient } from "@/lib/supabase/server";
import { getSchoolBroadcastLinks } from "@/data/school-broadcasts";
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
    robots: school.status === "pilot" ? { index: true, follow: true } : { index: false, follow: true },
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
  const broadcastLinks = getSchoolBroadcastLinks(school.slug);
  const hasOfficialLinks = Boolean(school.officialWebsite || school.facebookUrl || school.instagramUrl || school.xUrl);
  const officialProfiles = [school.officialWebsite, school.facebookUrl, school.instagramUrl, school.xUrl].filter(
    (url): url is string => Boolean(url),
  );
  const schoolUrl = `https://varsityvue.com/schools/${school.slug}`;

  let canManageRoster = false;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (userId) {
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
        .eq("school_slug", school.slug)
        .eq("assignment_role", "coach")
        .eq("active", true)
        .maybeSingle(),
    ]);
    canManageRoster = Boolean(adminRole || coachAssignment);
  }

  const schoolSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SportsTeam",
        "@id": `${schoolUrl}#team`,
        name: school.fullName,
        alternateName: school.name,
        sport: "Football",
        url: schoolUrl,
        ...(officialProfiles.length ? { sameAs: officialProfiles } : {}),
        ...(school.headCoach
          ? {
              coach: {
                "@type": "Person",
                name: school.headCoach,
              },
            }
          : {}),
        location: {
          "@type": "Place",
          name: school.stadium ?? `${school.name} football stadium`,
          ...(school.stadiumAddress
            ? {
                address: {
                  "@type": "PostalAddress",
                  streetAddress: school.stadiumAddress,
                  addressRegion: "TX",
                  addressCountry: "US",
                },
              }
            : {}),
        },
        ...(district
          ? {
              memberOf: {
                "@type": "SportsOrganization",
                name: district.name,
                url: `https://varsityvue.com/districts/${district.slug}`,
              },
            }
          : {}),
        publisher: {
          "@type": "Organization",
          "@id": "https://varsityvue.com/#organization",
          name: "VarsityVue",
          url: "https://varsityvue.com",
        },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${schoolUrl}#breadcrumb`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: "https://varsityvue.com/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Schools",
            item: "https://varsityvue.com/schools",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: school.fullName,
            item: schoolUrl,
          },
        ],
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolSchema) }} />
      <SchoolHero school={school} />
      <SchoolSubnav schoolSlug={school.slug} districtSlug={districtSlug} theme={theme} />

      {canManageRoster ? (
        <div className="mx-auto w-full max-w-6xl px-4 pt-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300/15 bg-amber-300/[0.07] px-3 py-2.5 sm:px-4">
            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.14em] text-amber-100/45">Team Management</p>
              <p className="mt-0.5 truncate text-xs font-black text-amber-50 sm:text-sm">You can manage {school.name}&apos;s 2026 roster.</p>
            </div>
            <Link href={`/manage-roster?school=${encodeURIComponent(school.slug)}`} className="shrink-0 rounded-lg border border-amber-200/15 bg-amber-200/10 px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-amber-50 transition hover:bg-amber-200/15 sm:text-[10px]">Manage Roster →</Link>
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
        <SchoolSeasonPulse schoolSlug={school.slug} theme={theme} />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
        <div className="min-w-0 space-y-5 sm:space-y-6">
          {recentScores.length > 0 && <RecentScores scores={recentScores} theme={theme} schoolSlug={slug} />}
          <SchoolTeamLeaders schoolSlug={school.slug} season={2026} primaryColor={theme.primary} secondaryColor={theme.secondary} />
          <UpcomingSchedulePreview schoolSlug={school.slug} theme={theme} />
          {broadcastLinks.length > 0 && (
            <section className="rounded-[1.35rem] border p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-6" style={{ borderColor: `${theme.primary}55`, background: "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(0,0,0,0.94) 48%, rgba(0,0,0,1))", boxShadow: `inset 4px 0 0 ${theme.primary}, 0 18px 50px rgba(0,0,0,0.45)` }}>
              <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/45 sm:text-xs sm:tracking-[0.28em]">Watch &amp; Listen</p>
              <h2 className="mt-1.5 text-lg font-black text-white sm:mt-2 sm:text-2xl">Follow {school.name} on game night</h2>
              <p className="mt-2 max-w-3xl text-xs leading-5 text-white/50 sm:text-sm sm:leading-6">Official and local broadcast destinations for {school.name} football. Game-specific options also appear on matchup cards when available.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2 sm:gap-3">
                {broadcastLinks.map((link) => (
                  <a key={`${link.type}:${link.url}`} href={link.url} target="_blank" rel="noreferrer" className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/35 px-3 py-3 transition hover:border-white/20 hover:bg-white/[0.07] sm:px-4 sm:py-4">
                    <div className="min-w-0">
                      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/35">{link.type === "radio" ? "Listen" : "Watch"}{link.scope === "home" ? " · Home games" : " · All games"}</p>
                      <p className="mt-1 truncate text-sm font-black text-white sm:text-base">{link.label}</p>
                    </div>
                    <span className="shrink-0 text-xs font-black text-white/40 transition group-hover:text-white">↗</span>
                  </a>
                ))}
              </div>
            </section>
          )}
          <StandingsTable standings={standings} theme={theme} currentSchoolSlug={school.slug} districtHref={`/districts/${districtSlug}`} />
          <SchoolCoverage schoolSlug={school.slug} />
        </div>

        <div className="mt-5 grid min-w-0 gap-4 sm:mt-6 sm:gap-5 lg:grid-cols-2">
          <section className="rounded-[1.35rem] border p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-6" style={{ borderColor: `${theme.primary}55`, background: "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(0,0,0,0.94 48%, rgba(0,0,0,1))", boxShadow: `inset 4px 0 0 ${theme.primary}, 0 18px 50px rgba(0,0,0,0.45)` }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0"><p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/45 sm:text-xs sm:tracking-[0.28em]">Program Snapshot</p><h2 className="mt-1.5 text-lg font-black text-white sm:mt-2 sm:text-2xl">{school.fullName}</h2></div>
              {hasOfficialLinks && <span className="shrink-0 text-[8px] font-black uppercase tracking-[0.1em] text-white/30 sm:text-[9px] sm:tracking-[0.12em]">Official</span>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-1.5 sm:mt-4 sm:gap-3">
              {school.headCoach && <SnapshotTile label="Head Coach" value={school.headCoach} />}
              <SnapshotTile label="Region" value={`Region ${school.uilRegion}`} />
              <SnapshotTile label="District" value={district?.name ?? "TBD"} />
              {school.stadium && <SnapshotTile label="Stadium" value={school.stadium} />}
              {school.stadiumCapacity && <SnapshotTile label="Capacity" value={school.stadiumCapacity.toLocaleString()} />}
              {school.stateTitles !== undefined && <SnapshotTile label="State Titles" value={school.stateTitles.toString()} />}
            </div>
            {hasOfficialLinks && <div className="mt-4 flex flex-wrap gap-1.5 sm:mt-5 sm:gap-2">{school.officialWebsite && <a href={school.officialWebsite} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white/60 transition hover:bg-white/10 hover:text-white sm:rounded-xl sm:px-3 sm:py-2 sm:text-[10px] sm:tracking-[0.12em]">School Website</a>}{school.facebookUrl && <a href={school.facebookUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white/60 transition hover:bg-white/10 hover:text-white sm:rounded-xl sm:px-3 sm:py-2 sm:text-[10px] sm:tracking-[0.12em]">Facebook</a>}{school.instagramUrl && <a href={school.instagramUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white/60 transition hover:bg-white/10 hover:text-white sm:rounded-xl sm:px-3 sm:py-2 sm:text-[10px] sm:tracking-[0.12em]">Instagram</a>}{school.xUrl && <a href={school.xUrl} target="_blank" rel="noreferrer" className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] text-white/60 transition hover:bg-white/10 hover:text-white sm:rounded-xl sm:px-3 sm:py-2 sm:text-[10px] sm:tracking-[0.12em]">X / Twitter</a>}</div>}
          </section>
          <RivalryWatch schoolSlug={school.slug} />
        </div>

        <section className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:mt-6 sm:rounded-[1.75rem] sm:p-6">
          <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/45 sm:text-xs sm:tracking-[0.28em]">Help Build the Hub</p>
          <h2 className="mt-1.5 text-lg font-black text-white sm:mt-2 sm:text-2xl">Know something we should add or correct?</h2>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-white/55 sm:mt-3 sm:text-sm sm:leading-6">VarsityVue grows through verified schedules, results, rosters, stats, historical information, and local knowledge. Send us a correction, source, or program update and we&apos;ll review it.</p>
          <Link href="/submit" className="mt-4 inline-flex rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/75 transition hover:bg-white/15 hover:text-white sm:mt-5 sm:rounded-xl sm:px-5 sm:py-3 sm:text-xs sm:tracking-[0.16em]">Submit an Update →</Link>
        </section>
      </div>
    </main>
  );
}

function SnapshotTile({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0 rounded-lg border border-white/10 bg-black/35 p-2.5 sm:rounded-2xl sm:p-4"><p className="text-[7px] font-black uppercase tracking-[0.12em] text-white/35 sm:text-[9px] sm:tracking-[0.16em]">{label}</p><p className="mt-1 break-words text-[11px] font-black leading-4 text-white sm:mt-1.5 sm:text-sm">{value}</p></div>;
}
