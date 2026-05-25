import type { Metadata } from "next";
import Link from "next/link";

import { districts } from "../../data/districts";

export const metadata: Metadata = {
  title: "Texas High School Football District Directory | VarsityVue",
  description:
    "Browse VarsityVue district hubs for standings, schedules, school hubs, district matchups, and Texas high school football coverage.",
};

export default function DistrictsPage() {
  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.62),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[var(--vv-accent)]">
              VarsityVue District Directory
            </p>

            <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
                  District Directory
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-7 text-white/60 sm:text-lg">
                  Explore district standings, school ecosystems, schedules,
                  matchups, and sponsor-supported football coverage.
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
            <StatCard label="Coverage Region" value="Texas" />
            <StatCard label="Focus" value="Football" />
            <StatCard label="Expansion" value="Growing" />
          </section>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1440px] gap-5 md:grid-cols-2 xl:grid-cols-3">
          {districts.map((district) => (
            <Link
              key={district.slug}
              href={`/districts/${district.slug}`}
              className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-6 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-[color:var(--vv-accent)] hover:bg-white/[0.075]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(139,16,32,0.4),transparent_55%)] opacity-40 transition group-hover:opacity-70" />

              <div className="relative">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--vv-accent)]">
                  District Hub
                </p>

                <h2 className="mt-4 text-3xl font-black leading-tight text-white">
                  {district.name}
                </h2>

                <p className="mt-3 text-sm font-bold uppercase tracking-[0.14em] text-white/45">
                  {district.classification.conference}
                  {district.classification.division
                    ? ` ${district.classification.division}`
                    : ""}{" "}
                  • Region {district.uilRegion}
                </p>

                <p className="mt-6 text-sm font-black uppercase tracking-[0.14em] text-[var(--vv-accent)]">
                  View district hub →
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black text-white">{value}</p>
    </div>
  );
}