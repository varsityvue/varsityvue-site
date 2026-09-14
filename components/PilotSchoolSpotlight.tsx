import Link from "next/link";
import { getFeaturedSchools } from "@/lib/schools";
import { getDistrictById } from "@/lib/districts";
import { getUpcomingGamesForSchool } from "@/lib/games";
import ProgramLogo from "./ProgramLogo";

function formatClassification(conference: string, division?: string | null) {
  const divisionLabel =
    division === "D1"
      ? "Division I"
      : division === "D2"
        ? "Division II"
        : division;

  return `${conference}${divisionLabel ? ` ${divisionLabel}` : ""}`;
}

export default function FeaturedSchoolSpotlight() {
  const schools = [...getFeaturedSchools()].sort((a, b) => a.name.localeCompare(b.name));

  if (schools.length === 0) return null;

  return (
    <section className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto max-w-[1440px] rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3.5 shadow-2xl sm:rounded-[2rem] sm:p-6 md:p-8">
        <div className="mb-4 flex flex-col gap-2.5 sm:mb-6 sm:gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45 sm:text-xs sm:tracking-[0.3em]">
              Featured School Hubs
            </p>

            <h2 className="mt-1.5 text-[1.65rem] font-black leading-[1.05] text-white sm:mt-2 sm:text-3xl md:text-4xl">
              Programs to follow in 2026
            </h2>

            <p className="mt-2 max-w-2xl text-xs leading-5 text-white/50 sm:mt-3 sm:text-sm sm:leading-6">
              Explore program hubs with schedules, results, district context, and coverage currently available on VarsityVue.
            </p>
          </div>

          <Link
            href="/schools"
            className="inline-flex w-fit rounded-full border border-white/10 bg-black/35 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/60 transition hover:bg-white/10 hover:text-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.16em]"
          >
            View All Schools →
          </Link>
        </div>

        <div className="grid gap-2.5 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
          {schools.map((school) => {
            const district = getDistrictById(school.districtId);
            const nextGame = getUpcomingGamesForSchool(school.slug)[0];

            return (
              <Link
                key={school.id}
                href={`/schools/${school.slug}`}
                className="group overflow-hidden rounded-[1.2rem] border border-white/10 bg-black/35 transition hover:-translate-y-1 hover:bg-white/[0.07] sm:rounded-[1.5rem]"
              >
                <div
                  className="h-1.5 sm:h-2"
                  style={{ backgroundColor: school.colors.primary }}
                />

                <div className="p-3.5 sm:p-5">
                  <div className="flex items-start justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40 sm:text-xs sm:tracking-[0.2em]">
                        {formatClassification(
                          school.classification.conference,
                          school.classification.division
                        )}
                      </p>

                      <h3 className="mt-1.5 truncate text-2xl font-black text-white sm:mt-2 sm:text-3xl">
                        {school.name}
                      </h3>

                      <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-white/45 sm:mt-1 sm:text-sm sm:tracking-[0.14em]">
                        {school.mascot}
                      </p>
                    </div>

                    <ProgramLogo school={school} size="sm" />
                  </div>

                  <div className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 sm:mt-5 sm:rounded-2xl sm:p-4">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/35 sm:text-[10px] sm:tracking-[0.18em]">
                      District
                    </p>

                    <p className="mt-1.5 line-clamp-1 text-xs font-black text-white/75 sm:mt-2 sm:text-sm">
                      {district?.name ?? "—"}
                    </p>
                  </div>

                  {nextGame && (
                    <div className="mt-2 rounded-xl border border-white/10 bg-black/35 p-3 sm:mt-3 sm:rounded-2xl sm:p-4">
                      <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/35 sm:text-[10px] sm:tracking-[0.18em]">
                        Next Up
                      </p>

                      <p className="mt-1.5 line-clamp-1 text-xs font-black text-white sm:mt-2 sm:text-sm">
                        {nextGame.awayTeam} at {nextGame.homeTeam}
                      </p>
                    </div>
                  )}

                  <p className="mt-3 text-[10px] font-black uppercase tracking-[0.13em] text-white/50 transition group-hover:text-white sm:mt-5 sm:text-xs sm:tracking-[0.16em]">
                    View School Hub →
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
