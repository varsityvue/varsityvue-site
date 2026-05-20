import type { SchoolTheme } from "../types/school-theme";

type Standing = {
  team: string;
  districtRecord: string;
  overallRecord: string;
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
                  <th className="px-4 py-4 sm:px-6">Team</th>
                  <th className="px-4 py-4 sm:px-6">District</th>
                  <th className="px-4 py-4 sm:px-6">Overall</th>
                </tr>
              </thead>

              <tbody>
                {standings.map((team) => (
                  <tr
                    key={team.team}
                    className="border-b transition hover:bg-white/[0.06] last:border-none"
                    style={{ borderColor: `${theme.secondary}22` }}
                  >
                    <td className="px-4 py-4 font-semibold sm:px-6">
                      {team.team}
                    </td>
                    <td
                      className="px-4 py-4 font-semibold sm:px-6"
                      style={{ color: theme.accent }}
                    >
                      {team.districtRecord}
                    </td>
                    <td className="px-4 py-4 text-white/70 sm:px-6">
                      {team.overallRecord}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}