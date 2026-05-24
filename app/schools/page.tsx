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
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.62),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#d65a6d]">
              VarsityVue Directory
            </p>

            <div className="mt-5 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
                  School Directory
                </h1>

                <p className="mt-4 max-w-3xl text-base leading-7 text-white/60 sm:text-lg">
                  Search Texas high school sports hubs by school, mascot,
                  district, classification, status, or game-day venue.
                </p>
              </div>

              <Link
                href="/sponsor-inquiry"
                className="rounded-xl border border-[#d65a6d]/30 bg-[#7A1022]/25 px-6 py-4 text-center text-sm font-black uppercase tracking-[0.16em] text-[#f3a3af] transition hover:bg-[#7A1022]/40 hover:text-white"
              >
                Request Coverage
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <SchoolDirectory schools={schools} />
        </div>
      </section>
    </main>
  );
}