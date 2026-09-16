import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getDistrictBySlug } from "@/lib/districts";
import { gameStats as allGameStats } from "@/lib/all-game-stats";
import { getPassingLeaders, getPlayerSeasonStats, getReceivingLeaders, getRushingLeaders } from "@/lib/player-stats";
import { getPlayerProfile } from "@/lib/player-profiles";
import { getSchoolBySlug } from "@/lib/schools";
import { formatTouchdownCount } from "@/lib/stat-values";

const SEASON = 2026;
type Props = { params: Promise<{ districtSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { districtSlug } = await params;
  const district = getDistrictBySlug(districtSlug);
  if (!district) return { title: "District Not Found | VarsityVue" };

  const hasIndexableStats = getPlayerSeasonStats(SEASON).some((player) => {
    if (player.gamesRecorded <= 0) return false;
    const school = getSchoolBySlug(player.schoolSlug);
    return school?.status === "pilot" && school.districtId === district.id;
  });

  const shouldIndex = district.status === "pilot" && hasIndexableStats;

  return {
    title: `${district.name} 2026 Stat Leaders | VarsityVue`,
    description: `${district.name} 2026 rushing, passing, receiving, and efficiency leaders based on verified game statistics currently available to VarsityVue.`,
    alternates: {
      canonical: `/stats/districts/${district.slug}`,
    },
    robots: shouldIndex
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

export default async function DistrictStatsPage({ params }: Props) {
  const { districtSlug } = await params;
  const district = getDistrictBySlug(districtSlug);
  if (!district) notFound();

  const districtPlayers = getPlayerSeasonStats(SEASON).filter((player) => getSchoolBySlug(player.schoolSlug)?.districtId === district.id);
  const representedSchools = new Set(districtPlayers.map((player) => player.schoolSlug));
  const gamesWithPlayerStats = allGameStats.filter((game) =>
    [...game.rushing, ...game.passing, ...game.receiving].some(
      (line) => getSchoolBySlug(line.schoolSlug)?.districtId === district.id
    )
  ).length;
  const rushing = getRushingLeaders({ season: SEASON, districtId: district.id, minAttempts: 1 }).slice(0, 25);
  const passing = getPassingLeaders({ season: SEASON, districtId: district.id, minAttempts: 1 }).slice(0, 25);
  const receiving = getReceivingLeaders({ season: SEASON, districtId: district.id, minReceptions: 1 }).slice(0, 25);
  const ypc = getRushingLeaders({ season: SEASON, districtId: district.id, minAttempts: 5, sortBy: "yardsPerCarry" }).slice(0, 25);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.38),transparent_34%),linear-gradient(120deg,#050505_0%,#090909_50%,#000_100%)] px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/stats" className="text-[10px] font-black uppercase tracking-[0.14em] text-white/45 transition hover:text-white sm:text-xs sm:tracking-[0.16em]">← All Stat Leaders</Link>
          <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-[#F4EBDD]/60 sm:mt-6 sm:text-xs sm:tracking-[0.28em]">2026 District View</p>
          <h1 className="mt-2 text-3xl font-black sm:mt-3 sm:text-5xl lg:text-6xl">{district.name}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55 sm:mt-4 sm:text-base sm:leading-7">These rankings show only players from {district.name} with verified game statistics currently on file in VarsityVue. They should not be read as a complete district-wide statistical leaderboard until every program is represented.</p>
          <div className="mt-4 grid max-w-2xl grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
            <SummaryStat value={representedSchools.size.toString()} label="Schools represented" />
            <SummaryStat value={districtPlayers.length.toString()} label="Players with stats" />
            <SummaryStat value={gamesWithPlayerStats.toString()} label="Games with player stats" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2 sm:mt-6 sm:gap-3">
            <a href="#rushing" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-black text-white/75 hover:bg-white/10 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">Rushing</a>
            <a href="#passing" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-black text-white/75 hover:bg-white/10 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">Passing</a>
            <a href="#receiving" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-black text-white/75 hover:bg-white/10 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">Receiving</a>
            <a href="#ypc" className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-black text-white/75 hover:bg-white/10 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">Yards / Carry</a>
            <Link href={`/districts/${district.slug}`} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] font-black text-white/60 hover:bg-white/10 hover:text-white sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm">District Hub →</Link>
          </div>
          <div className="mt-4 max-w-3xl rounded-xl border border-white/10 bg-black/30 p-3.5 sm:mt-6 sm:rounded-2xl sm:p-5">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/40 sm:text-[10px] sm:tracking-[0.2em]">Stat Availability</p>
            <p className="mt-1.5 text-xs leading-5 text-white/50 sm:mt-2 sm:text-sm sm:leading-6">VarsityVue adds statistics as verified data is received. Coverage can vary by program and game, so district leaders reflect only the verified statistics currently on file.</p>
            <Link href="/submit" className="mt-2.5 inline-flex text-[9px] font-black uppercase tracking-[0.12em] text-white/55 transition hover:text-white sm:mt-3 sm:text-[10px] sm:tracking-[0.14em]">Submit stats →</Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-5 sm:px-6 sm:py-8 lg:px-8"><div className="mx-auto max-w-7xl space-y-5 sm:space-y-8">
        <LeaderboardSection id="rushing" title="Rushing yards" note="Minimum 1 carry · Verified stats on file" headers={["RK", "Player", "School", "G", "CAR", "YDS", "TD", "YPC"]} rows={rushing.map((entry, index) => [index + 1, playerLink(entry.playerId, entry.player), schoolLink(entry.schoolSlug), entry.gamesRecorded, entry.rushing.attempts, entry.rushing.yards, formatTouchdownCount(entry.rushing.touchdowns), entry.rushing.yardsPerCarry])} />
        <LeaderboardSection id="passing" title="Passing yards" note="Minimum 1 attempt · Verified stats on file" headers={["RK", "Player", "School", "G", "CMP/ATT", "YDS", "TD", "INT", "CMP%"]} rows={passing.map((entry, index) => [index + 1, playerLink(entry.playerId, entry.player), schoolLink(entry.schoolSlug), entry.gamesRecorded, `${entry.passing.completions}/${entry.passing.attempts}`, entry.passing.yards, formatTouchdownCount(entry.passing.touchdowns), entry.passing.interceptions, `${entry.passing.completionPercentage}%`])} />
        <LeaderboardSection id="receiving" title="Receiving yards" note="Minimum 1 reception · Verified stats on file" headers={["RK", "Player", "School", "G", "REC", "YDS", "TD", "YPR"]} rows={receiving.map((entry, index) => [index + 1, playerLink(entry.playerId, entry.player), schoolLink(entry.schoolSlug), entry.gamesRecorded, entry.receiving.receptions, entry.receiving.yards, formatTouchdownCount(entry.receiving.touchdowns), entry.receiving.yardsPerReception])} />
        <LeaderboardSection id="ypc" title="Yards per carry" note="Minimum 5 carries · Verified stats on file" headers={["RK", "Player", "School", "G", "CAR", "YDS", "YPC"]} rows={ypc.map((entry, index) => [index + 1, playerLink(entry.playerId, entry.player), schoolLink(entry.schoolSlug), entry.gamesRecorded, entry.rushing.attempts, entry.rushing.yards, entry.rushing.yardsPerCarry])} />
      </div></section>
    </main>
  );
}

function SummaryStat({ value, label }: { value: string; label: string }) {
  return <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-3 sm:rounded-2xl sm:px-4 sm:py-4"><p className="text-xl font-black text-white sm:text-2xl">{value}</p><p className="mt-1 text-[8px] font-black uppercase tracking-[0.12em] text-white/35 sm:text-[10px] sm:tracking-[0.16em]">{label}</p></div>;
}
function playerLink(playerId: string, player: string) { const profile = getPlayerProfile(playerId, SEASON); return profile ? <Link href={`/players/${playerId}`} className="font-black text-white transition hover:text-white/70">{player}</Link> : <span className="font-black text-white">{player}</span>; }
function schoolLink(schoolSlug: string) { const school = getSchoolBySlug(schoolSlug); return school ? <Link href={`/schools/${schoolSlug}`} className="font-black text-white/75 transition hover:text-white">{school.name}</Link> : <span className="font-black text-white/75">{schoolSlug}</span>; }

function MobileRow({ row, headers, rowIndex }: { row: (string | number | ReactNode)[]; headers: string[]; rowIndex: number }) {
  return <div key={rowIndex} className="rounded-[1rem] border border-white/10 bg-black/30 p-3"><div className="flex items-start gap-2.5"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-black text-white/40">{row[0]}</div><div className="min-w-0 flex-1"><div className="text-sm font-black text-white">{row[1]}</div><div className="mt-0.5 text-[11px] font-bold text-white/50">{row[2]}</div></div></div><div className="mt-3 grid grid-cols-3 gap-1.5 border-t border-white/10 pt-3">{headers.slice(3).map((header, index) => <div key={header} className="rounded-lg bg-white/[0.035] px-2 py-2"><p className="text-[8px] font-black uppercase tracking-[0.1em] text-white/30">{header}</p><div className="mt-0.5 text-xs font-black text-white/75">{row[index + 3]}</div></div>)}</div></div>;
}

function LeaderboardSection({ id, title, note, headers, rows }: { id: string; title: string; note: string; headers: string[]; rows: (string | number | ReactNode)[][] }) {
  const mobilePreview = rows.slice(0, 5);
  const mobileRemainder = rows.slice(5);
  return <section id={id} className="scroll-mt-24 overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[0.045] shadow-2xl sm:rounded-[1.75rem]"><div className="h-1 bg-[#8B1020] sm:h-1.5" /><div className="p-4 sm:p-6 md:p-7"><div className="flex flex-wrap items-end justify-between gap-3 sm:gap-4"><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 sm:text-xs sm:tracking-[0.28em]">District View</p><h2 className="mt-1.5 text-2xl font-black sm:mt-2 sm:text-3xl">{title}</h2></div><p className="text-[9px] font-black uppercase tracking-[0.1em] text-white/30 sm:text-xs sm:tracking-[0.14em]">{note}</p></div>{rows.length ? <>
    <div className="mt-4 space-y-2.5 md:hidden">
      {mobilePreview.map((row, rowIndex) => <MobileRow key={rowIndex} row={row} headers={headers} rowIndex={rowIndex} />)}
      {mobileRemainder.length > 0 && <details className="group"><summary className="cursor-pointer list-none rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-center text-[10px] font-black uppercase tracking-[0.12em] text-white/65 transition hover:bg-white/10 [&::-webkit-details-marker]:hidden"><span className="group-open:hidden">View all {rows.length}</span><span className="hidden group-open:inline">Show less</span></summary><div className="mt-2.5 space-y-2.5">{mobileRemainder.map((row, index) => <MobileRow key={index + 5} row={row} headers={headers} rowIndex={index + 5} />)}</div></details>}
    </div>
    <div className="mt-6 hidden overflow-x-auto rounded-2xl border border-white/10 bg-black/30 md:block"><table className="w-full min-w-[760px] text-sm"><thead className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.12em] text-white/35"><tr>{headers.map((header) => <th key={header} className="px-4 py-3 text-left">{header}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-t border-white/5 first:border-0 transition hover:bg-white/[0.035]">{row.map((value, cellIndex) => <td key={cellIndex} className={`px-4 py-3 ${cellIndex === 0 ? "font-black text-white/35" : "text-white/75"}`}>{value}</td>)}</tr>)}</tbody></table></div>
  </> : <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/40 sm:mt-6 sm:rounded-2xl sm:p-6 sm:text-sm">No verified statistics are available for this category yet.</div>}</div></section>;
}
