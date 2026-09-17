import Link from "next/link";

import { getPlayerSeasonStats } from "@/lib/player-stats";
import { getFeaturedSchools } from "@/lib/schools";
import { compareOptionalStatsDescending, formatTouchdownDetail, sumOptionalStats } from "@/lib/stat-values";
import { combineCategoryStates, isDefinitiveRanking } from "@/lib/stat-completeness";
import type { StatCompletenessDetail } from "@/data/game-stats";

type LeaderRow = {
  playerId: string;
  player: string;
  schoolSlug: string;
  gamesRecorded: number;
  value: number;
  detail: string;
  completeness: StatCompletenessDetail;
};

type LeaderCard = {
  title: string;
  statLabel: string;
  rows: LeaderRow[];
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function touchdownDetail(player: ReturnType<typeof getPlayerSeasonStats>[number]) {
  const parts: string[] = [];
  if (player.passing.touchdowns !== undefined && player.passing.touchdowns > 0) parts.push(`${player.passing.touchdowns} PASS`);
  if (player.rushing.touchdowns !== undefined && player.rushing.touchdowns > 0) parts.push(`${player.rushing.touchdowns} RUSH`);
  if (player.receiving.touchdowns !== undefined && player.receiving.touchdowns > 0) parts.push(`${player.receiving.touchdowns} REC`);
  return parts.join(" · ");
}

function coverageSummary(rows: LeaderRow[]) {
  const status = combineCategoryStates(rows.map((row) => row.completeness)).status;
  if (status === "complete") return "Verified stats on file";
  if (status === "partial") return "Verified stats on file · Partial coverage";
  if (status === "unavailable") return "Verified stats on file · Coverage unavailable";
  return "Verified stats on file · Coverage completeness unknown";
}

export default function AreaLeaders() {
  const featuredSchools = getFeaturedSchools();
  const featuredSlugs = new Set(featuredSchools.map((school) => school.slug));
  const schoolNames = new Map(featuredSchools.map((school) => [school.slug, school.name]));
  const players = getPlayerSeasonStats(2026).filter((player) => featuredSlugs.has(player.schoolSlug));

  const passing: LeaderRow[] = players
    .filter((player) => player.passing.attempts > 0)
    .sort((a, b) => b.passing.yards - a.passing.yards || compareOptionalStatsDescending(a.passing.touchdowns, b.passing.touchdowns))
    .slice(0, 3)
    .map((player) => ({
      playerId: player.playerId,
      player: player.player,
      schoolSlug: player.schoolSlug,
      gamesRecorded: player.gamesRecorded,
      value: player.passing.yards,
      detail: `${player.passing.completions}/${player.passing.attempts} · ${formatTouchdownDetail(player.passing.touchdowns)} · ${player.passing.interceptions} INT`,
      completeness: player.completeness.passing,
    }));

  const rushing: LeaderRow[] = players
    .filter((player) => player.rushing.attempts > 0)
    .sort((a, b) => b.rushing.yards - a.rushing.yards || compareOptionalStatsDescending(a.rushing.touchdowns, b.rushing.touchdowns))
    .slice(0, 3)
    .map((player) => ({
      playerId: player.playerId,
      player: player.player,
      schoolSlug: player.schoolSlug,
      gamesRecorded: player.gamesRecorded,
      value: player.rushing.yards,
      detail: `${player.rushing.attempts} CAR · ${formatTouchdownDetail(player.rushing.touchdowns)}`,
      completeness: player.completeness.rushing,
    }));

  const receiving: LeaderRow[] = players
    .filter((player) => player.receiving.receptions > 0)
    .sort((a, b) => b.receiving.yards - a.receiving.yards || compareOptionalStatsDescending(a.receiving.touchdowns, b.receiving.touchdowns))
    .slice(0, 3)
    .map((player) => ({
      playerId: player.playerId,
      player: player.player,
      schoolSlug: player.schoolSlug,
      gamesRecorded: player.gamesRecorded,
      value: player.receiving.yards,
      detail: `${player.receiving.receptions} REC · ${formatTouchdownDetail(player.receiving.touchdowns)}`,
      completeness: player.completeness.receiving,
    }));

  const allPurpose: LeaderRow[] = players
    .map((player) => ({
      player,
      yards: player.rushing.yards + player.receiving.yards,
    }))
    .filter(({ yards }) => yards > 0)
    .sort((a, b) => b.yards - a.yards || b.player.rushing.yards - a.player.rushing.yards)
    .slice(0, 3)
    .map(({ player, yards }) => ({
      playerId: player.playerId,
      player: player.player,
      schoolSlug: player.schoolSlug,
      gamesRecorded: player.gamesRecorded,
      value: yards,
      detail: `${number(player.rushing.yards)} RUSH · ${number(player.receiving.yards)} REC`,
      completeness: combineCategoryStates([player.completeness.rushing, player.completeness.receiving]),
    }));

  const totalTouchdowns: LeaderRow[] = players
    .map((player) => ({
      player,
      touchdowns: sumOptionalStats([
        player.passing.touchdowns,
        player.rushing.touchdowns,
        player.receiving.touchdowns,
      ]),
    }))
    .filter((entry): entry is typeof entry & { touchdowns: number } => entry.touchdowns !== undefined && entry.touchdowns > 0)
    .sort(
      (a, b) =>
        b.touchdowns - a.touchdowns ||
        b.player.passing.yards + b.player.rushing.yards + b.player.receiving.yards -
          (a.player.passing.yards + a.player.rushing.yards + a.player.receiving.yards)
    )
    .slice(0, 3)
    .map(({ player, touchdowns }) => ({
      playerId: player.playerId,
      player: player.player,
      schoolSlug: player.schoolSlug,
      gamesRecorded: player.gamesRecorded,
      value: touchdowns,
      detail: touchdownDetail(player),
      completeness: combineCategoryStates([player.completeness.passing, player.completeness.rushing, player.completeness.receiving]),
    }));

  const cards: LeaderCard[] = [
    { title: "Passing", statLabel: "YDS", rows: passing },
    { title: "Receiving", statLabel: "YDS", rows: receiving },
    { title: "Rushing", statLabel: "YDS", rows: rushing },
    { title: "All-Purpose", statLabel: "YDS", rows: allPurpose },
    { title: "Total TDs", statLabel: "TD", rows: totalTouchdowns },
  ];

  return (
    <section className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <div className="mx-auto max-w-[1440px] rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-3.5 shadow-2xl sm:rounded-[2rem] sm:p-6 md:p-8">
        <div className="flex flex-col gap-2.5 sm:gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/45 sm:text-xs sm:tracking-[0.3em]">
              2026 Stat Leaders
            </p>
            <h2 className="mt-1.5 text-[1.65rem] font-black leading-[1.05] text-white sm:mt-2 sm:text-3xl md:text-4xl">
              Area Leaders
            </h2>
            <p className="mt-1.5 max-w-3xl text-xs leading-5 text-white/50 sm:mt-2 sm:text-sm sm:leading-6">
              Top performers from verified statistics currently on file.
            </p>
          </div>
          <Link href="/stats" className="w-fit rounded-full border border-white/10 bg-black/35 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/45 transition hover:bg-white/10 hover:text-white sm:px-3 sm:py-1.5 sm:text-xs sm:tracking-[0.16em]">
            View Full Leaders →
          </Link>
        </div>

        <div className="mt-4 grid gap-2.5 sm:mt-6 sm:grid-cols-2 sm:gap-4 xl:grid-cols-5">
          {cards.map((card) => {
            const definitiveRanking = isDefinitiveRanking(card.rows);
            const coverage = coverageSummary(card.rows);
            return (
            <div key={card.title} className="overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/35 sm:rounded-[1.5rem]">
              <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(139,16,32,0.24),rgba(255,255,255,0.03))] px-3.5 py-2.5 sm:px-5 sm:py-4">
                <h3 className="text-sm font-black uppercase tracking-tight text-white sm:text-lg">
                  {card.title}
                </h3>
                <p className="mt-1 text-[8px] font-bold leading-3 text-white/40 sm:text-[10px] sm:leading-4">
                  {coverage}
                </p>
              </div>

              <div className="divide-y divide-white/10">
                {card.rows.map((row, index) => (
                  <div key={`${card.title}-${row.playerId}`} className="grid grid-cols-[22px_1fr_auto] items-center gap-2 px-3 py-2.5 sm:grid-cols-[28px_1fr_auto] sm:gap-3 sm:px-4 sm:py-4">
                    <span className="text-sm font-black text-white/25 sm:text-lg">{definitiveRanking ? index + 1 : "•"}</span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-white sm:text-sm">{row.player}</p>
                      <Link
                        href={`/schools/${row.schoolSlug}`}
                        className="mt-0.5 block truncate text-[8px] font-black uppercase tracking-[0.1em] text-white/40 transition hover:text-white/70 sm:text-[10px] sm:tracking-[0.14em]"
                      >
                        {schoolNames.get(row.schoolSlug) ?? row.schoolSlug} · {row.gamesRecorded} G
                      </Link>
                      <p className="mt-0.5 truncate text-[8px] font-semibold uppercase tracking-[0.05em] text-white/30 sm:mt-1 sm:text-[10px] sm:tracking-[0.08em]">
                        {row.detail}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-black text-white sm:text-xl">{number(row.value)}</p>
                      <p className="text-[7px] font-black uppercase tracking-[0.12em] text-white/30 sm:text-[9px] sm:tracking-[0.16em]">
                        {card.statLabel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )})}
        </div>
      </div>
    </section>
  );
}
