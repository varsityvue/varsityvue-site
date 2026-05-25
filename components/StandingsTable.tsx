import Link from "next/link";
import type { SchoolTheme } from "../types/school-theme";

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

export default function StandingsTable({
  standings,
  theme,
}: StandingsTableProps) {
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
            District standings will appear here once results are added.
          </p>
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-3xl border bg-black/35"
          style={{
            borderColor: `${theme.secondary}33`,
            boxShadow: `0 18px 50px ${theme.primary}18`,
          }}
        >
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead
              style={{
                background: `linear-gradient(90deg, ${theme.primary}66, #2a2a2a)`,
              }}
            >
              <tr>
                {["Rank", "Team", "District", "Overall", "PF", "PA", "Diff"].map(
                  (header) => (
                    <th
                      key={header}
                      className="px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-white"
                    >
                      {header}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {standings.map((team, index) => {
                const differential = team.pointsFor - team.pointsAgainst;

                return (
                  <tr
                    key={team.schoolSlug}
                    className="border-t border-white/10 transition hover:bg-white/[0.06]"
                    style={{
                      backgroundColor:
                        index < 4 ? `${theme.primary}18` : undefined,
                    }}
                  >
                    <td className="px-5 py-4 font-black text-white">
                      <div className="flex items-center gap-2">
                        <span>#{index + 1}</span>

                        {index < 4 && (
                          <span
                            className="rounded-full border bg-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/75"
                            style={{
                              borderColor: `${theme.secondary}33`,
                            }}
                          >
                            Playoff
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-black text-white">
                      <Link
                        href={`/schools/${team.schoolSlug}`}
                        className="text-white transition hover:text-white/70"
                      >
                        {team.team}
                      </Link>
                    </td>

                    <td className="px-5 py-4 font-black text-white">
                      {team.districtWins}-{team.districtLosses}
                    </td>

                    <td className="px-5 py-4 font-black text-white/70">
                      {team.overallWins}-{team.overallLosses}
                    </td>

                    <td className="px-5 py-4 font-black text-white/70">
                      {team.pointsFor}
                    </td>

                    <td className="px-5 py-4 font-black text-white/70">
                      {team.pointsAgainst}
                    </td>

                    <td className="px-5 py-4 font-black text-white">
                      {differential > 0 ? "+" : ""}
                      {differential}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}