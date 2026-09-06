import { extendedGameStats } from "@/data/extended-game-stats";

export default function ExtendedGameStatsPanel({
  gameId,
  awayTeamName,
  homeTeamName,
}: {
  gameId: string;
  awayTeamName: string;
  homeTeamName: string;
}) {
  const stats = extendedGameStats.find((entry) => entry.gameId === gameId);
  if (!stats) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-7">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45 sm:text-xs sm:tracking-[0.28em]">
          Detailed Team Stats
        </p>
        <h2 className="mt-2 text-xl font-black sm:mt-3 sm:text-2xl">Situational breakdown</h2>

        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/35 sm:mt-6 sm:text-[10px] sm:tracking-[0.14em]">
          <span className="truncate">{awayTeamName}</span>
          <span>Stat</span>
          <span className="truncate text-right">{homeTeamName}</span>
        </div>

        <div className="mt-2 space-y-2">
          {stats.teamMetrics.map((metric) => (
            <div
              key={metric.label}
              className="grid grid-cols-[1fr_minmax(84px,auto)_1fr] items-center rounded-xl border border-white/10 bg-black/25 px-3 py-3 sm:grid-cols-[1fr_auto_1fr] sm:px-4"
            >
              <span className="text-sm font-black text-white/80 sm:text-base">{metric.away}</span>
              <span className="px-2 text-center text-[9px] font-black uppercase leading-4 tracking-[0.08em] text-white/35 sm:px-3 sm:text-[10px] sm:tracking-[0.12em]">
                {metric.label}
              </span>
              <span className="text-right text-sm font-black text-white/80 sm:text-base">{metric.home}</span>
            </div>
          ))}
        </div>
      </section>

      {stats.notes && stats.notes.length > 0 && (
        <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-7">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45 sm:text-xs sm:tracking-[0.28em]">
            Game Leaders
          </p>
          <h2 className="mt-2 text-xl font-black sm:mt-3 sm:text-2xl">Standout performances</h2>
          <div className="mt-4 grid gap-2.5 sm:mt-5 sm:gap-3 md:grid-cols-2">
            {stats.notes.map((note) => (
              <div key={note} className="rounded-xl border border-white/10 bg-black/25 p-4 text-sm font-bold leading-6 text-white/70 sm:rounded-2xl sm:p-5">
                {note}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-7">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45 sm:text-xs sm:tracking-[0.28em]">
          Special Teams & Defense
        </p>
        <h2 className="mt-2 text-xl font-black sm:mt-3 sm:text-2xl">Verified VarsityVue statistics</h2>
        <div className="mt-5 grid gap-3 sm:mt-6 sm:gap-5 xl:grid-cols-2">
          {stats.tables.map((table) => (
            <div key={table.title} className="overflow-hidden rounded-xl border border-white/10 bg-black/30 sm:rounded-2xl">
              <div className="border-b border-white/10 px-3 py-3 text-sm font-black sm:px-4">{table.title}</div>

              <div className="divide-y divide-white/10 sm:hidden">
                {table.rows.map((row) => (
                  <div key={`${table.title}-${row.schoolSlug}-${row.player}`} className="p-3">
                    <p className="text-sm font-black text-white/85">{row.player}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {row.values.map((value, index) => (
                        <div key={index} className="rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
                          <p className="text-[8px] font-black uppercase tracking-[0.1em] text-white/30">
                            {table.headers[index + 1] ?? `Stat ${index + 1}`}
                          </p>
                          <p className="mt-1 text-xs font-black text-white/75">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-max text-sm">
                  <thead className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                    <tr>
                      {table.headers.map((header) => (
                        <th key={header} className="whitespace-nowrap px-3 py-2 text-left">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row) => (
                      <tr key={`${table.title}-${row.schoolSlug}-${row.player}`} className="border-t border-white/5">
                        <td className="whitespace-nowrap px-3 py-2 font-black text-white/80">{row.player}</td>
                        {row.values.map((value, index) => (
                          <td key={index} className="whitespace-nowrap px-3 py-2 text-white/70">{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
