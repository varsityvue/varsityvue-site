import Link from "next/link";

import { getPassingLeaders, getReceivingLeaders, getRushingLeaders } from "@/lib/player-stats";
import { getPlayerProfile } from "@/lib/player-profiles";

type SchoolTeamLeadersProps = { schoolSlug: string; season?: number; primaryColor?: string; secondaryColor?: string; };

export default function SchoolTeamLeaders({ schoolSlug, season = 2026, primaryColor = "#8B1020", secondaryColor = "#F4EBDD" }: SchoolTeamLeadersProps) {
  const rushing = getRushingLeaders({ season, schoolSlug, minAttempts: 1 }).slice(0, 3);
  const passing = getPassingLeaders({ season, schoolSlug, minAttempts: 1 }).slice(0, 3);
  const receiving = getReceivingLeaders({ season, schoolSlug, minReceptions: 1 }).slice(0, 3);
  if (!rushing.length && !passing.length && !receiving.length) return null;

  return (
    <section className="min-w-0 overflow-hidden rounded-[1.5rem] border shadow-2xl sm:rounded-[1.75rem]" style={{ borderColor: `${primaryColor}55`, background: "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(0,0,0,0.94) 48%, rgba(0,0,0,1))", boxShadow: `inset 4px 0 0 ${primaryColor}, 0 18px 50px rgba(0,0,0,0.45)` }}>
      <div className="min-w-0 p-4 sm:p-6 md:p-7">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] sm:text-xs sm:tracking-[0.28em]" style={{ color: secondaryColor }}>{season} Team Leaders</p>
            <h2 className="mt-2 text-2xl font-black text-white sm:mt-3 sm:text-3xl">Verified stat leaders</h2>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-white/45 sm:text-sm sm:leading-6">Season totals from verified VarsityVue game statistics.</p>
          </div>
          <Link href="/stats" className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/65 transition hover:bg-white/10 hover:text-white sm:inline-flex">View Stat Leaders →</Link>
        </div>
        <div className="mt-4 grid min-w-0 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-3">
          <LeaderCard title="Rushing" leaders={rushing.map((entry) => ({ id: entry.playerId, name: entry.player, href: getPlayerProfile(entry.playerId, season) ? `/players/${entry.playerId}` : undefined, primary: `${entry.rushing.yards.toLocaleString()} yds`, secondary: `${entry.rushing.attempts} car · ${entry.rushing.touchdowns} TD · ${entry.rushing.yardsPerCarry} YPC · ${entry.gamesRecorded} G` }))} />
          <LeaderCard title="Passing" leaders={passing.map((entry) => ({ id: entry.playerId, name: entry.player, href: getPlayerProfile(entry.playerId, season) ? `/players/${entry.playerId}` : undefined, primary: `${entry.passing.yards.toLocaleString()} yds`, secondary: `${entry.passing.completions}/${entry.passing.attempts} · ${entry.passing.touchdowns} TD · ${entry.passing.interceptions} INT · ${entry.gamesRecorded} G` }))} />
          <LeaderCard title="Receiving" leaders={receiving.map((entry) => ({ id: entry.playerId, name: entry.player, href: getPlayerProfile(entry.playerId, season) ? `/players/${entry.playerId}` : undefined, primary: `${entry.receiving.yards.toLocaleString()} yds`, secondary: `${entry.receiving.receptions} rec · ${entry.receiving.touchdowns} TD · ${entry.receiving.yardsPerReception} YPR · ${entry.gamesRecorded} G` }))} />
        </div>
        <Link href="/stats" className="mt-4 inline-flex text-xs font-black uppercase tracking-[0.12em] text-white/55 sm:hidden">All stat leaders →</Link>
      </div>
    </section>
  );
}

function LeaderCard({ title, leaders }: { title: string; leaders: { id: string; name: string; href?: string; primary: string; secondary: string }[] }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/35">
      <div className="border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/70 sm:text-sm">{title}</div>
      {leaders.length ? <div className="divide-y divide-white/5">{leaders.map((leader, index) => (
        <div key={leader.id} className="grid min-w-0 grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-3 px-4 py-3.5 transition hover:bg-white/[0.03] sm:grid-cols-[2rem_minmax(0,1fr)_auto] sm:py-4">
          <span className="text-base font-black text-white/25 sm:text-lg">{index + 1}</span>
          <div className="min-w-0">
            {leader.href ? <Link href={leader.href} className="block truncate font-black text-white transition hover:text-white/70">{leader.name}</Link> : <p className="truncate font-black text-white">{leader.name}</p>}
            <p className="mt-1 truncate text-[11px] text-white/40 sm:text-xs">{leader.secondary}</p>
          </div>
          <span className="hidden whitespace-nowrap text-right text-sm font-black text-white/80 sm:block">{leader.primary}</span>
        </div>
      ))}</div> : <p className="px-4 py-6 text-sm text-white/35">No verified statistics are on file for this category yet.</p>}
    </div>
  );
}
