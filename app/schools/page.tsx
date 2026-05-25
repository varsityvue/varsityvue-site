import type { Metadata } from "next";
import Link from "next/link";

import { schools } from "../../data/schools";
import SchoolDirectory from "../../components/SchoolDirectory";

export const metadata: Metadata = {
  title: "Texas High School Sports School Directory | VarsityVue",
  description:
    "Search VarsityVue school hubs for Texas high school sports schedules, scores, standings, coverage, sponsors, districts, and game-day information.",
};

export default function SchoolsPage() {
  const pilotSchools = schools.filter((school) => school.status === "pilot");
  const watchlistSchools = schools.filter(
    (school) => school.status === "watchlist"
  );

  const districts = new Set(schools.map((school) => school.districtId));
  const classifications = new Set(
    schools.map(
      (school) =>
        `${school.classification.conference}${school.classification.division
          ? ` ${school.classification.division}`
          : ""
        }`
    )
  );

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.62),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
              VarsityVue Directory
            </p>

            <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 className="text-5xl font-black leading-tight tracking-tight sm:text-7xl">
                  School Directory
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-7 text-white/60 sm:text-lg">
                  Search Texas high school football hubs by school, mascot,
                  district, classification, status, or game-day venue.
                </p>
              </div>

              <Link
                href="/sponsor-inquiry"
                className="rounded-xl border border-[color:var(--vv-accent)]/30 bg-[var(--vv-primary)]/25 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-[var(--vv-accent-soft)] transition hover:bg-[var(--vv-primary)]/40 hover:text-white"
              >
                Request Coverage
              </Link>
            </div>
          </div>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DirectoryStat label="Schools" value={schools.length.toString()} />
            <DirectoryStat
              label="Pilot Hubs"
              value={pilotSchools.length.toString()}
            />
            <DirectoryStat
              label="Districts"
              value={districts.size.toString()}
            />
            <DirectoryStat
              label="Classes"
              value={classifications.size.toString()}
            />
          </section>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
                School Hubs
              </p>

              <h2 className="mt-2 text-3xl font-black text-white">
                Browse Coverage
              </h2>
            </div>

            <p className="text-sm font-bold text-white/45">
              {pilotSchools.length} pilot · {watchlistSchools.length} watchlist
            </p>
          </div>

          <SchoolDirectory schools={schools} />
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