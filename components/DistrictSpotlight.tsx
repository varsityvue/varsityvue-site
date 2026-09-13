import Link from "next/link";
import { getDistrictById } from "@/lib/districts";
import { getSchoolsByDistrictId } from "@/lib/schools";
import { getStandingsForDistrictId } from "@/lib/standings";
import SchoolBadge from "./SchoolBadge";

const DISTRICT_ID = "2a-d1-district-5";

function formatClassification(conference: string, division?: string | null) {
  const divisionLabel =
    division === "D1"
      ? "Division I"
      : division === "D2"
        ? "Division II"
        : division;

  return `${conference}${divisionLabel ? ` ${divisionLabel}` : ""}`;
}

export default function DistrictSpotlight() {
  const district = getDistrictById(DISTRICT_ID);
  const schools = getSchoolsByDistrictId(DISTRICT_ID);
  const standings = getStandingsForDistrictId(DISTRICT_ID).slice(0, 4);
  const districtStarted = standings.some(
    (team) => team.districtWins > 0 || team.districtLosses > 0
  );

  if (!district) return null;

  return (
    <section className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto grid max-w-[1440px] gap-3 sm:gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3.5 shadow-2xl sm:rounded-[2rem] sm:p-6 md:p-8">
          <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/45 sm:text-xs sm:tracking-[0.3em]">
            District Spotlight
          </p>

          <h2 className="mt-1.5 text-[1.7rem] font-black leading-[1.04] text-white sm:mt-3 sm:text-4xl md:text-5xl">
            {district.name}
          </h2>

          <p className="mt-1.5 max-w-2xl text-xs leading-5 text-white/55 sm:mt-3 sm:text-sm sm:leading-6">
            A featured VarsityVue district hub connecting school hubs, schedules,
            standings, and matchup coverage across the region.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-1.5 sm:mt-6 sm:gap-3">
            <MiniStat label="Schools" value={schools.length.toString()} />
            <MiniStat label="Region" value={`Region ${district.uilRegion}`} />
            <MiniStat
              label="Class"
              value={formatClassification(
                district.classification.conference,
                district.classification.division
              )}
            />
          </div>

          <Link
            href={`/districts/${district.slug}`}
            className="mt-4 inline-flex rounded-full border border-white/10 bg-black/35 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-white/65 transition hover:bg-white/10 hover:text-white sm:mt-6 sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.16em]"
          >
            View District Hub →
          </Link>
        </div>

        <div className="rounded-[1.4rem] border border-white/10 bg-black/35 p-3.5 shadow-2xl sm:rounded-[2rem] sm:p-6 md:p-8">
          <div className="mb-3 flex items-end justify-between gap-3 sm:mb-5 sm:gap-4">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-white/45 sm:text-xs sm:tracking-[0.3em]">
                {districtStarted ? "Current Race" : "District Preview"}
              </p>

              <h3 className="mt-1.5 text-xl font-black leading-tight text-white sm:mt-2 sm:text-3xl">
                {districtStarted ? "Standings Snapshot" : "District Teams"}
              </h3>
            </div>

            <Link
              href={`/districts/${district.slug}`}
              className="shrink-0 text-[9px] font-black uppercase tracking-[0.12em] text-white/45 transition hover:text-white sm:text-xs sm:tracking-[0.16em]"
            >
              Full Table →
            </Link>
          </div>

          {!districtStarted && (
            <p className="mb-3 text-xs leading-5 text-white/45 sm:mb-4 sm:text-sm sm:leading-6">
              District play has not produced a verified result yet. Teams are shown without a district ranking.
            </p>
          )}

          <div className="space-y-2 sm:space-y-3">
            {standings.map((team, index) => {
              const school = schools.find((item) => item.slug === team.schoolSlug);
              const differential = team.pointsFor - team.pointsAgainst;
              const hasOverallResult = team.overallWins > 0 || team.overallLosses > 0;
              const previousTeam = standings[index - 1];
              const tiedWithPrevious =
                districtStarted &&
                previousTeam &&
                previousTeam.districtWins === team.districtWins &&
                previousTeam.districtLosses === team.districtLosses;
              const firstTieIndex = tiedWithPrevious
                ? standings.findIndex(
                    (item) =>
                      item.districtWins === team.districtWins &&
                      item.districtLosses === team.districtLosses
                  )
                : index;
              const tiedWithNext =
                districtStarted &&
                standings[index + 1] &&
                standings[index + 1].districtWins === team.districtWins &&
                standings[index + 1].districtLosses === team.districtLosses;
              const position =
                districtStarted && (tiedWithPrevious || tiedWithNext)
                  ? `T-${firstTieIndex + 1}`
                  : districtStarted
                    ? `#${index + 1}`
                    : "—";

              const teamContent = (
                <>
                  <p className="text-sm font-black text-white/45 sm:text-base">{position}</p>

                  {school && <SchoolBadge school={school} size="xs" />}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white sm:text-base">{team.team}</p>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white/35 sm:mt-1 sm:text-xs sm:tracking-[0.12em]">
                      {school?.mascot ?? "Program"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-black text-white sm:text-base">
                      {hasOverallResult
                        ? `${team.overallWins}-${team.overallLosses}`
                        : "—"}
                    </p>
                    <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white/35 sm:text-[10px] sm:tracking-[0.12em]">
                      Overall
                    </p>
                    <p className="mt-0.5 text-[11px] font-bold text-white/40 sm:mt-1 sm:text-xs">
                      {hasOverallResult ? `${differential > 0 ? "+" : ""}${differential}` : "—"}
                    </p>
                  </div>
                </>
              );

              return school ? (
                <Link
                  key={team.schoolSlug}
                  href={`/schools/${school.slug}`}
                  className="grid grid-cols-[24px_auto_1fr_auto] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 transition hover:bg-white/[0.08] sm:grid-cols-[32px_auto_1fr_auto] sm:gap-3 sm:rounded-2xl sm:p-4"
                >
                  {teamContent}
                </Link>
              ) : (
                <div
                  key={team.schoolSlug}
                  className="grid grid-cols-[24px_auto_1fr_auto] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-2.5 sm:grid-cols-[32px_auto_1fr_auto] sm:gap-3 sm:rounded-2xl sm:p-4"
                >
                  {teamContent}
                </div>
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
    <div className="min-w-0 rounded-lg border border-white/10 bg-black/35 p-2 sm:rounded-2xl sm:p-4">
      <p className="text-[8px] font-black uppercase tracking-[0.12em] text-white/35 sm:text-[10px] sm:tracking-[0.18em]">
        {label}
      </p>
      <p className="mt-1 break-words text-[11px] font-black leading-tight text-white sm:mt-2 sm:text-base">{value}</p>
    </div>
  );
}
