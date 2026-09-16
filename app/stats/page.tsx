import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { gameStats } from "@/lib/all-game-stats";
import { getDistricts } from "@/lib/districts";
import { getPassingLeaders, getPlayerSeasonStats, getReceivingLeaders, getRushingLeaders } from "@/lib/player-stats";
import { getPlayerProfile } from "@/lib/player-profiles";
import { getSchoolBySlug } from "@/lib/schools";
import { formatTouchdownCount } from "@/lib/stat-values";
import { isDefinitiveRanking } from "@/lib/stat-completeness";
import StatCompletenessBadge from "@/components/StatCompletenessBadge";

export const metadata: Metadata = {
  title: "2026 Football Stat Leaders | VarsityVue",
  description: "VarsityVue 2026 football rushing, passing, and receiving leaders based on verified game statistics currently available.",
  alternates: { canonical: "/stats" },
};

const SEASON = 2026;

export default function StatsPage() {
  const allPlayers = getPlayerSeasonStats(SEASON);
  const rushing = getRushingLeaders({ season: SEASON, minAttempts: 1 }).slice(0, 25);
  const passing = getPassingLeaders({ season: SEASON, minAttempts: 1 }).slice(0, 25);
  const receiving = getReceivingLeaders({ season: SEASON, minReceptions: 1 }).slice(0, 25);
  const ypc = getRushingLeaders({ season: SEASON, minAttempts: 5, sortBy: "yardsPerCarry" }).slice(0, 25);
  const rushingRanks = isDefinitiveRanking(rushing);
  const passingRanks = isDefinitiveRanking(passing);
  const receivingRanks = isDefinitiveRanking(receiving);
  const ypcRanks = isDefinitiveRanking(ypc);
  const representedSchools = new Set(allPlayers.map((player) => player.schoolSlug));
  const gamesWithPlayerStats = gameStats.filter(
    (game) => game.season === SEASON && (game.rushing.length > 0 || game.passing.length > 0 || game.receiving.length > 0)
  ).length;
  const districtIdsWithStats = new Set(allPlayers.map((player) => getSchoolBySlug(player.schoolSlug)?.districtId).filter((districtId): districtId is string => Boolean(districtId)));
  const districtsWithStats = getDistricts().filter((district) => districtIdsWithStats.has(district.id));

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.38),transparent_34%),linear-gradient(120deg,#050505_0%,#090909_50%,#000_100%)] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F4EBDD]/60 sm:text-xs sm:tracking-[0.28em]">2026 Football</p>
          <h1 className="mt-2 text-3xl font-black sm:mt-3 sm:text-5xl lg:text-6xl">Stat Leaders</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55 sm:mt-4 sm:text-base sm:leading-7">A running look at top performances from the verified game statistics currently available to VarsityVue. These rankings reflect only games and schools with stats on file, not every player or program in the coverage area.</p>
          <div className="mt-4 grid max-w-2xl grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
            <SummaryStat value={representedSchools.size.toString()} label="Schools represented" />
            <SummaryStat value={allPlayers.length.toString()} label="Players with stats" />
            <SummaryStat value={gamesWithPlayerStats.toString()} label="Games with stats" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
            <a href="#rushing" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black text-white/75 hover:bg-white/10 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">Rushing</a>
            <a href="#passing" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black text-white/75 hover:bg-white/10 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">Passing</a>
            <a href="#receiving" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black text-white/75 hover:bg-white/10 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">Receiving</a>
            <a href="#ypc" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-black text-white/75 hover:bg-white/10 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">Yards / Carry</a>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3.5 sm:rounded-2xl sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-4xl">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40 sm:text-[10px] sm:tracking-[0.2em]">Stat Availability</p>
                <p className="mt-1.5 text-xs leading-5 text-white/50 sm:text-sm sm:leading-6">Statistics are added as verified data is received. Availability can vary by program and by game, so leaderboards may not represent every school equally at a given time.</p>
              </div>
              <Link href="/submit" className="shrink-0 text-[9px] font-black uppercase tracking-[0.1em] text-white/55 transition hover:text-white sm:text-xs sm:tracking-[0.14em]">Submit stats →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 px-4 py-4 sm:px-6 sm:py-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4"><div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/35 sm:text-xs sm:tracking-[0.22em]">District Views</p><p className="mt-1.5 text-xs text-white/50 sm:mt-2 sm:text-sm">Compare available verified leaders within a specific UIL district.</p></div><div className="flex flex-wrap gap-1.5 sm:gap-2">{districtsWithStats.length > 0 ? districtsWithStats.map((district) => <Link key={district.id} href={`/stats/districts/${district.slug}`} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[9px] font-black uppercase tracking-[0.1em] text-white/65 transition hover:bg-white/10 hover:text-white sm:rounded-xl sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.12em]">{district.name}</Link>) : <span className="text-xs text-white/35 sm:text-sm">District views will appear as verified stats are added.</span>}</div></div></div></section>

      <section className="px-4 py-5 sm:px-6 sm:py-8 lg:px-8"><div className="mx-auto max-w-7xl space-y-5 sm:space-y-8">
        <LeaderboardSection id="rushing" eyebrow="Rushing Leaders" title="Rushing yards" note="Minimum 1 carry · Ordered by verified values on file" headers={["RK", "Player", "School", "G", "CAR", "YDS", "TD", "YPC", "Coverage"]} rows={rushing.map((entry, index) => [rushingRanks ? index + 1 : "—", playerLink(entry.playerId, entry.player), schoolLink(entry.schoolSlug), entry.gamesRecorded, entry.rushing.attempts, entry.rushing.yards, formatTouchdownCount(entry.rushing.touchdowns), entry.rushing.yardsPerCarry, <StatCompletenessBadge key="coverage" completeness={entry.completeness} compact />])} />
        <LeaderboardSection id="passing" eyebrow="Passing Leaders" title="Passing yards" note="Minimum 1 attempt · Ordered by verified values on file" headers={["RK", "Player", "School", "G", "CMP/ATT", "YDS", "TD", "INT", "CMP%", "Coverage"]} rows={passing.map((entry, index) => [passingRanks ? index + 1 : "—", playerLink(entry.playerId, entry.player), schoolLink(entry.schoolSlug), entry.gamesRecorded, `${entry.passing.completions}/${entry.passing.attempts}`, entry.passing.yards, formatTouchdownCount(entry.passing.touchdowns), entry.passing.interceptions, `${entry.passing.completionPercentage}%`, <StatCompletenessBadge key="coverage" completeness={entry.completeness} compact />])} />
        <LeaderboardSection id="receiving" eyebrow="Receiving Leaders" title="Receiving yards" note="Minimum 1 reception · Ordered by verified values on file" headers={["RK", "Player", "School", "G", "REC", "YDS", "TD", "YPR", "Coverage"]} rows={receiving.map((entry, index) => [receivingRanks ? index + 1 : "—", playerLink(entry.playerId, entry.player), schoolLink(entry.schoolSlug), entry.gamesRecorded, entry.receiving.receptions, entry.receiving.yards, formatTouchdownCount(entry.receiving.touchdowns), entry.receiving.yardsPerReception, <StatCompletenessBadge key="coverage" completeness={entry.completeness} compact />])} />
        <LeaderboardSection id="ypc" eyebrow="Efficiency Leaders" title="Yards per carry" note="Minimum 5 carries · Ordered by verified values on file" headers={["RK", "Player", "School", "G", "CAR", "YDS", "YPC", "Coverage"]} rows={ypc.map((entry, index) => [ypcRanks ? index + 1 : "—", playerLink(entry.playerId, entry.player), schoolLink(entry.schoolSlug), entry.gamesRecorded, entry.rushing.attempts, entry.rushing.yards, entry.rushing.yardsPerCarry, <StatCompletenessBadge key="coverage" completeness={entry.completeness} compact />])} />
      </div></section>
    </main>
  );
}

