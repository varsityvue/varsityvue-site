import type { Metadata } from "next";
import Link from "next/link";

import { schools } from "../../data/schools";
import SchoolDirectory from "../../components/SchoolDirectory";

export const metadata: Metadata = {
  title: "Texas High School Football School Directory",
  description:
    "Search live VarsityVue school hubs for Texas high school football schedules, scores, standings, districts, and game-day information.",
  alternates: {
    canonical: "/schools",
  },
};

export default function SchoolsPage() {
  const liveSchools = schools.filter((school) => school.status === "pilot");
  const districts = new Set(liveSchools.map((school) => school.districtId));
  const classifications = new Set(
    liveSchools.map(
      (school) =>
        `${school.classification.conference}${school.classification.division
          ? ` ${school.classification.division}`
          : ""
        }`
    )
  );

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_30%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
              VarsityVue School Directory
            </p>

            <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-7xl">
                  Find your school.
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-7 text-white/60 sm:text-lg">
                  Browse live Texas high school football hubs by school, mascot,
                  district, classification, or game-day venue.
                </p>
              </div>

              <Link
                href="/school-request"
                className="rounded-xl border border-[color:var(--vv-accent)] bg-[var(--vv-primary)] px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-[var(--vv-accent-soft)] transition hover:bg-[var(--vv-primary-hover)] hover:text-white"
              >
                Don&apos;t See Your School?
              </Link>
            </div>
          </div>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DirectoryStat label="Live School Hubs" value={liveSchools.length.toString()} />
            <DirectoryStat label="Districts" value={districts.size.toString()} />
            <DirectoryStat
              label="Classifications"
              value={classifications.size.toString()}
            />
            <DirectoryStat label="Season" value="2026" />
          </section>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
                Live School Hubs
              </p>

              <h2 className="mt-2 text-3xl font-black text-white">
                Browse programs
              </h2>
            </div>

            <p className="max-w-xl text-sm font-bold leading-6 text-white/45 sm:text-right">
              VarsityVue is publishing verified football hubs in stages. If your school is not live yet, send a request and we&apos;ll use that interest to help prioritize future coverage.
            </p>
          </div>

          <SchoolDirectory schools={liveSchools} />
        </div>
      </section>
    </main>
  );
}

function DirectoryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
        {label}
      </p>

      <p className="mt-3 text-4xl font-black text-white">{value}</p>
    </div>
  );
}