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
    <section className="px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1440px] gap-4 sm:gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl sm:rounded-[2rem] sm:p-6 md:p-8">
          <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/45 sm:text-xs sm:tracking-[0.3em]">
            District Spotlight
          </p>

          <h2 className="mt-2 text-[1.95rem] font-black leading-[1.05] text-white sm:mt-3 sm:text-4xl md:text-5xl">
            {district.name}
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55 sm:mt-3">
            A featured VarsityVue district hub connecting school hubs, schedules,
            standings, and matchup coverage across the region.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
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
            className="mt-5 inline-flex rounded-full border border-white/10 bg-black/35 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/65 transition hover:bg-white/10 hover:text-white sm:mt-6 sm:text-xs sm:tracking-[0.16em]"
          >
            View District Hub →
          </Link>
        </div>

        <div className="rounded-[1.6rem] border border-white/10 bg-black/35 p-4 shadow-2xl sm:rounded-[2rem] sm:p-6 md:p-8">
          <div className="mb-4 flex items-end justify-between gap-4 sm:mb-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.26em] text-white/45 sm:text-xs sm:tracking-[0.3em]">
                {districtStarted ? "Current Race" : "District Preview"}
              </p>

              <h3 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
                {districtStarted ? "Standings Snapshot" : "District Teams"}
              </h3>
            </div>

            <Link
              href={`/districts/${district.slug}`}
              className="shrink-0 text-[10px] font-black uppercase tracking-[0.14em] text-white/45 transition hover:text-white sm:text-xs sm:tracking-[0.16em]"
            >
              Full Table →
            </Link>
          </div>

          {!districtStarted && (
            <p className="mb-4 text-sm leading-6 text-white/45">
              District play has not produced a verified result yet. Teams are shown without a district ranking.
            </p>
          )}

          <div className="space-y-2.5 sm:space-y-3">
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
                  <p className="font-black text-white/45">{position}</p>

                  {school && <SchoolBadge school={school} size="xs" />}

                  <div className="min-w-0">
                    <p className="truncate font-black text-white">{team.team}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/35 sm:text-xs">
                      {school?.mascot ?? "Program"}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-black text-white">
                      {hasOverallResult
                        ? `${team.overallWins}-${team.overallLosses}`
                        : "—"}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/35 sm:text-[10px]">
                      Overall
                    </p>
                    <p className="mt-1 text-xs font-bold text-white/40">
                      {hasOverallResult ? `${differential > 0 ? "+" : ""}${differential}` : "—"}
                    </p>
                  </div>
                </>
              );

              return school ? (
                <Link
                  key={team.schoolSlug}
                  href={`/schools/${school.slug}`}
                  className="grid grid-cols-[28px_auto_1fr_auto] items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 transition hover:bg-white/[0.08] sm:grid-cols-[32px_auto_1fr_auto] sm:gap-3 sm:rounded-2xl sm:p-4"
                >
                  {teamContent}
                </Link>
              ) : (
                <div
                  key={team.schoolSlug}
                  className="grid grid-cols-[28px_auto_1fr_auto] items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.04] p-3.5 sm:grid-cols-[32px_auto_1fr_auto] sm:gap-3 sm:rounded-2xl sm:p-4"
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
    <div className="min-w-0 rounded-xl border border-white/10 bg-black/35 p-3 sm:rounded-2xl sm:p-4">
      <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35 sm:text-[10px] sm:tracking-[0.18em]">
        {label}
      </p>
      <p className="mt-1.5 break-words text-xs font-black leading-tight text-white sm:mt-2 sm:text-base">{value}</p>
    </div>
  );
}
