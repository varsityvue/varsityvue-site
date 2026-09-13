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
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-8 text-white sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.55),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 sm:rounded-[2rem] sm:p-6 md:p-10">
          <h1 className="max-w-5xl text-[2.15rem] font-black leading-[1.04] sm:text-6xl lg:text-7xl">
            Every program has a story worth preserving.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/65 sm:mt-6 sm:text-lg sm:leading-8">
            Legacy brings verified program history into one place — championships,
            recent playoff appearances, home stadiums, and the records communities
            help preserve over time.
          </p>

          <div className="mt-5 grid gap-2 sm:mt-8 sm:flex sm:flex-wrap sm:gap-3">
            <Link
              href="#program-archive"
              className="rounded-full bg-[var(--vv-primary)] px-5 py-3 text-center text-sm font-black transition hover:bg-[var(--vv-primary-hover)] sm:px-7 sm:py-4 sm:text-base"
            >
              Explore Program History
            </Link>

            <Link
              href="/submit"
              className="rounded-full border border-[color:var(--vv-accent)] bg-[var(--vv-primary)]/20 px-5 py-3 text-center text-sm font-black transition hover:bg-[var(--vv-primary)]/35 sm:px-7 sm:py-4 sm:text-base"
            >
              Submit Program History
            </Link>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-3 gap-2 sm:mt-10 sm:gap-4">
          <LegacyStat value={String(featuredSchools.length)} label="Featured programs" />
          <LegacyStat value={String(titlePrograms.length)} label="Programs with verified state titles" />
          <LegacyStat value={String(recentPlayoffPrograms.length)} label="Programs with playoff history on file" />
        </section>

        <section id="program-archive" className="mt-8 sm:mt-10">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
              Program Archive
            </p>
            <h2 className="mt-2 text-3xl font-black leading-tight sm:mt-3 sm:text-4xl md:text-5xl">
              Verified history from featured programs
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/60 sm:mt-4 sm:text-base sm:leading-7">
              These snapshots only display historical details already verified in
              VarsityVue&apos;s school records. Additional seasons and records can be
              added as reliable source material becomes available.
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:mt-8 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
            {featuredSchools.map((school) => (
              <Link
                key={school.id}
                href={`/schools/${school.slug}`}
                className="group rounded-[1.35rem] border border-white/10 bg-white/5 p-4 transition hover:-translate-y-1 hover:border-[color:var(--vv-accent)]/40 hover:bg-white/[0.08] sm:rounded-3xl sm:p-6"
              >
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40 sm:text-xs sm:tracking-[0.22em]">
                  {school.classification.conference} {school.classification.division ?? ""}
                </p>
                <h3 className="mt-1.5 text-xl font-black leading-tight group-hover:text-[var(--vv-accent)] sm:mt-2 sm:text-2xl">
                  {school.name} {school.mascot}
                </h3>

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 sm:mt-6 sm:block sm:space-y-4 sm:pt-5">
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

                <p className="mt-4 text-xs font-black text-[var(--vv-accent)] sm:mt-6 sm:text-sm">
                  View program hub →
                </p>
              </Link>
            ))}
          </div>
        </section>

        {titlePrograms.length > 0 && (
          <section className="mt-8 rounded-[1.5rem] border border-[color:var(--vv-accent)]/30 bg-[var(--vv-primary)]/10 p-5 sm:mt-10 sm:rounded-3xl sm:p-6 md:p-10">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
              Championship Programs
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight sm:mt-3 sm:text-3xl md:text-4xl">
              State championship history already on file
            </h2>
            <div className="mt-5 grid gap-3 sm:mt-7 sm:gap-4 md:grid-cols-2">
              {titlePrograms.map((school) => (
                <Link
                  key={school.id}
                  href={`/schools/${school.slug}`}
                  className="rounded-[1.1rem] border border-white/10 bg-black/30 p-4 transition hover:border-[color:var(--vv-accent)]/40 sm:rounded-2xl sm:p-5"
                >
                  <p className="text-xl font-black sm:text-2xl">{school.fullName}</p>
                  <p className="mt-1.5 text-xs font-bold leading-5 text-white/55 sm:mt-2 sm:text-sm">
                    {school.stateTitles} verified state {school.stateTitles === 1 ? "championship" : "championships"} on file
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 grid gap-3 sm:mt-10 sm:gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:rounded-3xl sm:p-6 md:p-10">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
              Friday Night Memories
            </p>
            <h2 className="mt-2 text-2xl font-black leading-tight sm:mt-3 sm:text-3xl md:text-4xl">
              The next layer of Legacy comes from the communities that lived it.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65 sm:mt-4 sm:text-base sm:leading-7">
              Old stat sheets, newspaper clippings, schedules, playoff records,
              photographs, rivalry results, and championship material can help fill
              gaps that never made it into a modern database. Submissions are reviewed
              before historical claims are added to VarsityVue.
            </p>
            <Link
              href="/submit"
              className="mt-5 inline-flex rounded-full bg-[var(--vv-primary)] px-5 py-3 text-sm font-black transition hover:bg-[var(--vv-primary-hover)] sm:mt-6 sm:px-7 sm:py-4 sm:text-base"
            >
              Submit History or Records
            </Link>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5 sm:rounded-3xl sm:p-6 md:p-10">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/40 sm:text-xs sm:tracking-[0.3em]">
              Archive Standard
            </p>
            <h2 className="mt-2 text-xl font-black sm:mt-3 sm:text-2xl">Verified before permanent.</h2>
            <p className="mt-3 text-sm leading-6 text-white/60 sm:mt-4 sm:text-base sm:leading-7">
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
    <div className="rounded-[1.1rem] border border-white/10 bg-white/5 p-3 sm:rounded-3xl sm:p-6">
      <p className="text-2xl font-black sm:text-4xl">{value}</p>
      <p className="mt-1 text-[9px] font-bold leading-4 text-white/50 sm:mt-2 sm:text-sm sm:leading-normal">{label}</p>
    </div>
  );
}

function ArchiveRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[7px] font-black uppercase tracking-[0.12em] text-white/35 sm:text-[10px] sm:tracking-[0.2em]">{label}</p>
      <p className="mt-0.5 break-words text-[11px] font-bold leading-4 text-white/80 sm:mt-1 sm:text-sm sm:leading-normal">{value}</p>
    </div>
  );
}