function SummaryStat({ value, label }: { value: string; label: string }) { return <div className="min-w-0 rounded-xl border border-white/10 bg-black/30 px-2.5 py-3 sm:rounded-2xl sm:px-4 sm:py-4"><p className="text-xl font-black text-white sm:text-2xl">{value}</p><p className="mt-1 break-words text-[8px] font-black uppercase leading-3 tracking-[0.1em] text-white/35 sm:text-[10px] sm:tracking-[0.16em]">{label}</p></div>; }
function playerLink(playerId: string, player: string) { const profile = getPlayerProfile(playerId, SEASON); return profile ? <Link href={`/players/${playerId}`} className="font-black text-white transition hover:text-white/70">{player}</Link> : <span className="font-black text-white">{player}</span>; }
function schoolLink(schoolSlug: string) { const school = getSchoolBySlug(schoolSlug); return school ? <Link href={`/schools/${schoolSlug}`} className="font-black text-white/75 transition hover:text-white">{school.name}</Link> : <span className="font-black text-white/75">{schoolSlug.replace(/-/g, " ")}</span>; }

function MobileRow({ row, headers, rowIndex }: { row: (string | number | ReactNode)[]; headers: string[]; rowIndex: number }) {
  return <div key={rowIndex} className="rounded-[1.1rem] border border-white/10 bg-black/30 p-3 sm:rounded-2xl sm:p-4"><div className="flex items-start gap-2.5 sm:gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-black text-white/40 sm:h-9 sm:w-9 sm:rounded-xl sm:text-sm">{row[0]}</div><div className="min-w-0 flex-1"><div className="text-sm font-black text-white sm:text-base">{row[1]}</div><div className="mt-0.5 text-[10px] font-bold text-white/50 sm:mt-1 sm:text-xs">{row[2]}</div></div></div><div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-white/10 pt-3 sm:mt-4 sm:grid-cols-2 sm:gap-2 sm:pt-4">{headers.slice(3).map((header, index) => <div key={header} className="min-w-0 rounded-lg bg-white/[0.035] px-2.5 py-2 sm:rounded-xl sm:px-3 sm:py-2.5"><p className="truncate text-[8px] font-black uppercase tracking-[0.1em] text-white/30 sm:text-[9px] sm:tracking-[0.14em]">{header}</p><div className="mt-0.5 truncate text-xs font-black text-white/75 sm:mt-1 sm:text-sm">{row[index + 3]}</div></div>)}</div></div>;
}

