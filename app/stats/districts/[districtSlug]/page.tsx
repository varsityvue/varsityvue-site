import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getDistrictBySlug } from "@/lib/districts";
import { getPassingLeaders, getPlayerSeasonStats, getReceivingLeaders, getRushingLeaders } from "@/lib/player-stats";
import { getPlayerProfile } from "@/lib/player-profiles";
import { getSchoolBySlug } from "@/lib/schools";

const SEASON = 2026;
type Props = { params: Promise<{ districtSlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { districtSlug } = await params;
  const district = getDistrictBySlug(districtSlug);
  if (!district) return { title: "District Not Found | VarsityVue" };
  return {
    title: `${district.name} 2026 Stat Leaders | VarsityVue`,
    description: `${district.name} 2026 rushing, passing, receiving, and efficiency leaders based on verified game statistics currently available to VarsityVue.`,
  };
}

export default async function DistrictStatsPage({ params }: Props) {
  const { districtSlug } = await params;
  const district = getDistrictBySlug(districtSlug);
  if (!district) notFound();

  const districtPlayers = getPlayerSeasonStats(SEASON).filter((player) => getSchoolBySlug(player.schoolSlug)?.districtId === district.id);
  const representedSchools = new Set(districtPlayers.map((player) => player.schoolSlug));
  const rushing = getRushingLeaders({ season: SEASON, districtId: district.id, minAttempts: 1 }).slice(0, 25);
  const passing = getPassingLeaders({ season: SEASON, districtId: district.id, minAttempts: 1 }).slice(0, 25);
  const receiving = getReceivingLeaders({ season: SEASON, districtId: district.id, minReceptions: 1 }).slice(0, 25);
  const ypc = getRushingLeaders({ season: SEASON, districtId: district.id, minAttempts: 5, sortBy: "yardsPerCarry" }).slice(0, 25);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.38),transparent_34%),linear-gradient(120deg,#050505_0%,#090909_50%,#000_100%)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/stats" className="text-xs font-black uppercase tracking-[0.16em] text-white/45 transition hover:text-white">← All Stat Leaders</Link>
          <p className="mt-6 text-xs font-black uppercase tracking-[0.28em] text-[#F4EBDD]/60">2026 District View</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl lg:text-6xl">{district.name}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/55">These rankings show only players from {district.name} with verified game statistics currently on file in VarsityVue. They should not be read as a complete district-wide statistical leaderboard until every program is represented.</p>
          <div className="mt-6 grid max-w-lg gap-3 sm:grid-cols-2">
            <SummaryStat value={representedSchools.size.toString()} label="District schools represented" />
            <SummaryStat value={districtPlayers.length.toString()} label="Players with stats" />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#rushing" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/75 hover:bg-white/10">Rushing</a>
            <a href="#passing" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/75 hover:bg-white/10">Passing</a>
            <a href="#receiving" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/75 hover:bg-white/10">Receiving</a>
            <a href="#ypc" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/75 hover:bg-white/10">Yards / Carry</a>
            <Link href={`/districts/${district.slug}`} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-black text-white/60 hover:bg-white/10 hover:text-white">District Hub →</Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-8">
        <LeaderboardSection id="rushing" title="Rushing yards" note="Minimum 1 carry · Verified stats on file" headers={["RK", "Player", "School", "G", "CAR", "YDS", "TD", "YPC"]} rows={rushing.map((entry, index) => [index + 1, playerLink(entry.playerId, entry.player), schoolLink(entry.schoolSlug), entry.gamesRecorded, entry.rushing.attempts, entry.rushing.yards, entry.rushing.touchdowns, entry.rushing.yardsPerCarry])} />
        <LeaderboardSection id="passing" title="Passing yards" note="Minimum 1 attempt · Verified stats on file" headers={["RK", "Player", "School", "G", "CMP/ATT", "YDS", "TD", "INT", "CMP%"]} rows={passing.map((entry, index) => [index + 1, playerLink(entry.playerId, entry.player), schoolLink(entry.schoolSlug), entry.gamesRecorded, `${entry.passing.completions}/${entry.passing.attempts}`, entry.passing.yards, entry.passing.touchdowns, entry.passing.interceptions, `${entry.passing.completionPercentage}%`])} />
        <LeaderboardSection id="receiving" title="Receiving yards" note="Minimum 1 reception · Verified stats on file" headers={["RK", "Player", "School", "G", "REC", "YDS", "TD", "YPR"]} rows={receiving.map((entry, index) => [index + 1, playerLink(entry.playerId, entry.player), schoolLink(entry.schoolSlug), entry.gamesRecorded, entry.receiving.receptions, entry.receiving.yards, entry.receiving.touchdowns, entry.receiving.yardsPerReception])} />
        <LeaderboardSection id="ypc" title="Yards per carry" note="Minimum 5 carries · Verified stats on file" headers={["RK", "Player", "School", "G", "CAR", "YDS", "YPC"]} rows={ypc.map((entry, index) => [index + 1, playerLink(entry.playerId, entry.player), schoolLink(entry.schoolSlug), entry.gamesRecorded, entry.rushing.attempts, entry.rushing.yards, entry.rushing.yardsPerCarry])} />
      </div></section>
    </main>
  );
}

function SummaryStat({ value, label }: { value: string; label: string }) { return <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4"><p className="text-2xl font-black text-white">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">{label}</p></div>; }
function playerLink(playerId: string, player: string) { const profile = getPlayerProfile(playerId, SEASON); return profile ? <Link href={`/players/${playerId}`} className="font-black text-white transition hover:text-white/70">{player}</Link> : <span className="font-black text-white">{player}</span>; }
function schoolLink(schoolSlug: string) { const school = getSchoolBySlug(schoolSlug); return school ? <Link href={`/schools/${schoolSlug}`} className="font-black text-white/75 transition hover:text-white">{school.name}</Link> : <span className="font-black text-white/75">{schoolSlug}</span>; }

function LeaderboardSection({ id, title, note, headers, rows }: { id: string; title: string; note: string; headers: string[]; rows: (string | number | ReactNode)[][] }) {
  return <section id={id} className="scroll-mt-24 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] shadow-2xl"><div className="h-1.5 bg-[#8B1020]" /><div className="p-6 md:p-7"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.28em] text-white/40">District View</p><h2 className="mt-2 text-3xl font-black">{title}</h2></div><p className="text-xs font-black uppercase tracking-[0.14em] text-white/30">{note}</p></div>{rows.length ? <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-black/30"><table className="w-full min-w-[760px] text-sm"><thead className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.12em] text-white/35"><tr>{headers.map((header) => <th key={header} className="px-4 py-3 text-left">{header}</th>)}</tr></thead><tbody>{rows.map((row, rowIndex) => <tr key={rowIndex} className="border-t border-white/5 first:border-0 transition hover:bg-white/[0.035]">{row.map((value, cellIndex) => <td key={cellIndex} className={`px-4 py-3 ${cellIndex === 0 ? "font-black text-white/35" : "text-white/75"}`}>{value}</td>)}</tr>)}</tbody></table></div> : <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/40">No verified statistics are available for this category yet.</div>}</div></section>;
}
