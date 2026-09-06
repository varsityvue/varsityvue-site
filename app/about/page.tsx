import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about VarsityVue, a growing home for Texas high school football scores, schedules, standings, school hubs, verified statistics, and local coverage.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">About VarsityVue</p>
        <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">
          A digital home for Texas high school football.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
          VarsityVue brings scores, schedules, district standings, school hubs, matchup pages, verified statistics, legacy information, and local coverage together in one place built around Texas high school football communities.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-7">
            <h2 className="text-2xl font-black">What we&apos;re building</h2>
            <p className="mt-4 leading-7 text-white/60">
              The goal is a useful, easy-to-navigate resource where fans can follow a program from its school hub to its schedule, district, games, statistics, and stories without piecing information together across multiple places.
            </p>
          </section>
          <section className="rounded-3xl border border-white/10 bg-white/5 p-7">
            <h2 className="text-2xl font-black">Coverage that grows with the data</h2>
            <p className="mt-4 leading-7 text-white/60">
              VarsityVue is expanding program by program. Featured programs have deeper coverage today, while additional schools, verified results, statistics, and historical information are added as reliable data becomes available.
            </p>
          </section>
        </div>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-7 md:p-9">
          <h2 className="text-2xl font-black">Help make the platform better</h2>
          <p className="mt-4 max-w-3xl leading-7 text-white/60">
            Know a school that should be added, have information that needs correcting, or want to get in touch? VarsityVue welcomes useful local input as coverage expands.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/school-request" className="rounded-full bg-[var(--vv-primary)] px-6 py-3 text-sm font-bold transition hover:bg-[#93142a]">Request a School</Link>
            <Link href="/contact" className="rounded-full border border-white/15 px-6 py-3 text-sm font-bold text-white/80 transition hover:border-white/30 hover:text-white">Contact VarsityVue</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
