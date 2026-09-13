import type { Metadata } from "next";
import Link from "next/link";

import PageHero from "@/components/PageHero";
import { districts } from "../../data/districts";
import { schools } from "../../data/schools";

export const metadata: Metadata = {
  title: "Texas High School Football District Directory",
  description:
    "Browse VarsityVue district hubs by classification for standings, schedules, school hubs, district matchups, and Texas high school football coverage.",
  alternates: { canonical: "/districts" },
};

const classificationOrder = ["6A", "5A", "4A", "3A", "2A", "1A"];
const featuredDistricts = districts.filter((district) => district.status === "pilot");
const featuredDistrictIds = new Set(featuredDistricts.map((district) => district.id));
const featuredSchools = schools.filter(
  (school) => school.status === "pilot" && featuredDistrictIds.has(school.districtId)
);

function getDistrictClassificationLabel(district: (typeof districts)[number]) {
  const division = district.classification.division ? ` ${district.classification.division}` : "";
  return `${district.classification.conference}${division}`;
}

function getDistrictSchoolCount(districtId: string) {
  return featuredSchools.filter((school) => school.districtId === districtId).length;
}

function getGroupedDistricts() {
  return classificationOrder
    .map((classification) => ({
      classification,
      districts: featuredDistricts
        .filter((district) => district.classification.conference === classification)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((group) => group.districts.length > 0);
}

export default function DistrictsPage() {
  const groupedDistricts = getGroupedDistricts();
  const representedClassifications = groupedDistricts.length;

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <PageHero
        eyebrow="VarsityVue District Directory"
        title="Find your district."
        description="Browse featured Texas high school football district hubs by classification, then open a district for member schools, schedules, standings, matchups, and coverage currently available on VarsityVue."
        footer={
          <section className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4">
            <StatCard label="Featured Districts" value={featuredDistricts.length.toString()} />
            <StatCard label="Featured Programs" value={featuredSchools.length.toString()} />
            <StatCard label="Classifications" value={representedClassifications.toString()} />
            <StatCard label="Season" value="2026" />
          </section>
        }
      />

      <section className="px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-[1440px] space-y-4 sm:space-y-8">
          <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.035] p-4 text-xs leading-5 text-white/50 sm:rounded-[1.5rem] sm:p-5 sm:text-sm sm:leading-6">
            VarsityVue publishes district hubs as schedules, results, standings, and school information are verified. Additional districts will appear here as they become ready for public coverage.
          </div>

          {groupedDistricts.map((group) => (
            <section key={group.classification} className="rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-3.5 shadow-2xl sm:rounded-[2rem] sm:p-5 md:p-6">
              <div className="mb-3 flex items-end justify-between gap-3 sm:mb-5">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.24em]">Classification</p>
                  <h2 className="mt-1 text-2xl font-black text-white sm:mt-2 sm:text-4xl">{group.classification}</h2>
                </div>
                <p className="pb-0.5 text-[10px] font-bold text-white/45 sm:text-sm">
                  {group.districts.length} featured district{group.districts.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="grid gap-2.5 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
                {group.districts.map((district) => {
                  const schoolCount = getDistrictSchoolCount(district.id);
                  return (
                    <Link key={district.slug} href={`/districts/${district.slug}`} className="group relative overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/30 p-4 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-[color:var(--vv-accent)] hover:bg-white/[0.075] sm:rounded-[1.75rem] sm:p-6">
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,16,32,0.35),transparent_55%)] opacity-40 transition group-hover:opacity-70" />
                      <div className="relative">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white/65 sm:px-3 sm:text-[10px] sm:tracking-[0.16em]">District Hub</p>
                          <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white/65 sm:px-3 sm:text-[10px] sm:tracking-[0.16em]">Region {district.uilRegion}</p>
                        </div>
                        <h3 className="mt-3 text-2xl font-black leading-tight text-white sm:mt-4 sm:text-3xl">{district.name}</h3>
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/45 sm:mt-3 sm:text-sm sm:tracking-[0.14em]">{getDistrictClassificationLabel(district)}</p>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3">
                          <MiniStat label="Featured Programs" value={schoolCount.toString()} />
                          <MiniStat label="Region" value={`Region ${district.uilRegion}`} />
                        </div>
                        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.12em] text-white/70 transition group-hover:text-white sm:mt-6 sm:text-sm sm:tracking-[0.14em]">Open district hub →</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-white/[0.045] p-3 shadow-xl sm:rounded-[1.5rem] sm:p-5">
      <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/40 sm:text-xs sm:tracking-[0.22em]">{label}</p>
      <p className="mt-1.5 text-2xl font-black text-white sm:mt-3 sm:text-4xl">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/35 p-2.5 sm:rounded-2xl sm:p-4">
      <p className="text-[8px] font-black uppercase tracking-[0.14em] text-white/35 sm:text-[10px] sm:tracking-[0.18em]">{label}</p>
      <p className="mt-1 text-xs font-black text-white sm:mt-2 sm:text-sm">{value}</p>
    </div>
  );
}
