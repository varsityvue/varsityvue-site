"use client";

import Link from "next/link";
import Image from "next/image";
import { getSchoolLogoImageStyle, getSchoolLogoPath } from "@/data/school-logos";
import { useState } from "react";
import { formatPlayoffKickoff, type getPlayoffSchedule } from "@/lib/playoffs";
import { centralDate } from "@/lib/scoring-operations";

type Schedule = ReturnType<typeof getPlayoffSchedule>;
const pageSize = 12;
const statuses = [
  { value: "today", label: "Today’s games" },
  { value: "finals", label: "Verified finals" },
  { value: "scheduled", label: "Upcoming" },
  { value: "all", label: "All playoff games" },
];
const filterClass = "mt-1 min-h-11 w-full rounded-lg border border-white/25 bg-[#242428] px-2 text-sm text-white";

function isFinal({ presentation }: Schedule[number]) {
  return presentation.kind === "verified_final" || presentation.kind === "verified_exceptional";
}

export default function PlayoffGamesAndScores({ schedule, now }: { schedule: Schedule; now: string }) {
  const today = centralDate(now);
  const isToday = ({ game }: Schedule[number]) => Boolean(game.kickoff &&
    (game.kickoff.includes("T") ? centralDate(game.kickoff) : game.kickoff) === today);
  const [status, setStatus] = useState(() => windowHashIsResults() || !schedule.some(isToday) ? "finals" : "today");
  const [division, setDivision] = useState("");
  const [limit, setLimit] = useState(pageSize);
  const divisions = [...new Set(schedule.flatMap(({ game }) => game.playoff ? [game.playoff.division] : []))].sort();
  const filtered = schedule.filter((entry) => {
    if (division && entry.game.playoff?.division !== division) return false;
    if (status === "today") return isToday(entry);
    if (status === "finals") return isFinal(entry);
    if (status === "scheduled") return entry.presentation.kind === "scheduled";
    return true;
  });
  if (status === "finals") {
    filtered.sort((a, b) => {
      const aKickoff = Date.parse(a.game.kickoff ?? "") || 0;
      const bKickoff = Date.parse(b.game.kickoff ?? "") || 0;
      return bKickoff - aKickoff;
    });
  }
  const visible = filtered.slice(0, limit);

  return <div className="mt-4">
    <div className="grid grid-cols-2 gap-3 sm:max-w-lg">
      <label className="text-xs font-bold">Game status<select value={status} className={filterClass} onChange={(event) => { setStatus(event.target.value); setLimit(pageSize); }}>
        {statuses.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <label className="text-xs font-bold">Division<select value={division} className={filterClass} onChange={(event) => { setDivision(event.target.value); setLimit(pageSize); }}>
        <option value="">All divisions</option>
        {divisions.map((value) => <option key={value}>{value}</option>)}
      </select></label>
    </div>
    <p className="my-3 text-sm text-white/70" role="status">Showing {visible.length} of {filtered.length} games</p>
    <ul className="grid gap-2 sm:grid-cols-2">
      {visible.map(({ game, presentation }) => <li key={game.id} className="min-w-0">
        <Link prefetch={false} href={`/games/${game.id}`} aria-label={`Game Center for ${game.awayTeam ?? "Opponent TBD"} vs. ${game.homeTeam ?? "Opponent TBD"}, ${presentation.label}`}
          className="block h-full rounded-xl border border-white/15 bg-[#171519] p-3 hover:border-[var(--vv-accent)] focus-visible:outline-2 focus-visible:outline-white">
          <div className="flex flex-wrap justify-between gap-x-2 text-xs text-white/70">
            <span>{game.playoff?.division} · {game.playoff?.round}</span>
            <span className="font-semibold text-white">{presentation.label}</span>
          </div>
          <div className="my-2 space-y-1">
            <TeamScore name={game.awayTeam ?? "Opponent TBD"} slug={game.awaySchoolSlug} score={presentation.showScore ? game.awayScore ?? game.score?.away : undefined} />
            <TeamScore name={game.homeTeam ?? "Opponent TBD"} slug={game.homeSchoolSlug} score={presentation.showScore ? game.homeScore ?? game.score?.home : undefined} />
          </div>
          <div className="flex justify-between gap-2 text-xs text-white/70">
            <span>{formatPlayoffKickoff(game.kickoff)}{game.venue && ` · ${game.venue}`}</span><span className="shrink-0 font-bold text-white">Game Center →</span>
          </div>
        </Link>
      </li>)}
    </ul>
    {!filtered.length && <p className="text-sm text-white/70">No games match these filters.</p>}
    {limit < filtered.length && <button className="mt-3 min-h-11 rounded-lg border border-white/25 px-4 text-sm font-bold focus-visible:outline-2" onClick={() => setLimit(limit + pageSize)}>Show more games</button>}
    <Link href="/games?intent=scores" className="ml-3 inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4">Full scoreboard</Link>
  </div>;
}

function windowHashIsResults() {
  return typeof window !== "undefined" && window.location.hash === "#results";
}

function TeamScore({ name, slug, score }: { name: string; slug?: string; score?: number | null }) {
  const logo = slug && getSchoolLogoPath(slug);
  return <div className="flex min-w-0 items-center gap-2 text-sm font-bold">
    {logo && slug && <Image src={logo} width={22} height={22} alt={`${name} logo`} className="size-[22px] shrink-0 object-contain" style={getSchoolLogoImageStyle(slug)} />}
    <span className="min-w-0 break-words">{name}</span>
    <span className="ml-auto tabular-nums">{score}</span>
  </div>;
}
