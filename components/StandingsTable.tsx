import Link from "next/link";
import type { SchoolTheme } from "../types/school-theme";
import { getSchoolBySlug } from "@/lib/schools";
import SchoolBadge from "./SchoolBadge";

type Standing = {
  schoolSlug: string;
  team: string;
  districtWins: number;
  districtLosses: number;
  overallWins: number;
  overallLosses: number;
  pointsFor: number;
  pointsAgainst: number;
};

type StandingsTableProps = {
  standings: Standing[];
  theme: SchoolTheme;
};

function hasDistrictResults(standings: Standing[]) {
  return standings.some(
    (team) => team.districtWins > 0 || team.districtLosses > 0
  );
}

function hasOverallResults(standings: Standing[]) {
  return standings.some(
    (team) =>
      team.overallWins > 0 ||
      team.overallLosses > 0 ||
      team.pointsFor > 0 ||
      team.pointsAgainst > 0
  );
}

function getStandingPosition(standings: Standing[], index: number) {
  const team = standings[index];
  const firstIndex = standings.findIndex(
    (candidate) =>
      candidate.districtWins === team.districtWins &&
      candidate.districtLosses === team.districtLosses
  );
  const tiedTeams = standings.filter(
    (candidate) =>
      candidate.districtWins === team.districtWins &&
      candidate.districtLosses === team.districtLosses
  ).length;

  return tiedTeams > 1 ? `T-${firstIndex + 1}` : `#${firstIndex + 1}`;
}

export default function StandingsTable({
  standings,
  theme,
}: StandingsTableProps) {
  const districtStarted = hasDistrictResults(standings);
  const seasonStarted = hasOverallResults(standings);

  return (
    <section
      className="rounded-[1.75rem] border bg-white/[0.045] p-5 shadow-2xl sm:p-6"
      style={{
        borderColor: `${theme.secondary}22`,
        boxShadow: `0 18px 55px ${theme.primary}14`,
      }}
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">
            District Race
          </p>
          <h2 className="mt-2 text-3xl font-black text-white">Standings</h2>
        </div>

        <Link
          href="/districts"
          className="rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10 hover:text-white"
          style={{
            borderColor: `${theme.secondary}33`,
            backgroundColor: "rgba(255,255,255,0.08)",
          }}
        >
          Districts →
        </Link>
      </div>

      {standings.length === 0 ? (
        <div
          className="rounded-3xl border bg-black/35 p-6"
          style={{ borderColor: `${theme.secondary}33` }}
        >
          <p className="text-lg font-black text-white">
            No standings available yet.
          </p>
          <p className="mt-2 text-sm leading-6 text-white/50">
            District standings will appear here once verified results are on file.
          </p>
        </div>
      ) : (
        <>
          {!districtStarted && (
            <div
              className="mb-4 rounded-2xl border bg-black/35 p-4"
              style={{ borderColor: `${theme.secondary}33` }}
            >
              <p className="text-sm font-black text-white">
                District play has not started yet.
              </p>
              <p className="mt-1 text-sm leading-6 text-white/45">
                {seasonStarted
                  ? "Overall records are shown for context. Teams remain listed alphabetically until verified district results are available."
                  : "Teams are listed alphabetically by district membership until verified district results are available."}
              </p>
            </div>
          )}

          <div
            className="overflow-x-auto rounded-3xl border bg-black/35"
            style={{
              borderColor: `${theme.secondary}33`,
              boxShadow: `0 18px 50px ${theme.primary}18`,
            }}
          >
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.04))",
                  borderBottom: `2px solid ${theme.primary}`,
                }}
              >
                <tr>
                  {[
                    districtStarted ? "Place" : "—",
                    "Team",
                    "District",
                    "Overall",
                    "PF",
                    "PA",
                    "Diff",
                  ].map((header, index) => (
                    <th
                      key={`${header}-${index}`}
                      className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-white"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {standings.map((team, index) => {
                  const differential = team.pointsFor - team.pointsAgainst;
                  const school = getSchoolBySlug(team.schoolSlug);
                  const teamContent = (
                    <div className="flex items-center gap-4">
                      {school ? (
                        <SchoolBadge school={school} size="xs" />
                      ) : (
                        <FallbackBadge label={team.team} />
                      )}

                      <div>
                        <p className="font-black text-white">{team.team}</p>
                        {school && (
                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-white/40">
                            {school.mascot}
                          </p>
                        )}
                      </div>
                    </div>
                  );

                  return (
                    <tr
                      key={team.schoolSlug}
                      className="border-t border-white/10 transition hover:bg-white/[0.06]"
                    >
                      <td className="px-5 py-4 font-black text-white">
                        {districtStarted ? (
                          <span>{getStandingPosition(standings, index)}</span>
                        ) : (
                          <span className="text-white/25">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {school ? (
                          <Link
                            href={`/schools/${team.schoolSlug}`}
                            className="block text-white transition hover:text-white/70"
                          >
                            {teamContent}
                          </Link>
                        ) : (
                          teamContent
                        )}
                      </td>

                      <td className="px-5 py-4 font-black text-white">
                        {districtStarted
                          ? `${team.districtWins}-${team.districtLosses}`
                          : "—"}
                      </td>

                      <td className="px-5 py-4 font-black text-white/70">
                        {seasonStarted
                          ? `${team.overallWins}-${team.overallLosses}`
                          : "—"}
                      </td>

                      <td className="px-5 py-4 font-black text-white/70">
                        {seasonStarted ? team.pointsFor : "—"}
                      </td>

                      <td className="px-5 py-4 font-black text-white/70">
                        {seasonStarted ? team.pointsAgainst : "—"}
                      </td>

                      <td className="px-5 py-4 font-black text-white">
                        {seasonStarted
                          ? `${differential > 0 ? "+" : ""}${differential}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {districtStarted && (
            <p className="mt-4 text-xs leading-5 text-white/35">
              Teams with the same verified district record are shown as tied. VarsityVue does not apply unofficial district tiebreakers or project playoff qualifiers.
            </p>
          )}
        </>
      )}
    </section>
  );
}

function FallbackBadge({ label }: { label: string }) {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/10 p-2 text-center text-[10px] font-black uppercase text-white">
      {label.slice(0, 3)}
    </div>
  );
}
