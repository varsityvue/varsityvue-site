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
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/45 sm:text-xs sm:tracking-[0.28em]">{season} Offensive Leaders</p>
            <h2 className="mt-1.5 text-2xl font-black text-white sm:mt-3 sm:text-3xl">Team Leaders</h2>
          </div>
          <p className="hidden text-xs text-white/35 sm:block">Verified VarsityVue stats</p>
        </div>

        <div className="mt-4 grid gap-3 sm:mt-5 sm:gap-4 lg:grid-cols-3">
          <CategoryCard label="Rushing" leaders={rushing} primaryColor={primaryColor} secondaryColor={secondaryColor} />
          <CategoryCard label="Passing" leaders={passing} primaryColor={primaryColor} secondaryColor={secondaryColor} />
          <CategoryCard label="Receiving" leaders={receiving} primaryColor={primaryColor} secondaryColor={secondaryColor} />
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ label, leaders, primaryColor, secondaryColor }: { label: string; leaders: Leader[]; primaryColor: string; secondaryColor: string }) {
  if (!leaders.length) return null;
  const [leader, ...others] = leaders;
  return (
    <div className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-black/40 sm:rounded-2xl">
      <div className="relative overflow-hidden border-b border-white/10 p-4 sm:p-5" style={{ background: `radial-gradient(circle at 100% 0%, ${primaryColor}35, transparent 55%), linear-gradient(135deg, rgba(255,255,255,.055), rgba(0,0,0,.82))` }}>
        <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})` }} />
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45 sm:text-[10px] sm:tracking-[0.22em]">{label}</p>
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/25">Leader</p>
        </div>
        <div className="mt-2.5 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:mt-4 sm:gap-4">
          <div className="min-w-0">
            {leader.href ? <Link href={leader.href} className="block break-words text-lg font-black leading-tight text-white transition hover:text-white/75 sm:text-2xl">{leader.name}</Link> : <p className="break-words text-lg font-black leading-tight text-white sm:text-2xl">{leader.name}</p>}
          </div>
          <p className="shrink-0 text-right text-xl font-black tracking-tight text-white sm:text-3xl">{leader.primary}</p>
        </div>
        <p className="mt-2 text-[9px] font-bold uppercase leading-4 tracking-[0.04em] text-white/40 sm:mt-3 sm:text-[11px] sm:tracking-[0.06em]">{leader.secondary}</p>
      </div>
      {others.length > 0 && <div className="divide-y divide-white/[0.07]">{others.map((player, index) => (
        <div key={player.id} className="grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-center gap-2.5 px-3.5 py-2.5 transition hover:bg-white/[0.03] sm:grid-cols-[1.5rem_minmax(0,1fr)_auto] sm:gap-3 sm:px-4 sm:py-3.5">
          <span className="text-xs font-black text-white/25 sm:text-sm">{index + 2}</span>
          <div className="min-w-0">
            {player.href ? <Link href={player.href} className="block break-words text-xs font-black leading-4 text-white/85 hover:text-white sm:text-sm">{player.name}</Link> : <p className="break-words text-xs font-black leading-4 text-white/85 sm:text-sm">{player.name}</p>}
            <p className="mt-0.5 hidden truncate text-[10px] text-white/35 sm:block">{player.secondary}</p>
          </div>
          <span className="whitespace-nowrap text-[11px] font-black text-white/60 sm:text-xs">{player.primary}</span>
        </div>
      ))}</div>}
    </div>
  );
}
