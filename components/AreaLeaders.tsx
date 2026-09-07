import Link from "next/link";

import { getPlayerSeasonStats } from "@/lib/player-stats";
import { getFeaturedSchools } from "@/lib/schools";

type LeaderRow = {
  playerId: string;
  player: string;
  schoolSlug: string;
  gamesRecorded: number;
  value: number;
  detail: string;
};

type LeaderCard = {
  title: string;
  statLabel: string;
  rows: LeaderRow[];
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function AreaLeaders() {
  const featuredSchools = getFeaturedSchools();
  const featuredSlugs = new Set(featuredSchools.map((school) => school.slug));
  const schoolNames = new Map(featuredSchools.map((school) => [school.slug, school.name]));
  const players = getPlayerSeasonStats(2026).filter((player) => featuredSlugs.has(player.schoolSlug));

  const passing: LeaderRow[] = players
    .filter((player) => player.passing.attempts > 0)
    .sort((a, b) => b.passing.yards - a.passing.yards || b.passing.touchdowns - a.passing.touchdowns)
    .slice(0, 3)
    .map((player) => ({
      playerId: player.playerId,
      player: player.player,
      schoolSlug: player.schoolSlug,
      gamesRecorded: player.gamesRecorded,
      value: player.passing.yards,
      detail: `${player.passing.completions}/${player.passing.attempts} · ${player.passing.touchdowns} TD`,
    }));

  const rushing: LeaderRow[] = players
    .filter((player) => player.rushing.attempts > 0)
    .sort((a, b) => b.rushing.yards - a.rushing.yards || b.rushing.touchdowns - a.rushing.touchdowns)
    .slice(0, 3)
    .map((player) => ({
      playerId: player.playerId,
      player: player.player,
      schoolSlug: player.schoolSlug,
      gamesRecorded: player.gamesRecorded,
      value: player.rushing.yards,
      detail: `${player.rushing.attempts} CAR · ${player.rushing.touchdowns} TD`,
    }));

  const receiving: LeaderRow[] = players
    .filter((player) => player.receiving.receptions > 0)
    .sort((a, b) => b.receiving.yards - a.receiving.yards || b.receiving.touchdowns - a.receiving.touchdowns)
    .slice(0, 3)
    .map((player) => ({
      playerId: player.playerId,
      player: player.player,
      schoolSlug: player.schoolSlug,
      gamesRecorded: player.gamesRecorded,
      value: player.receiving.yards,
      detail: `${player.receiving.receptions} REC · ${player.receiving.touchdowns} TD`,
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
    }));

  const totalTouchdowns: LeaderRow[] = players
    .map((player) => ({
      player,
      touchdowns:
        player.passing.touchdowns + player.rushing.touchdowns + player.receiving.touchdowns,
    }))
    .filter(({ touchdowns }) => touchdowns > 0)
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
      detail: `${player.passing.touchdowns} PASS · ${player.rushing.touchdowns + player.receiving.touchdowns} SCORE`,
    }));

  const cards: LeaderCard[] = [
    { title: "Passing", statLabel: "YDS", rows: passing },
    { title: "Rushing", statLabel: "YDS", rows: rushing },
    { title: "All-Purpose", statLabel: "YDS", rows: allPurpose },
    { title: "Receiving", statLabel: "YDS", rows: receiving },
    { title: "Total TDs", statLabel: "TD", rows: totalTouchdowns },
  ];

  return (
    <section className="px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px] rounded-[2rem] border border-white/10 bg-white/[0.04] p-6 shadow-2xl md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.3em] text-white/45">
              2026 Stat Leaders
            </p>
            <h2 className="mt-2 text-3xl font-black text-white md:text-4xl">
              Area Leaders
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
              Top performers from VarsityVue featured programs based on verified statistics currently on file.
            </p>
          </div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-white/35">
            Through Week 2
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {cards.map((card) => (
            <div key={card.title} className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/35">
              <div className="border-b border-white/10 bg-[linear-gradient(135deg,rgba(139,16,32,0.24),rgba(255,255,255,0.03))] px-5 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                  Top 3
                </p>
                <h3 className="mt-1 text-lg font-black uppercase tracking-tight text-white">
                  {card.title}
                </h3>
              </div>

              <div className="divide-y divide-white/10">
                {card.rows.map((row, index) => (
                  <div key={`${card.title}-${row.playerId}`} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 px-4 py-4">
                    <span className="text-lg font-black text-white/25">{index + 1}</span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-white">{row.player}</p>
                      <Link
                        href={`/schools/${row.schoolSlug}`}
                        className="mt-0.5 block truncate text-[10px] font-black uppercase tracking-[0.14em] text-white/40 transition hover:text-white/70"
                      >
                        {schoolNames.get(row.schoolSlug) ?? row.schoolSlug} · {row.gamesRecorded} G
                      </Link>
                      <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-white/30">
                        {row.detail}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-white">{number(row.value)}</p>
                      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/30">
                        {card.statLabel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-5 text-[11px] leading-5 text-white/35">
          All-purpose yards currently include rushing plus receiving yards from verified game statistics; return yardage is not yet tracked. Total TDs include passing, rushing, and receiving touchdowns.
        </p>
      </div>
    </section>
  );
}
