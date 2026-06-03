import type { Metadata } from "next";
import Link from "next/link";

import { districts } from "../../data/districts";
import { schools } from "../../data/schools";

export const metadata: Metadata = {
  title: "Texas High School Football District Directory | VarsityVue",
  description:
    "Browse VarsityVue district hubs by classification for standings, schedules, school hubs, district matchups, and Texas high school football coverage.",
};

const classificationOrder = ["6A", "5A", "4A", "3A", "2A", "1A"];

function getDistrictClassificationLabel(district: (typeof districts)[number]) {
  const division = district.classification.division
    ? ` ${district.classification.division}`
    : "";

  return `${district.classification.conference}${division}`;
}

function getDistrictSchoolCount(districtId: string) {
  return schools.filter((school) => school.districtId === districtId).length;
}

function getGroupedDistricts() {
  return classificationOrder
    .map((classification) => ({
      classification,
      districts: districts
        .filter(
          (district) => district.classification.conference === classification
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((group) => group.districts.length > 0);
}

export default function DistrictsPage() {
  const groupedDistricts = getGroupedDistricts();
  const pilotDistricts = districts.filter(
    (district) => district.status === "pilot"
  );

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.62),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl md:p-8">
            <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-white/70">
              VarsityVue District Directory
            </p>

            <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
                  District Directory
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-7 text-white/60 sm:text-lg">
                  Browse district hubs by classification, then drill into
                  standings, school ecosystems, schedules, matchups, and
                  sponsor-supported football coverage.
                </p>
              </div>

              <Link
                href="/sponsor-inquiry"
                className="rounded-xl border border-[color:var(--vv-accent)] bg-[var(--vv-primary)]/25 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-[var(--vv-accent-soft)] transition hover:bg-[var(--vv-primary)]/40 hover:text-white"
              >
                Sponsor a District
              </Link>
            </div>
          </div>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Districts" value={districts.length.toString()} />
            <StatCard label="Pilot Hubs" value={pilotDistricts.length.toString()} />
            <StatCard label="Schools" value={schools.length.toString()} />
            <StatCard label="Structure" value="1A–6A" />
          </section>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px] space-y-8">
          {groupedDistricts.map((group) => (
            <section
              key={group.classification}
              className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-2xl md:p-6"
            >
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--vv-accent)]">
                    Classification
                  </p>

                  <h2 className="mt-2 text-4xl font-black text-white">
                    {group.classification}
                  </h2>
                </div>

                <p className="text-sm font-bold text-white/45">
                  {group.districts.length} district
                  {group.districts.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {group.districts.map((district) => {
                  const schoolCount = getDistrictSchoolCount(district.id);

                  return (
                    <Link
                      key={district.slug}
                      href={`/districts/${district.slug}`}
                      className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/30 p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-[color:var(--vv-accent)] hover:bg-white/[0.075]"
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,16,32,0.35),transparent_55%)] opacity-40 transition group-hover:opacity-70" />

                      <div className="relative">
                        <div className="flex flex-wrap gap-2">
                          <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/65">
                            District Hub
                          </p>

                          <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/65">
                            {district.status}
                          </p>
                        </div>

                        <h3 className="mt-4 text-3xl font-black leading-tight text-white">
                          {district.name}
                        </h3>

                        <p className="mt-3 text-sm font-bold uppercase tracking-[0.14em] text-white/45">
                          {getDistrictClassificationLabel(district)} • Region{" "}
                          {district.uilRegion}
                        </p>

                        <div className="mt-5 grid grid-cols-2 gap-3">
                          <MiniStat
                            label="Schools"
                            value={schoolCount.toString()}
                          />
                          <MiniStat
                            label="Market"
                            value={district.coverageMarket ?? "TBD"}
                          />
                        </div>

                        <p className="mt-6 text-sm font-black uppercase tracking-[0.14em] text-white/70 transition group-hover:text-white">
                          View district hub →
                        </p>
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
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black text-white">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-white">{value}</p>
    </div>
  );
}