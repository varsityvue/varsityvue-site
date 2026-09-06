import { extendedGameStats } from "@/data/extended-game-stats";

export default function ExtendedGameStatsPanel({ gameId, awayTeamName, homeTeamName }: { gameId: string; awayTeamName: string; homeTeamName: string }) {
  const stats = extendedGameStats.find((entry) => entry.gameId === gameId);
  if (!stats) return null;

  return (
    <div className="space-y-3 sm:space-y-6">
      <section className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-7">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40 sm:text-xs sm:tracking-[0.28em]">Detailed Team Stats</p>
        <h2 className="mt-1.5 text-lg font-black sm:mt-3 sm:text-2xl">Situational breakdown</h2>
        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-1 text-[8px] font-black uppercase tracking-[0.08em] text-white/30 sm:mt-6 sm:text-[10px] sm:tracking-[0.14em]"><span className="truncate">{awayTeamName}</span><span>Stat</span><span className="truncate text-right">{homeTeamName}</span></div>
        <div className="mt-1.5 space-y-1.5 sm:mt-2 sm:space-y-2">
          {stats.teamMetrics.map((metric) => <div key={metric.label} className="grid grid-cols-[1fr_minmax(76px,auto)_1fr] items-center rounded-lg border border-white/10 bg-black/25 px-3 py-2.5 sm:grid-cols-[1fr_auto_1fr] sm:rounded-xl sm:px-4 sm:py-3"><span className="text-sm font-black text-white/80 sm:text-base">{metric.away}</span><span className="px-1.5 text-center text-[8px] font-black uppercase leading-3 tracking-[0.06em] text-white/35 sm:px-3 sm:text-[10px] sm:leading-4 sm:tracking-[0.12em]">{metric.label}</span><span className="text-right text-sm font-black text-white/80 sm:text-base">{metric.home}</span></div>)}
        </div>
      </section>

      {stats.notes && stats.notes.length > 0 && <section className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-7"><div className="flex items-end justify-between gap-3 sm:block"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40 sm:text-xs sm:tracking-[0.28em]">Game Leaders</p><h2 className="mt-1.5 text-lg font-black sm:mt-3 sm:text-2xl">Standout performances</h2></div><span className="shrink-0 text-[9px] font-black text-white/25 sm:hidden">{stats.notes.length}</span></div><div className="mt-3 divide-y divide-white/10 sm:mt-5 sm:grid sm:gap-3 sm:divide-y-0 md:grid-cols-2">{stats.notes.map((note) => <div key={note} className="py-2.5 text-xs font-bold leading-5 text-white/65 sm:rounded-2xl sm:border sm:border-white/10 sm:bg-black/25 sm:p-5 sm:text-sm sm:leading-6">{note}</div>)}</div></section>}

      <section className="rounded-[1.25rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:rounded-[1.75rem] sm:p-7">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/40 sm:text-xs sm:tracking-[0.28em]">Special Teams & Defense</p>
        <h2 className="mt-1.5 text-lg font-black sm:mt-3 sm:text-2xl">Verified VarsityVue statistics</h2>
        <div className="mt-4 grid gap-2.5 sm:mt-6 sm:gap-5 xl:grid-cols-2">
          {stats.tables.map((table) => <div key={table.title} className="overflow-hidden rounded-xl border border-white/10 bg-black/30 sm:rounded-2xl"><div className="border-b border-white/10 px-3 py-2.5 text-xs font-black sm:px-4 sm:py-3 sm:text-sm">{table.title}</div>
            <div className="divide-y divide-white/10 sm:hidden">{table.rows.map((row) => <div key={`${table.title}-${row.schoolSlug}-${row.player}`} className="px-3 py-2.5"><p className="text-xs font-black text-white/85">{row.player}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">{row.values.map((value, index) => <p key={index} className="text-[10px] font-bold text-white/60"><span className="mr-1 text-[8px] font-black uppercase tracking-[0.08em] text-white/25">{table.headers[index + 1] ?? `Stat ${index + 1}`}</span>{value}</p>)}</div></div>)}</div>
            <div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-max text-sm"><thead className="text-[10px] uppercase tracking-[0.12em] text-white/35"><tr>{table.headers.map((header) => <th key={header} className="whitespace-nowrap px-3 py-2 text-left">{header}</th>)}</tr></thead><tbody>{table.rows.map((row) => <tr key={`${table.title}-${row.schoolSlug}-${row.player}`} className="border-t border-white/5"><td className="whitespace-nowrap px-3 py-2 font-black text-white/80">{row.player}</td>{row.values.map((value, index) => <td key={index} className="whitespace-nowrap px-3 py-2 text-white/70">{value}</td>)}</tr>)}</tbody></table></div>
          </div>)}
        </div>
      </section>
    </div>
  );
}
