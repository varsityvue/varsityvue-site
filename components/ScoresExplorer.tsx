"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { liveGameContext } from "@/lib/live-period";

export type ExplorerGame = {
  id: string;
  away: string;
  home: string;
  awaySlug?: string;
  homeSlug?: string;
  classification: string;
  status: string;
  awayScore?: number;
  homeScore?: number;
  period?: string;
  clock?: string;
};

export default function ScoresExplorer({ games, followedSlugs }: { games: ExplorerGame[]; followedSlugs: string[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All classifications");
  const followed = useMemo(() => new Set(followedSlugs), [followedSlugs]);
  const classifications = [...new Set(games.map((game) => game.classification))].sort();
  const visible = games.filter((game) =>
    (!query.trim() || `${game.away} ${game.home}`.toLowerCase().includes(query.trim().toLowerCase())) &&
    (filter === "All classifications" || game.classification === filter)
  );
  const followedGames = visible.filter((game) => followed.has(game.awaySlug ?? "") || followed.has(game.homeSlug ?? ""));
  const followedIds = new Set(followedGames.map((game) => game.id));
  const groups = classifications.map((name) => ({ name, games: visible.filter((game) => game.classification === name && !followedIds.has(game.id)) })).filter((group) => group.games.length);

  return <section className="mb-5 rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4 sm:mb-8 sm:rounded-3xl sm:p-6" aria-label="Browse scores">
    <h2 className="text-2xl font-black sm:text-3xl">Browse Scores</h2>
    <p className="mt-1 text-xs text-white/50 sm:text-sm">Find a matchup from the latest game slate.</p>
    <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
      <label className="sr-only" htmlFor="score-search">Search either team</label>
      <input id="score-search" type="search" placeholder="Search either school or team…" value={query} onChange={(event) => setQuery(event.target.value)} className="min-w-0 rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white outline-none focus-visible:ring-2 focus-visible:ring-white" />
      <label className="sr-only" htmlFor="score-classification">Classification</label>
      <select id="score-classification" value={filter} onChange={(event) => setFilter(event.target.value)} className="rounded-xl border border-white/15 bg-[#161616] px-4 py-3 text-sm text-white"><option>All classifications</option>{classifications.map((name) => <option key={name}>{name}</option>)}</select>
    </div>
    <p className="mt-3 text-xs text-white/45" aria-live="polite">{visible.length} matchups</p>
    {followedGames.length > 0 && <div className="mt-5"><h3 className="mb-2 text-sm font-black uppercase tracking-wider text-[var(--vv-accent)]">Following</h3><p className="mb-3 text-xs text-white/45">Your followed matchups appear first.</p><div className="grid gap-2 md:grid-cols-2">{followedGames.map((game) => <ExplorerCard key={`follow-${game.id}`} game={game} followed />)}</div></div>}
    <div className="mt-5 space-y-2">{groups.map((group) => <details key={group.name} open={groups.length <= 4 || Boolean(query)} className="rounded-xl border border-white/10 bg-black/20"><summary className="cursor-pointer px-4 py-3 text-sm font-black">{group.name} <span className="text-white/40">({group.games.length})</span></summary><div className="grid gap-2 px-3 pb-3 md:grid-cols-2">{group.games.map((game) => <ExplorerCard key={game.id} game={game} followed={followed.has(game.awaySlug ?? "") || followed.has(game.homeSlug ?? "")} />)}</div></details>)}</div>
    {!visible.length && <p className="mt-5 text-sm text-white/50">No matching games. Try another school name or classification.</p>}
  </section>;
}

function ExplorerCard({ game, followed }: { game: ExplorerGame; followed: boolean }) {
  const status = game.status === "live" ? liveGameContext(game.period, game.clock) : game.status === "final" ? "Final" : game.status === "scheduled" ? "Result pending" : game.status;
  return <Link href={`/games/${game.id}`} className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/40 p-3 transition hover:border-white/25 hover:bg-white/[0.06]">
    <div className="min-w-0"><p className="truncate text-sm font-black">{game.away} at {game.home}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/45">{status}{followed ? " · Following" : ""}</p></div>
    <span className="shrink-0 text-sm font-black tabular-nums">{game.awayScore !== undefined && game.homeScore !== undefined ? `${game.awayScore}–${game.homeScore}` : "→"}</span>
  </Link>;
}
