import type { Metadata } from "next";
import Link from "next/link";

const aboutTitle = "About VarsityVue";
const aboutDescription =
  "Learn about VarsityVue, a growing home for Texas high school football scores, schedules, standings, school hubs, verified statistics, and local coverage.";

export const metadata: Metadata = {
  title: "About",
  description: aboutDescription,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `${aboutTitle} | VarsityVue`,
    description: aboutDescription,
    url: "/about",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "VarsityVue Texas high school football scores, stats, school hubs, and local coverage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${aboutTitle} | VarsityVue`,
    description: aboutDescription,
    images: ["/opengraph-image"],
  },
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

        <section className="mt-7 rounded-[1.35rem] border border-white/10 bg-white/5 p-4 sm:mt-10 sm:rounded-3xl sm:p-7 md:p-9 lg:mt-12">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.28em]">Why VarsityVue</p>
          <h2 className="mt-2.5 text-2xl font-black sm:mt-3 sm:text-3xl">The information is out there. The problem is finding all of it.</h2>
          <div className="mt-3 max-w-4xl space-y-3 text-sm leading-6 text-white/60 sm:mt-4 sm:space-y-4 sm:text-base sm:leading-7">
            <p>
              Texas high school football information is spread across school websites, social media, score apps, stat platforms, broadcasts, and local news. VarsityVue is being built to connect those pieces around the programs and communities they belong to.
            </p>
            <p>
              Follow a school from Friday night&apos;s matchup to its schedule, district race, player statistics, stories, and history without starting over on a different platform every time.
            </p>
          </div>
        </section>

        <section className="mt-3 rounded-[1.35rem] border border-white/10 bg-black/30 p-4 sm:mt-5 sm:rounded-3xl sm:p-7 md:p-9">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/40 sm:text-xs sm:tracking-[0.28em]">How we&apos;re building it</p>
          <h2 className="mt-2.5 text-xl font-black sm:mt-3 sm:text-2xl">Program by program. Verified before published.</h2>
          <p className="mt-3 max-w-4xl text-sm leading-6 text-white/60 sm:mt-4 sm:text-base sm:leading-7">
            VarsityVue grows as reliable schedules, results, rosters, statistics, and historical records become available. When information can&apos;t be verified, we&apos;d rather leave a gap than fill it with a guess.
          </p>
        </section>

        <section className="mt-3 rounded-[1.35rem] border border-white/10 bg-white/5 p-4 sm:mt-5 sm:rounded-3xl sm:p-7 md:p-9">
          <h2 className="text-xl font-black sm:text-2xl">Help build the coverage</h2>
          <p className="mt-2.5 max-w-3xl text-sm leading-6 text-white/60 sm:mt-4 sm:leading-7">
            Know a school that should be added, or have verified stats, records, photos, or program history to share? Local contributions help VarsityVue grow.
          </p>
          <div className="mt-4 grid gap-2 sm:mt-6 sm:flex sm:flex-wrap sm:gap-3">
            <Link href="/school-request" className="rounded-full bg-[var(--vv-primary)] px-5 py-2.5 text-center text-xs font-bold transition hover:bg-[#93142a] sm:px-6 sm:py-3 sm:text-sm">Request a School</Link>
            <Link href="/submit" className="rounded-full border border-[color:var(--vv-accent)]/40 bg-white/5 px-5 py-2.5 text-center text-xs font-bold text-white transition hover:bg-white/10 sm:px-6 sm:py-3 sm:text-sm">Submit to VarsityVue</Link>
          </div>
          <p className="mt-4 text-xs text-white/45 sm:mt-5 sm:text-sm">
            Need something else? <Link href="/contact" className="font-bold text-white/70 underline decoration-white/20 underline-offset-4 transition hover:text-white">Contact VarsityVue.</Link>
          </p>
        </section>
      </div>
    </main>
  );
}