function LeaderboardSection({ id, eyebrow, title, note, headers, rows }: { id: string; eyebrow: string; title: string; note: string; headers: string[]; rows: (string | number | ReactNode)[][] }) {
  const mobilePreview = rows.slice(0, 5);
  const mobileRemainder = rows.slice(5);
  return <section id={id} className="scroll-mt-24 overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.045] shadow-2xl sm:rounded-[1.75rem]"><div className="h-1 bg-[#8B1020] sm:h-1.5" /><div className="p-4 sm:p-6 md:p-7"><div className="flex flex-wrap items-end justify-between gap-2.5 sm:gap-4"><div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 sm:text-xs sm:tracking-[0.28em]">{eyebrow}</p><h2 className="mt-1.5 text-2xl font-black sm:mt-2 sm:text-3xl">{title}</h2></div><p className="w-full text-[9px] font-black uppercase tracking-[0.1em] text-white/30 sm:w-auto sm:text-xs sm:tracking-[0.14em]">{note}</p></div><p className="mt-2 text-[10px] leading-4 text-white/35 sm:text-xs sm:leading-5">Ordinal ranks are shown only when every listed total is explicitly complete. Partial and unclassified totals remain visible and ordered without claiming a definitive rank.</p>
    {rows.length ? <>
      <div className="mt-4 space-y-2.5 md:hidden sm:mt-6 sm:space-y-3">
        {mobilePreview.map((row, rowIndex) => <MobileRow key={rowIndex} row={row} headers={headers} rowIndex={rowIndex} />)}
        {mobileRemainder.length > 0 && <details className="group"><summary className="cursor-pointer list-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-[0.12em] text-white/65 transition hover:bg-white/10 sm:rounded-xl sm:px-4 sm:py-3 sm:text-xs sm:tracking-[0.14em] [&::-webkit-details-marker]:hidden"><span className="group-open:hidden">View all {rows.length}</span><span className="hidden group-open:inline">Show less</span></summary><div className="mt-2.5 space-y-2.5 sm:mt-3 sm:space-y-3">{mobileRemainder.map((row, index) => <MobileRow key={index + 5} row={row} headers={headers} rowIndex={index + 5} />)}</div></details>}
      </div>
      <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-white/10 bg-black/30 md:block"><table className="w-full min-w-[760px] text-sm"><thead className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.12em] text-white/35"><tr>{headers.map((header) => <th key={header} className="px-4 py-3 text-left">{header}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-t border-white/5 first:border-0 transition hover:bg-white/[0.035]">{row.map((value, cellIndex) => <td key={cellIndex} className={`px-4 py-3 ${cellIndex === 0 ? "font-black text-white/35" : "text-white/75"}`}>{value}</td>)}</tr>)}</tbody></table></div>
    </> : <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/40 sm:mt-6 sm:rounded-2xl sm:p-6 sm:text-sm">No verified statistics are available for this category yet.</div>}
  </div></section>;
}
