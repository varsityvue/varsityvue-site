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
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-8 text-white sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">About VarsityVue</p>
        <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight sm:mt-4 sm:text-5xl lg:text-6xl">
          A digital home for Texas high school football.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-white/65 sm:mt-6 sm:text-base sm:leading-7 lg:text-lg lg:leading-8">
          VarsityVue brings scores, schedules, district standings, school hubs, matchup pages, verified statistics, legacy information, and local coverage together in one place built around Texas high school football communities.
        </p>

        <div className="mt-7 grid gap-3 sm:mt-10 sm:gap-5 md:grid-cols-2 lg:mt-12 lg:gap-6">
          <section className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4 sm:rounded-3xl sm:p-6 lg:p-7">
            <h2 className="text-xl font-black sm:text-2xl">What we&apos;re building</h2>
            <p className="mt-2.5 text-sm leading-6 text-white/60 sm:mt-4 sm:leading-7">
              The goal is a useful, easy-to-navigate resource where fans can follow a program from its school hub to its schedule, district, games, statistics, and stories without piecing information together across multiple places.
            </p>
          </section>
          <section className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4 sm:rounded-3xl sm:p-6 lg:p-7">
            <h2 className="text-xl font-black sm:text-2xl">Coverage that grows with the data</h2>
            <p className="mt-2.5 text-sm leading-6 text-white/60 sm:mt-4 sm:leading-7">
              VarsityVue is expanding program by program. Featured programs have deeper coverage today, while additional schools, verified results, statistics, and historical information are added as reliable data becomes available.
            </p>
          </section>
        </div>

        <section className="mt-6 rounded-[1.35rem] border border-white/10 bg-white/5 p-4 sm:mt-8 sm:rounded-3xl sm:p-7 md:p-9 lg:mt-10">
          <h2 className="text-xl font-black sm:text-2xl">Help make the platform better</h2>
          <p className="mt-2.5 max-w-3xl text-sm leading-6 text-white/60 sm:mt-4 sm:leading-7">
            Know a school that should be added, have stats or program history to share, found something that needs correcting, or want to get in touch? VarsityVue welcomes useful local input as coverage expands.
          </p>
          <div className="mt-4 grid gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3">
            <Link href="/school-request" className="rounded-full bg-[var(--vv-primary)] px-5 py-2.5 text-center text-xs font-bold transition hover:bg-[#93142a] sm:px-6 sm:py-3 sm:text-sm">Request a School</Link>
            <Link href="/submit" className="rounded-full border border-[color:var(--vv-accent)]/40 bg-white/5 px-5 py-2.5 text-center text-xs font-bold text-white transition hover:bg-white/10 sm:px-6 sm:py-3 sm:text-sm">Submit to VarsityVue</Link>
            <Link href="/contact" className="rounded-full border border-white/15 px-5 py-2.5 text-center text-xs font-bold text-white/80 transition hover:border-white/30 hover:text-white sm:px-6 sm:py-3 sm:text-sm">Contact VarsityVue</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
