import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import {
  getPassingLeaders,
  getReceivingLeaders,
  getRushingLeaders,
} from "@/lib/player-stats";
import { getSchoolBySlug } from "@/lib/schools";

export const metadata: Metadata = {
  title: "2026 Football Stat Leaders | VarsityVue",
  description:
    "VarsityVue 2026 football rushing, passing, and receiving leaders built from verified game statistics.",
};

const SEASON = 2026;

export default function StatsPage() {
  const rushing = getRushingLeaders({ season: SEASON, minAttempts: 1 }).slice(0, 25);
  const passing = getPassingLeaders({ season: SEASON, minAttempts: 1 }).slice(0, 25);
  const receiving = getReceivingLeaders({ season: SEASON, minReceptions: 1 }).slice(0, 25);
  const ypc = getRushingLeaders({
    season: SEASON,
    minAttempts: 5,
    sortBy: "yardsPerCarry",
  }).slice(0, 25);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(139,16,32,0.38),transparent_34%),linear-gradient(120deg,#050505_0%,#090909_50%,#000_100%)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#F4EBDD]/60">
            2026 Football
          </p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl lg:text-6xl">Stat Leaders</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-white/55">
            Season totals are calculated from verified game statistics currently loaded into VarsityVue. Rankings will become more complete as additional schools and weeks are added.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#rushing" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/75 hover:bg-white/10">Rushing</a>
            <a href="#passing" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/75 hover:bg-white/10">Passing</a>
            <a href="#receiving" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/75 hover:bg-white/10">Receiving</a>
            <a href="#ypc" className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-white/75 hover:bg-white/10">Yards / Carry</a>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <LeaderboardSection
            id="rushing"
            eyebrow="Rushing Leaders"
            title="Rushing yards"
            note="Minimum 1 carry"
            headers={["RK", "Player", "School", "G", "CAR", "YDS", "TD", "YPC"]}
            rows={rushing.map((entry, index) => [
              index + 1,
              entry.player,
              schoolLink(entry.schoolSlug),
              entry.gamesRecorded,
              entry.rushing.attempts,
              entry.rushing.yards,
              entry.rushing.touchdowns,
              entry.rushing.yardsPerCarry,
            ])}
          />

          <LeaderboardSection
            id="passing"
            eyebrow="Passing Leaders"
            title="Passing yards"
            note="Minimum 1 attempt"
            headers={["RK", "Player", "School", "G", "CMP/ATT", "YDS", "TD", "INT", "CMP%"]}
            rows={passing.map((entry, index) => [
              index + 1,
              entry.player,
              schoolLink(entry.schoolSlug),
              entry.gamesRecorded,
              `${entry.passing.completions}/${entry.passing.attempts}`,
              entry.passing.yards,
              entry.passing.touchdowns,
              entry.passing.interceptions,
              `${entry.passing.completionPercentage}%`,
            ])}
          />

          <LeaderboardSection
            id="receiving"
            eyebrow="Receiving Leaders"
            title="Receiving yards"
            note="Minimum 1 reception"
            headers={["RK", "Player", "School", "G", "REC", "YDS", "TD", "YPR"]}
            rows={receiving.map((entry, index) => [
              index + 1,
              entry.player,
              schoolLink(entry.schoolSlug),
              entry.gamesRecorded,
              entry.receiving.receptions,
              entry.receiving.yards,
              entry.receiving.touchdowns,
              entry.receiving.yardsPerReception,
            ])}
          />

          <LeaderboardSection
            id="ypc"
            eyebrow="Efficiency Leaders"
            title="Yards per carry"
            note="Minimum 5 carries"
            headers={["RK", "Player", "School", "G", "CAR", "YDS", "YPC"]}
            rows={ypc.map((entry, index) => [
              index + 1,
              entry.player,
              schoolLink(entry.schoolSlug),
              entry.gamesRecorded,
              entry.rushing.attempts,
              entry.rushing.yards,
              entry.rushing.yardsPerCarry,
            ])}
          />
        </div>
      </section>
    </main>
  );
}

function schoolLink(schoolSlug: string) {
  const school = getSchoolBySlug(schoolSlug);
  return (
    <Link href={`/schools/${schoolSlug}`} className="font-black text-white/75 transition hover:text-white">
      {school?.name ?? schoolSlug}
    </Link>
  );
}

function LeaderboardSection({
  id,
  eyebrow,
  title,
  note,
  headers,
  rows,
}: {
  id: string;
  eyebrow: string;
  title: string;
  note: string;
  headers: string[];
  rows: (string | number | ReactNode)[][];
}) {
  return (
    <section id={id} className="scroll-mt-24 overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] shadow-2xl">
      <div className="h-1.5 bg-[#8B1020]" />
      <div className="p-6 md:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/40">{eyebrow}</p>
            <h2 className="mt-2 text-3xl font-black">{title}</h2>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-white/30">{note}</p>
        </div>

        {rows.length ? (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-black/30">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-white/10 text-[10px] font-black uppercase tracking-[0.12em] text-white/35">
                <tr>
                  {headers.map((header) => (
                    <th key={header} className="px-4 py-3 text-left">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-t border-white/5 first:border-0">
                    {row.map((value, cellIndex) => (
                      <td key={cellIndex} className={`px-4 py-3 ${cellIndex === 0 ? "font-black text-white/35" : "text-white/75"}`}>
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-6 text-sm text-white/40">
            No verified statistics are available for this category yet.
          </div>
        )}
      </div>
    </section>
  );
}
