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
    <section>
      <div>
        <h2 className="mb-6 text-3xl font-black">District Standings</h2>

        {standings.length === 0 ? (
          <div
            className="rounded-3xl border bg-white/5 p-6 text-white/60"
            style={{ borderColor: `${theme.secondary}33` }}
          >
            No standings available.
          </div>
        ) : (
          <div
            className="overflow-hidden rounded-3xl border bg-white/5 shadow-lg"
            style={{
              borderColor: `${theme.secondary}33`,
              boxShadow: `0 18px 50px ${theme.primary}33`,
            }}
          >
            <table className="w-full text-left text-sm sm:text-base">
              <thead
                className="border-b"
                style={{
                  borderColor: `${theme.secondary}33`,
                  background: `linear-gradient(90deg, ${theme.primary}66, ${theme.secondary}22)`,
                }}
              >
                <tr>
                  <th className="px-4 py-4 sm:px-6">Rank</th>
                  <th className="px-4 py-4 sm:px-6">Team</th>
                  <th className="px-4 py-4 sm:px-6">District</th>
                  <th className="px-4 py-4 sm:px-6">Overall</th>
                  <th className="px-4 py-4 sm:px-6">PF</th>
                  <th className="px-4 py-4 sm:px-6">PA</th>
                  <th className="px-4 py-4 sm:px-6">Diff</th>
                </tr>
              </thead>

              <tbody>
                {standings.map((team, index) => {
                  const differential = team.pointsFor - team.pointsAgainst;

                  return (
                    <tr
                      key={team.team}
                      className="border-b transition hover:bg-white/[0.06] last:border-none"
                      style={{ borderColor: `${theme.secondary}22` }}
                    >
                      <td className="px-4 py-4 font-bold text-white/60 sm:px-6">
                        #{index + 1}
                      </td>

                      <td className="px-4 py-4 font-semibold sm:px-6">
                        {team.team}
                      </td>

                      <td
                        className="px-4 py-4 font-semibold sm:px-6"
                        style={{ color: theme.accent }}
                      >
                        {team.districtWins}-{team.districtLosses}
                      </td>

                      <td className="px-4 py-4 text-white/75 sm:px-6">
                        {team.overallWins}-{team.overallLosses}
                      </td>

                      <td className="px-4 py-4 text-white/70 sm:px-6">
                        {team.pointsFor}
                      </td>

                      <td className="px-4 py-4 text-white/70 sm:px-6">
                        {team.pointsAgainst}
                      </td>

                      <td
                        className="px-4 py-4 font-semibold sm:px-6"
                        style={{
                          color:
                            differential >= 0
                              ? theme.accent
                              : "rgba(255,255,255,0.5)",
                        }}
                      >
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
      </div>
    </section>
  );
}