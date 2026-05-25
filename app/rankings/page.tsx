import type { Metadata } from "next";
import Link from "next/link";
import { getFootballRankings } from "@/lib/rankings";
import { getSchoolById } from "@/lib/schools";

export const metadata: Metadata = {
  title: "Texas High School Football Rankings | VarsityVue",
  description:
    "VarsityVue football rankings for Texas high school sports, featuring regional teams, records, classifications, notes, and sponsor-ready weekly rankings coverage.",
};

const methodology = [
  "On-field performance",
  "Strength of schedule",
  "Head-to-head results",
  "Recent momentum",
  "Editorial review",
];

export default function RankingsPage() {
  const rankings = getFootballRankings();

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.45),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
            VarsityVue Rankings
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            Texas high school football rankings built for weekly debate.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
            A regional rankings hub for fans, schools, sponsors, and communities
            following Texas high school football.
          </p>
        </section>

        <section className="mt-10 rounded-3xl border border-[color:var(--vv-primary)]/30 bg-[var(--vv-primary)]/10 p-6 md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
                Sponsor Slot
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Rankings sponsorship available
              </h2>

              <p className="mt-3 max-w-2xl leading-7 text-white/65">
                Put your brand beside one of the most repeatable weekly traffic
                assets in the VarsityVue ecosystem.
              </p>
            </div>

            <Link
              href="/sponsor-inquiry"
              className="rounded-full bg-white px-7 py-4 text-center font-black text-black transition hover:bg-white/85"
            >
              Sponsor Rankings
            </Link>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
                Football
              </p>

              <h2 className="mt-3 text-4xl font-black">
                Regional Top Teams
              </h2>
            </div>

            <p className="max-w-xl text-sm leading-6 text-white/50">
              MVP rankings are human-reviewed editorial rankings seeded for the
              pilot platform. Real weekly movement can be layered in once score,
              standings, and coverage data mature.
            </p>
          </div>

          <div className="space-y-4">
            {rankings.map((entry) => {
              const school = getSchoolById(entry.schoolId);

              if (!school) return null;

              return (
                <Link
                  key={entry.id}
                  href={`/schools/${school.slug}`}
                  className="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:-translate-y-1 hover:border-[color:var(--vv-primary)]/60 hover:bg-white/10 md:grid-cols-[80px_1fr_auto]"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--vv-primary)] text-2xl font-black">
                    {entry.rank}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-2xl font-black">
                        {school.fullName}
                      </h3>

                      {entry.previousRank === null && (
                        <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/50">
                          New
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-white/60">
                      {entry.note}
                    </p>
                  </div>

                  <div className="flex gap-3 md:flex-col md:items-end md:justify-center">
                    <span className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm font-bold text-white/75">
                      {entry.record}
                    </span>

                    <span className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm font-bold text-white/75">
                      {school.classification.conference}
                      {school.classification.division
                        ? ` ${school.classification.division}`
                        : ""}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-14 grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
              Methodology
            </p>

            <h2 className="mt-4 text-3xl font-black">
              How rankings are evaluated
            </h2>

            <p className="mt-4 leading-7 text-white/60">
              VarsityVue rankings balance results, context, regional knowledge,
              and human review instead of blindly chasing hype.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {methodology.map((item) => (
              <div
                key={item}
                className="rounded-3xl border border-white/10 bg-white/5 p-6"
              >
                <p className="text-lg font-black">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-white/10 bg-white/5 p-6 text-center md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
            Weekly Visibility
          </p>

          <h2 className="mt-4 text-4xl font-black">
            Want your business beside the rankings?
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/65">
            Rankings are built to become a recurring fan habit during football
            season, making them a strong sponsor placement.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/sponsor-inquiry"
              className="rounded-full bg-[var(--vv-primary)] px-8 py-4 font-semibold transition hover:bg-[var(--vv-primary-hover)]"
            >
              Request Sponsor Info
            </Link>

            <Link
              href="/sponsors"
              className="rounded-full border border-white/20 px-8 py-4 font-semibold transition hover:bg-white/10"
            >
              View Sponsor Options
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}