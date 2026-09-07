import type { Metadata } from "next";
import Link from "next/link";
import { getFeaturedSchools } from "@/lib/schools";

export const metadata: Metadata = {
  title: "Texas High School Football History & Program Archives",
  description:
    "Explore verified program history for VarsityVue featured schools, including state championships, recent playoff appearances, stadiums, and community-submitted archives.",
  alternates: {
    canonical: "/legacy",
  },
};

const featuredSchools = getFeaturedSchools().slice(0, 8);
const titlePrograms = featuredSchools.filter((school) => (school.stateTitles ?? 0) > 0);
const recentPlayoffPrograms = featuredSchools.filter((school) => school.lastPlayoffAppearance);

export default function LegacyPage() {
  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.55),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 md:p-10">
          <h1 className="max-w-5xl text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            Every program has a story worth preserving.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
            Legacy brings verified program history into one place — championships,
            recent playoff appearances, home stadiums, and the records communities
            help preserve over time.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="#program-archive"
              className="rounded-full bg-[var(--vv-primary)] px-7 py-4 text-center font-black transition hover:bg-[var(--vv-primary-hover)]"
            >
              Explore Program History
            </Link>

            <Link
              href="/submit"
              className="rounded-full border border-[color:var(--vv-accent)] bg-[var(--vv-primary)]/20 px-7 py-4 text-center font-black transition hover:bg-[var(--vv-primary)]/35"
            >
              Submit Program History
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <LegacyStat value={String(featuredSchools.length)} label="Featured programs" />
          <LegacyStat value={String(titlePrograms.length)} label="Programs with verified state titles" />
          <LegacyStat value={String(recentPlayoffPrograms.length)} label="Programs with playoff history on file" />
        </section>

        <section id="program-archive" className="mt-10">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
              Program Archive
            </p>
            <h2 className="mt-3 text-4xl font-black md:text-5xl">
              Verified history from featured programs
            </h2>
            <p className="mt-4 leading-7 text-white/60">
              These snapshots only display historical details already verified in
              VarsityVue&apos;s school records. Additional seasons and records can be
              added as reliable source material becomes available.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredSchools.map((school) => (
              <Link
                key={school.id}
                href={`/schools/${school.slug}`}
                className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-[color:var(--vv-accent)]/40 hover:bg-white/[0.08]"
              >
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
                  {school.classification.conference} {school.classification.division ?? ""}
                </p>
                <h3 className="mt-2 text-2xl font-black group-hover:text-[var(--vv-accent)]">
                  {school.name} {school.mascot}
                </h3>

                <div className="mt-6 space-y-4 border-t border-white/10 pt-5">
                  <ArchiveRow
                    label="State titles"
                    value={school.stateTitles !== undefined ? String(school.stateTitles) : "Not yet verified"}
                  />
                  <ArchiveRow
                    label="Last playoff appearance"
                    value={school.lastPlayoffAppearance ? String(school.lastPlayoffAppearance) : "Not yet verified"}
                  />
                  <ArchiveRow label="Home field" value={school.stadium || "Not yet verified"} />
                </div>

                <p className="mt-6 text-sm font-black text-[var(--vv-accent)]">
                  View program hub →
                </p>
              </Link>
            ))}
          </div>
        </section>

        {titlePrograms.length > 0 && (
          <section className="mt-10 rounded-3xl border border-[color:var(--vv-accent)]/30 bg-[var(--vv-primary)]/10 p-6 md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
              Championship Programs
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">
              State championship history already on file
            </h2>
            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {titlePrograms.map((school) => (
                <Link
                  key={school.id}
                  href={`/schools/${school.slug}`}
                  className="rounded-2xl border border-white/10 bg-black/30 p-5 transition hover:border-[color:var(--vv-accent)]/40"
                >
                  <p className="text-2xl font-black">{school.fullName}</p>
                  <p className="mt-2 text-sm font-bold text-white/55">
                    {school.stateTitles} verified state {school.stateTitles === 1 ? "championship" : "championships"} on file
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
              Friday Night Memories
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-4xl">
              The next layer of Legacy comes from the communities that lived it.
            </h2>
            <p className="mt-4 max-w-3xl leading-7 text-white/65">
              Old stat sheets, newspaper clippings, schedules, playoff records,
              photographs, rivalry results, and championship material can help fill
              gaps that never made it into a modern database. Submissions are reviewed
              before historical claims are added to VarsityVue.
            </p>
            <Link
              href="/submit"
              className="mt-6 inline-flex rounded-full bg-[var(--vv-primary)] px-7 py-4 font-black transition hover:bg-[var(--vv-primary-hover)]"
            >
              Submit History or Records
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/30 p-6 md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-white/40">
              Archive Standard
            </p>
            <h2 className="mt-3 text-2xl font-black">Verified before permanent.</h2>
            <p className="mt-4 leading-7 text-white/60">
              Legacy is intentionally conservative. A missing record is better than an
              invented one. Historical details stay off the archive until VarsityVue
              has enough source material to present them responsibly.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function LegacyStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-4xl font-black">{value}</p>
      <p className="mt-2 text-sm font-bold text-white/50">{label}</p>
    </div>
  );
}

function ArchiveRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">{label}</p>
      <p className="mt-1 text-sm font-bold text-white/80">{value}</p>
    </div>
  );
}
