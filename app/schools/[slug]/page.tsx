import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { SchoolTheme } from "../../../types/school-theme";
import { getSchoolBySlug } from "@/lib/schools";
import { getRecentScoresForSchool } from "@/lib/games";
import { getDistrictById } from "@/lib/districts";
import { getStandingsForSchool } from "@/lib/standings";
import { getArticlesForSchool } from "@/lib/articles";
import SchoolHero from "../../../components/SchoolHero";
import UpcomingSchedulePreview from "../../../components/UpcomingSchedulePreview";
import RecentScores from "../../../components/RecentScores";
import StandingsTable from "../../../components/StandingsTable";
import NewsFeed from "../../../components/NewsFeed";
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
    alternates: {
      canonical: `/schools/${school.slug}`,
    },
  };
}

export default async function SchoolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);
  if (!school) notFound();

  const district = getDistrictById(school.districtId);
  const districtSlug = district?.slug ?? school.districtId;
  const theme: SchoolTheme = {
    primary: school.colors.primary,
    secondary: school.colors.secondary,
    accent: school.colors.accent,
  };
  const recentScores = getRecentScoresForSchool(slug);
  const standings = getStandingsForSchool(slug);
  const articles = getArticlesForSchool(slug);
  const schoolStanding = standings.find((standing) => standing.schoolSlug === school.slug);
  const districtPlayStarted = standings.some(
    (standing) => standing.districtWins > 0 || standing.districtLosses > 0
  );

  const schoolSchema = {
    "@context": "https://schema.org",
    "@type": "SportsTeam",
    name: school.fullName,
    alternateName: school.name,
    sport: "Football",
    url: `https://varsityvue.com/schools/${school.slug}`,
    location: {
      "@type": "Place",
      name: school.stadium ?? `${school.name} football stadium`,
    },
    memberOf: district
      ? {
          "@type": "SportsOrganization",
          name: district.name,
          url: `https://varsityvue.com/districts/${district.slug}`,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "VarsityVue",
      url: "https://varsityvue.com",
    },
  };

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schoolSchema) }}
      />
      <SchoolHero school={school} />
      <SchoolSubnav
        schoolSlug={school.slug}
        districtSlug={districtSlug}
        theme={theme}
      />

      <div className="mx-auto w-full max-w-6xl px-4 pt-5 sm:px-6 sm:pt-6 lg:px-8">
        <SchoolSeasonPulse schoolSlug={school.slug} theme={theme} />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-[1.45fr_0.75fr] lg:px-8">
        <div className="min-w-0 space-y-5 sm:space-y-6">
          {recentScores.length > 0 && (
            <RecentScores scores={recentScores} theme={theme} schoolSlug={slug} />
          )}
          <SchoolTeamLeaders
            schoolSlug={school.slug}
            season={2026}
            primaryColor={theme.primary}
            secondaryColor={theme.secondary}
          />
          <UpcomingSchedulePreview schoolSlug={school.slug} />
          <StandingsTable standings={standings} theme={theme} />
          <SchoolCoverage schoolSlug={school.slug} />
          <NewsFeed articles={articles} theme={theme} />
        </div>

        <aside className="min-w-0 space-y-6">
          <section
            className="rounded-[1.75rem] border p-6 shadow-2xl"
            style={{
              borderColor: `${theme.primary}55`,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(0,0,0,0.94) 48%, rgba(0,0,0,1))",
              boxShadow: `inset 4px 0 0 ${theme.primary}, 0 18px 50px rgba(0,0,0,0.45)`,
            }}
          >
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/50">
              Program Profile
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">{school.fullName}</h2>
            <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/35 p-4">
              {school.headCoach && <ProfileRow label="Head Coach" value={school.headCoach} />}
              {school.athleticDirector && school.athleticDirector !== school.headCoach && (
                <ProfileRow label="Athletic Director" value={school.athleticDirector} />
              )}
              <ProfileRow label="Region" value={`Region ${school.uilRegion}`} />
              {school.stadiumCapacity && (
                <ProfileRow
                  label="Stadium Capacity"
                  value={school.stadiumCapacity.toLocaleString()}
                />
              )}
              {school.stateTitles !== undefined && (
                <ProfileRow label="State Titles" value={school.stateTitles.toString()} />
              )}
              {school.lastPlayoffAppearance && (
                <ProfileRow
                  label="Last Playoff Appearance"
                  value={school.lastPlayoffAppearance.toString()}
                />
              )}
              <ProfileRow
                label="District Record"
                value={
                  districtPlayStarted && schoolStanding
                    ? `${schoolStanding.districtWins}-${schoolStanding.districtLosses}`
                    : "—"
                }
              />
              <ProfileRow
                label="Overall Record"
                value={
                  schoolStanding
                    ? `${schoolStanding.overallWins}-${schoolStanding.overallLosses}`
                    : "Not yet available"
                }
              />
            </div>
          </section>

          {school.description && (
            <section
              className="rounded-[1.75rem] border p-6 shadow-2xl"
              style={{
                borderColor: `${theme.primary}55`,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(0,0,0,0.94) 48%, rgba(0,0,0,1))",
                boxShadow: `inset 4px 0 0 ${theme.primary}, 0 18px 50px rgba(0,0,0,0.45)`,
              }}
            >
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/50">
                About the Program
              </p>
              <p className="mt-4 text-sm leading-7 text-white/65">{school.description}</p>
            </section>
          )}

          <RivalryWatch schoolSlug={school.slug} />

          {(school.officialWebsite ||
            school.facebookUrl ||
            school.instagramUrl ||
            school.xUrl) && (
            <section
              className="rounded-[1.75rem] border p-6 shadow-2xl"
              style={{
                borderColor: `${theme.primary}55`,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(0,0,0,0.94) 50%, rgba(0,0,0,1))",
                boxShadow: `inset 4px 0 0 ${theme.primary}, 0 18px 50px rgba(0,0,0,0.45)`,
              }}
            >
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/50">
                Official Links
              </p>
              <h2 className="mt-3 text-2xl font-black text-white">School resources.</h2>
              <div className="mt-5 flex flex-col gap-3">
                {school.officialWebsite && (
                  <ExternalLinkButton href={school.officialWebsite} label="Official Website" />
                )}
                {school.facebookUrl && (
                  <ExternalLinkButton href={school.facebookUrl} label="Facebook" />
                )}
                {school.instagramUrl && (
                  <ExternalLinkButton href={school.instagramUrl} label="Instagram" />
                )}
                {school.xUrl && <ExternalLinkButton href={school.xUrl} label="X / Twitter" />}
              </div>
            </section>
          )}

          <section
            className="rounded-[1.75rem] border p-6 shadow-2xl"
            style={{
              borderColor: `${theme.secondary}66`,
              background: `linear-gradient(135deg, ${theme.primary}55, ${theme.secondary}22 52%, rgba(0,0,0,0.96) 82%)`,
              boxShadow: `inset 4px 0 0 ${theme.secondary}, 0 18px 50px rgba(0,0,0,0.45)`,
            }}
          >
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/55">
              Community Input
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">Know something we should add?</h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Fans, coaches, alumni, and community members can submit stats, photos, videos, records, corrections, and program history for review.
            </p>
            <Link
              href="/submit"
              className="mt-5 inline-flex rounded-full px-5 py-3 text-sm font-black transition hover:opacity-90"
              style={{ backgroundColor: theme.secondary, color: theme.primary }}
            >
              Submit to VarsityVue
            </Link>
          </section>

          <section
            className="rounded-[1.75rem] border p-6 shadow-2xl"
            style={{
              borderColor: `${theme.primary}55`,
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(0,0,0,0.94) 50%, rgba(0,0,0,1))",
              boxShadow: `inset 4px 0 0 ${theme.primary}, 0 18px 50px rgba(0,0,0,0.45)`,
            }}
          >
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/50">
              School Utility
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">Quick links for fans.</h2>
            <div className="mt-5 flex flex-col gap-3">
              <LinkButton href={`/schools/${school.slug}/schedule`} label="Full Schedule" />
              <LinkButton href={`/schools/${school.slug}/roster`} label="Team Roster" />
              <LinkButton href={`/districts/${districtSlug}`} label="Standings" />
              <LinkButton href="/scoreboard" label="Scoreboard" />
              <LinkButton href="/coverage" label="Team Coverage" />
              <LinkButton href="/submit" label="Submit Stats, Photos or History" />
              <LinkButton href="/school-request" label="Request Another School" />
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-white/40">{label}</span>
      <span className="text-right font-black text-white/80">{value}</span>
    </div>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white"
    >
      {label}
    </Link>
  );
}

function ExternalLinkButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white"
    >
      {label} ↗
    </a>
  );
}
