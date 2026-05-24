import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "VarsityVue Legacy | Texas High School Sports History",
  description:
    "VarsityVue Legacy is building historical school archives with records, rivalry history, playoff runs, district titles, notable teams, and community-submitted Texas high school sports history.",
};

const legacyFeatures = [
  "10-20 year records for select pilot schools",
  "Playoff history and notable postseason runs",
  "District championships and rivalry records",
  "State appearances, state titles, and milestone seasons",
  "Community-submitted history with review and verification",
  "Historical pages built directly into school hubs",
];

const pilotSchools = ["Stephenville", "De Leon", "Comanche", "Albany", "Cisco"];

export default function LegacyPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.55),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
            VarsityVue Legacy
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            Every program has a story. VarsityVue is building the archive.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
            Legacy will bring historical records, rivalry data, playoff runs,
            notable teams, district championships, and community-submitted
            history to select pilot schools.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/schools"
              className="rounded-full bg-[#7A1022] px-7 py-4 text-center font-bold transition hover:bg-[#93142a]"
            >
              View School Hubs
            </Link>

            <Link
              href="/sponsor-inquiry"
              className="rounded-full border border-white/20 bg-white/5 px-7 py-4 text-center font-bold transition hover:bg-white/10"
            >
              Sponsor Legacy
            </Link>
          </div>
        </section>

        <section className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {legacyFeatures.map((feature) => (
            <div
              key={feature}
              className="rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <p className="text-lg font-black">{feature}</p>
            </div>
          ))}
        </section>

        <section className="mt-10 rounded-3xl border border-[#7A1022]/30 bg-[#7A1022]/10 p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
            Pilot Archive Targets
          </p>

          <h2 className="mt-3 text-4xl font-black">
            Select schools will receive deeper historical pages first.
          </h2>

          <div className="mt-8 flex flex-wrap gap-3">
            {pilotSchools.map((school) => (
              <span
                key={school}
                className="rounded-full border border-white/10 bg-black/40 px-5 py-3 text-sm font-black"
              >
                {school}
              </span>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}