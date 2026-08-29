import Link from "next/link";
import { getDistrictById } from "@/lib/districts";
import { getSchoolsByDistrictId } from "@/lib/schools";
import { getStandingsForDistrictId } from "@/lib/standings";
import SchoolBadge from "./SchoolBadge";

const DISTRICT_ID = "2a-d1-district-5";

export default function DistrictSpotlight() {
  const district = getDistrictById(DISTRICT_ID);
  const schools = getSchoolsByDistrictId(DISTRICT_ID);
  const standings = getStandingsForDistrictId(DISTRICT_ID).slice(0, 4);

  if (!district) return null;

  return (
    <section className="px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl md:p-8">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white/45">
            District Spotlight
          </p>

          <h2 className="mt-3 text-4xl font-black leading-tight text-white md:text-5xl">
            {district.name}
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
            One of VarsityVue&apos;s featured district races, connecting school
            hubs, schedules, standings, and matchup coverage across the region.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <MiniStat label="Schools" value={schools.length.toString()} />
            <MiniStat label="Region" value={`Region ${district.uilRegion}`} />
            <MiniStat
              label="Class"
              value={`${district.classification.conference} ${district.classification.division}`}
            />
          </div>

          <Link
            href={`/districts/${district.slug}`}
            className="mt-6 inline-flex rounded-xl border border-white/15 bg-white/10 px-6 py-4 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-white/15"
          >
            View District Hub →
          </Link>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6 shadow-2xl md:p-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-white/45">
                Current Race
              </p>

              <h3 className="mt-2 text-3xl font-black text-white">
                Standings Snapshot
              </h3>
            </div>

            <Link
              href={`/districts/${district.slug}`}
              className="text-xs font-black uppercase tracking-[0.16em] text-white/45 transition hover:text-white"
            >
              Full Table →
            </Link>
          </div>

          <div className="space-y-3">
            {standings.map((team, index) => {
              const school = schools.find((item) => item.slug === team.schoolSlug);
              const differential = team.pointsFor - team.pointsAgainst;

              return (
                <Link
                  key={team.schoolSlug}
                  href={`/schools/${team.schoolSlug}`}
                  className="grid grid-cols-[32px_auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition hover:bg-white/[0.08]"
                >
                  <p className="font-black text-white/45">#{index + 1}</p>

                  {school && <SchoolBadge school={school} size="xs" />}

                  <div className="min-w-0">
                    <p className="truncate font-black text-white">{team.team}</p>
                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/35">
                      {school?.mascot ?? "Program"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-white">
                      {team.overallWins}-{team.overallLosses}
                    </p>
                    <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/35">
                      Overall
                    </p>
                    <p className="mt-1 text-xs font-bold text-white/40">
                      {differential > 0 ? "+" : ""}
                      {differential}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/35 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">
        {label}
      </p>
      <p className="mt-2 font-black text-white">{value}</p>
    </div>
  );
}
