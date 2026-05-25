import type { Metadata } from "next";
import Link from "next/link";
import { getPilotSchools } from "@/lib/schools";

export const metadata: Metadata = {
  title: "VarsityVue Legacy | Texas High School Sports History",
  description:
    "VarsityVue Legacy is building historical school archives with records, rivalry history, playoff runs, district titles, notable teams, and community-submitted Texas high school sports history.",
};

const legacyFeatures = [
  "Playoff history and postseason runs",
  "Rivalry records and series history",
  "District championships and title runs",
  "State appearances and milestone seasons",
  "Community-submitted history with review",
  "Historical archives inside school hubs",
];

const pilotSchools = getPilotSchools().slice(0, 8);

export default function LegacyPage() {
  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.55),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
            VarsityVue Legacy
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            Every program has a story. VarsityVue is building the archive.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
            Legacy will preserve playoff runs, rivalry history, district titles,
            unforgettable teams, and community-submitted football history for
            select pilot schools.
          </p>

          <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--vv-accent)]">
              Friday Night Memories
            </p>

            <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">
              Because Friday night memories deserve more than a forgotten post.
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
              Legacy is built for former players, proud parents, alumni, and
              communities who still remember district title runs, bitter rivalry
              losses, miracle finishes, and seasons people still talk about.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/schools"
              className="rounded-full bg-[var(--vv-primary)] px-7 py-4 text-center font-black transition hover:bg-[var(--vv-primary-hover)]"
            >
              Explore Pilot Programs
            </Link>

            <Link
              href="/sponsor-inquiry"
              className="rounded-full border border-white/20 bg-white/5 px-7 py-4 text-center font-black transition hover:bg-white/10"
            >
              Become Founding Legacy Sponsor
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {legacyFeatures.map((feature) => (
            <div
              key={feature}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:border-[color:var(--vv-accent)]/30 hover:bg-white/10"
            >
              <p className="text-lg font-black">{feature}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-[color:var(--vv-primary)] bg-[var(--vv-primary)]/10 p-6 md:p-10">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
                Founding Opportunity
              </p>

              <h2 className="mt-3 text-4xl font-black">
                Own the historical conversation.
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-white/65">
                Legacy creates emotionally sticky sponsor inventory tied to
                school pride, nostalgia, and repeat community engagement.
              </p>
            </div>

            <Link
              href="/sponsor-inquiry"
              className="rounded-full bg-white px-7 py-4 text-center font-black text-black transition hover:bg-white/85"
            >
              Sponsor Legacy
            </Link>
          </div>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
            Pilot Archive Targets
          </p>

          <h2 className="mt-3 text-4xl font-black">
            Select schools will receive deeper historical pages first.
          </h2>

          <p className="mt-4 max-w-3xl leading-7 text-white/60">
            Pilot archive pages will eventually include rivalry records, playoff
            timelines, milestone seasons, notable alumni moments, and
            community-submitted historical preservation.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {pilotSchools.map((school) => (
              <Link
                key={school.id}
                href={`/schools/${school.slug}`}
                className="rounded-full border border-white/10 bg-black/40 px-5 py-3 text-sm font-black transition hover:border-[color:var(--vv-accent)] hover:bg-white/10"
              >
                {school.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}