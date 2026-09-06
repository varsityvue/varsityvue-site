import Link from "next/link";

import { getPassingLeaders, getReceivingLeaders, getRushingLeaders } from "@/lib/player-stats";
import { getPlayerProfile } from "@/lib/player-profiles";

type SchoolTeamLeadersProps = { schoolSlug: string; season?: number; primaryColor?: string; secondaryColor?: string; };
type Leader = { id: string; name: string; href?: string; primary: string; secondary: string };

export default function SchoolTeamLeaders({ schoolSlug, season = 2026, primaryColor = "#8B1020", secondaryColor = "#F4EBDD" }: SchoolTeamLeadersProps) {
  const rushing = getRushingLeaders({ season, schoolSlug, minAttempts: 1 }).slice(0, 3).map((entry) => ({ id: entry.playerId, name: entry.player, href: getPlayerProfile(entry.playerId, season) ? `/players/${entry.playerId}` : undefined, primary: `${entry.rushing.yards.toLocaleString()} YDS`, secondary: `${entry.rushing.attempts} CAR · ${entry.rushing.touchdowns} TD · ${entry.rushing.yardsPerCarry} YPC · ${entry.gamesRecorded} G` }));
  const passing = getPassingLeaders({ season, schoolSlug, minAttempts: 1 }).slice(0, 3).map((entry) => ({ id: entry.playerId, name: entry.player, href: getPlayerProfile(entry.playerId, season) ? `/players/${entry.playerId}` : undefined, primary: `${entry.passing.yards.toLocaleString()} YDS`, secondary: `${entry.passing.completions}/${entry.passing.attempts} · ${entry.passing.touchdowns} TD · ${entry.passing.interceptions} INT · ${entry.gamesRecorded} G` }));
  const receiving = getReceivingLeaders({ season, schoolSlug, minReceptions: 1 }).slice(0, 3).map((entry) => ({ id: entry.playerId, name: entry.player, href: getPlayerProfile(entry.playerId, season) ? `/players/${entry.playerId}` : undefined, primary: `${entry.receiving.yards.toLocaleString()} YDS`, secondary: `${entry.receiving.receptions} REC · ${entry.receiving.touchdowns} TD · ${entry.receiving.yardsPerReception} YPR · ${entry.gamesRecorded} G` }));
  if (!rushing.length && !passing.length && !receiving.length) return null;

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.5rem] border shadow-2xl sm:rounded-[1.75rem]" style={{ borderColor: `${primaryColor}55`, background: "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(0,0,0,0.94) 48%, rgba(0,0,0,1))", boxShadow: `inset 4px 0 0 ${primaryColor}, 0 18px 50px rgba(0,0,0,0.45)` }}>
      <div className="p-4 sm:p-6 md:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50 sm:text-xs sm:tracking-[0.28em]">{season} Offensive Leaders</p>
            <h2 className="mt-2 text-2xl font-black text-white sm:mt-3 sm:text-3xl">Players setting the pace</h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-white/45 sm:text-sm">Season totals from verified VarsityVue statistics.</p>
          </div>
          <Link href="/stats" className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/65 transition hover:bg-white/10 hover:text-white sm:inline-flex">All Stat Leaders →</Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <CategoryCard label="Rushing" leaders={rushing} primaryColor={primaryColor} secondaryColor={secondaryColor} />
          <CategoryCard label="Passing" leaders={passing} primaryColor={primaryColor} secondaryColor={secondaryColor} />
          <CategoryCard label="Receiving" leaders={receiving} primaryColor={primaryColor} secondaryColor={secondaryColor} />
        </div>
        <Link href="/stats" className="mt-4 inline-flex text-xs font-black uppercase tracking-[0.12em] text-white/55 sm:hidden">All stat leaders →</Link>
      </div>
    </section>
  );
}

function CategoryCard({ label, leaders, primaryColor, secondaryColor }: { label: string; leaders: Leader[]; primaryColor: string; secondaryColor: string }) {
  if (!leaders.length) return null;
  const [leader, ...others] = leaders;
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <div className="relative overflow-hidden border-b border-white/10 p-5" style={{ background: `radial-gradient(circle at 100% 0%, ${primaryColor}35, transparent 55%), linear-gradient(135deg, rgba(255,255,255,.055), rgba(0,0,0,.82))` }}>
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }} />
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">{label} leader</p>
        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-white/30">No. 1</p>
            {leader.href ? <Link href={leader.href} className="mt-1 block text-xl font-black leading-tight text-white transition hover:text-white/75 sm:text-2xl">{leader.name}</Link> : <p className="mt-1 text-xl font-black leading-tight text-white sm:text-2xl">{leader.name}</p>}
          </div>
          <p className="shrink-0 text-right text-2xl font-black tracking-tight text-white sm:text-3xl">{leader.primary}</p>
        </div>
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.06em] text-white/45">{leader.secondary}</p>
      </div>
      {others.length > 0 && <div className="divide-y divide-white/[0.07]">{others.map((player, index) => (
        <div key={player.id} className="grid grid-cols-[1.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.03]">
          <span className="text-sm font-black text-white/25">{index + 2}</span>
          <div className="min-w-0">
            {player.href ? <Link href={player.href} className="block truncate text-sm font-black text-white/85 hover:text-white">{player.name}</Link> : <p className="truncate text-sm font-black text-white/85">{player.name}</p>}
            <p className="mt-0.5 truncate text-[10px] text-white/35">{player.secondary}</p>
          </div>
          <span className="whitespace-nowrap text-xs font-black text-white/60">{player.primary}</span>
        </div>
      ))}</div>}
    </div>
  );
}
