import { extendedGameStats } from "@/data/extended-game-stats";
import StatCompletenessBadge from "@/components/StatCompletenessBadge";
import { combineCategoryStates } from "@/lib/stat-completeness";
import { presentPlayerValues, presentExtendedNotes, presentTeamMetric, type DisplayStat } from "@/lib/extended-stat-presentation";
import { getSchoolBySlug } from "@/data/schools";

function Values({ fields }: { fields: DisplayStat[] }) {
  return <dl className="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3">{fields.map((field, index) => <div key={`${field.label}-${index}`} className="min-w-0"><dt className="break-words text-xs font-semibold leading-5 text-white/70">{field.label}</dt><dd className="break-words text-base font-bold leading-6 text-white">{field.value === "" ? "—" : field.value}</dd></div>)}</dl>;
}
const panel = "rounded-2xl border border-white/10 bg-white/[0.045] p-4 sm:p-7";

export default function ExtendedGameStatsPanel({ gameId, awayTeamName, homeTeamName }: { gameId: string; awayTeamName: string; homeTeamName: string }) {
  const stats = extendedGameStats.find((entry) => entry.gameId === gameId);
  if (!stats) return null;
  const offensiveDetail = stats.tables.some((table) => table.title === "Passing detail");
  const notes = presentExtendedNotes(gameId, stats.notes);

  return <div className="min-w-0 space-y-4 sm:space-y-6">
    <section className={panel}>
      <h2 className="text-xl font-black sm:text-2xl">{offensiveDetail ? "Offensive box score" : "Additional team statistics"}</h2>
      <p className="mt-2 text-sm leading-6 text-white/70">Source values are shown as reported. A dash means unreported, not zero. Rates and averages retain the source format.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{(["away", "home"] as const).map((side) => <section key={side} className="min-w-0 rounded-xl border border-white/10 bg-black/25 p-4">
        <h3 className="break-words text-lg font-black">{side === "away" ? awayTeamName : homeTeamName}</h3>
        <div className="mt-4 space-y-5">{stats.teamMetrics.map((metric) => {
          const display = presentTeamMetric(metric, side);
          return <div key={metric.label} className="border-t border-white/10 pt-3"><h4 className="mb-3 break-words text-sm font-bold text-white/85">{display.title}</h4><Values fields={display.fields} /></div>;
        })}</div>
      </section>)}</div>
    </section>

    {notes.highlights.length > 0 && <section className={panel}><h2 className="text-xl font-black">Standout performances</h2><ul className="mt-3 space-y-3 text-sm leading-6 text-white/80">{notes.highlights.map((note) => <li key={note}>{note}</li>)}</ul></section>}

    <section className={panel}>
      <h2 className="text-xl font-black sm:text-2xl">{offensiveDetail ? "Player box score" : "Special teams & defense"}</h2>
      <div className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">{stats.tables.map((table) => {
        const schoolSlugs = Array.from(new Set(table.rows.map((row) => row.schoolSlug)));
        const completeness = combineCategoryStates(schoolSlugs.map((schoolSlug) => table.completeness?.[schoolSlug] ?? { status: "unknown" }), table.rows.length > 0);
        return <section key={table.title} className="min-w-0 rounded-xl border border-white/10 bg-black/30">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 p-4"><h3 className="text-base font-black">{table.title}</h3><span className="[&>span]:text-xs [&>span]:text-white/80"><StatCompletenessBadge completeness={completeness} hasValues={table.rows.length > 0} compact /></span></div>
          <div className="divide-y divide-white/10">{table.rows.map((row) => <article key={`${table.title}-${row.schoolSlug}-${row.player}`} className="min-w-0 p-4">
            <h4 className="break-words text-base font-black leading-6">{row.player}</h4>
            <p className="mb-3 break-words text-sm leading-6 text-white/70">{getSchoolBySlug(row.schoolSlug)?.name ?? row.schoolSlug}</p>
            <Values fields={presentPlayerValues(table.title, table.headers, row.values)} />
          </article>)}</div>
        </section>;
      })}</div>
    </section>

    <section className={panel}>
      <h2 className="text-lg font-black">Sources & completeness</h2>
      <p className="mt-2 break-words text-sm leading-6 text-white/80">{stats.sourceLabel}</p>
      {stats.sourceUrl && <a href={stats.sourceUrl} className="mt-2 inline-block rounded text-sm text-white underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4">View original source</a>}
      {notes.source.length > 0 && <ul className="mt-3 space-y-3 text-sm leading-6 text-white/80">{notes.source.map((note) => <li key={note}>{note}</li>)}</ul>}
      {notes.technical.length > 0 && <details className="mt-4 rounded-xl border border-white/15 p-3"><summary className="cursor-pointer rounded text-sm font-bold leading-6 focus-visible:outline-2 focus-visible:outline-offset-4">Technical reconciliation details</summary><ul className="mt-3 space-y-3 text-sm leading-6 text-white/75">{notes.technical.map((note) => <li key={note}>{note}</li>)}</ul></details>}
    </section>
  </div>;
}
