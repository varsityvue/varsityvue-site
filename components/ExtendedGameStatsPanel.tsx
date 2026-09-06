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
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
              Detailed Team Stats
            </p>
            <h2 className="mt-3 text-2xl font-black">Situational breakdown</h2>
          </div>
          {stats.sourceUrl && (
            <a
              href={stats.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-black uppercase tracking-[0.14em] text-white/45 transition hover:text-white"
            >
              Source: PressBox Stats →
            </a>
          )}
        </div>

        <div className="mt-6 space-y-2">
          {stats.teamMetrics.map((metric) => (
            <div
              key={metric.label}
              className="grid grid-cols-[1fr_auto_1fr] items-center rounded-xl border border-white/10 bg-black/25 px-4 py-3"
            >
              <span className="font-black text-white/80">{metric.away}</span>
              <span className="px-3 text-center text-[10px] font-black uppercase tracking-[0.12em] text-white/35">
                {metric.label}
              </span>
              <span className="text-right font-black text-white/80">{metric.home}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] text-[10px] font-black uppercase tracking-[0.14em] text-white/35">
          <span>{awayTeamName}</span>
          <span>Stat</span>
          <span className="text-right">{homeTeamName}</span>
        </div>
      </section>

      {stats.notes && stats.notes.length > 0 && (
        <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
            Game Leaders
          </p>
          <h2 className="mt-3 text-2xl font-black">Goldthwaite standouts</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {stats.notes.map((note) => (
              <div key={note} className="rounded-2xl border border-white/10 bg-black/25 p-5 text-sm font-bold leading-6 text-white/70">
                {note}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-7 shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-white/45">
          Special Teams & Defense
        </p>
        <h2 className="mt-3 text-2xl font-black">Additional verified statistics</h2>
        <div className="mt-6 grid gap-5 xl:grid-cols-2">
          {stats.tables.map((table) => (
            <div key={table.title} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
              <div className="border-b border-white/10 px-4 py-3 font-black">{table.title}</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase tracking-[0.12em] text-white/35">
                    <tr>
                      {table.headers.map((header) => (
                        <th key={header} className="px-3 py-2 text-left">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row) => (
                      <tr key={`${table.title}-${row.schoolSlug}-${row.player}`} className="border-t border-white/5">
                        <td className="px-3 py-2 font-black text-white/80">{row.player}</td>
                        {row.values.map((value, index) => (
                          <td key={index} className="px-3 py-2 text-white/70">{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs font-bold text-white/35">Verified source: {stats.sourceLabel}</p>
      </section>
    </div>
  );
}
