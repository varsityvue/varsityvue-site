"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import type { PendingScoreReport } from "@/lib/scoring-operations";
import { submitOperationalScore } from "./actions";

export type OperationalGame = {
  id: string; awayName: string; homeName: string; awayLogo: string | null; homeLogo: string | null;
  kickoff: string | null; status: string; awayScore: number | null; homeScore: number | null;
  period: string | null; clock: string | null; updatedAt: string | null; scoreRevision: number | null; hasState: boolean;
  verified: boolean; identityMissing: boolean; featured: boolean; reports: PendingScoreReport[]; attention: string[]; intelligenceOpen: boolean;
};

function centralTime(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value)) + " CT" : "Time TBD";
}

function age(value: string, now: string) {
  const minutes = Math.max(0, Math.floor((new Date(now).getTime() - new Date(value).getTime()) / 60_000));
  return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

function Mark({ logo, name }: { logo: string | null; name: string }) {
  return logo ? <Image src={logo} alt="" width={32} height={32} className="h-8 w-8 shrink-0 object-contain" />
    : <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[10px] font-black">{name.slice(0, 2).toUpperCase()}</span>;
}

function LiveEditor({ game, week, receipt, stale, error, now, onChoose }: { game: OperationalGame; week: number; receipt: boolean; stale: boolean; error: boolean; now: string; onChoose: () => void }) {
  const [away, setAway] = useState(String(game.awayScore ?? 0));
  const [home, setHome] = useState(String(game.homeScore ?? 0));
  const [period, setPeriod] = useState(game.period ?? "");
  const [clock, setClock] = useState(game.clock ?? "");
  const [finalReview, setFinalReview] = useState(false);
  const input = "w-full rounded-xl border border-white/20 bg-black/50 px-3 py-3 text-lg font-bold tabular-nums outline-none focus:border-[var(--vv-accent)]";
  return <section className="rounded-2xl border border-white/15 bg-white/[0.045] p-4 sm:p-5" aria-label="Selected game">
    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--vv-accent)]">Selected matchup</p>
    <button type="button" onClick={onChoose} className="mt-2 rounded-lg border border-white/20 px-3 py-2 text-xs font-bold lg:hidden">Find another game ↓</button>
    <h2 className="mt-1 text-xl font-black leading-tight">{game.awayName} at {game.homeName}</h2>
    <p className="mt-1 text-xs text-white/50">{centralTime(game.kickoff)} · {game.status.toUpperCase()}{game.period ? ` · ${game.period}` : ""}{game.clock ? ` · ${game.clock}` : ""}</p>
    <div className="mt-3 flex flex-wrap gap-2 text-xs"><Link href={`/games/${encodeURIComponent(game.id)}`} className="rounded-lg border border-white/20 px-3 py-2.5">View Game Center</Link><Link href="/games?intent=scores" className="rounded-lg border border-white/20 px-3 py-2.5">View public Scores</Link></div>
    {stale && <p role="alert" className="mt-4 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">Game changed — review the current score below before submitting again.</p>}
    {error && <p role="alert" className="mt-4 rounded-xl border border-red-300/30 bg-red-300/10 p-3 text-sm text-red-100">Score was not saved. Check the current game state and try again.</p>}
    {receipt && game.verified && <div role="status" className="mt-4 rounded-xl border border-emerald-300/25 bg-emerald-300/10 p-3 text-sm text-emerald-50">
      <p className="font-black">Persisted canonical state</p>
      <p>{game.awayName} {game.awayScore ?? "—"} · {game.homeName} {game.homeScore ?? "—"} · {game.status.toUpperCase()}{game.period ? ` · ${game.period}` : ""}{game.clock ? ` · ${game.clock}` : ""}</p>
      <p className="text-xs text-emerald-50/70">Updated {centralTime(game.updatedAt)}. This confirms the score record, not email delivery.</p>
    </div>}
    {game.status === "final" ? <div className="mt-5 rounded-xl border border-amber-300/20 p-4">
      <p className="text-sm text-white/70">Verified FINAL scores use the audited correction workflow.</p>
      {game.identityMissing && <p className="mt-2 text-xs font-bold text-amber-100">This historical FINAL lacks canonical school identity. The correction workflow will block a save until the separately reviewed reconciliation is complete.</p>}
      {game.verified && <Link href={`/internal/score-review/correct?game=${encodeURIComponent(game.id)}`} className="mt-3 inline-flex rounded-xl bg-amber-300 px-4 py-3 text-sm font-black text-black">Correct Score</Link>}
    </div> : ["postponed", "cancelled"].includes(game.status) ? <p className="mt-5 text-sm text-white/60">Use Score Review for schedule or availability changes.</p> : <form action={submitOperationalScore} className="mt-5 space-y-4">
      <input type="hidden" name="game_id" value={game.id} /><input type="hidden" name="week" value={week} />
      <input type="hidden" name="expected_updated_at" value={game.updatedAt ?? ""} />
      <input type="hidden" name="expected_revision" value={game.scoreRevision ?? ""} />
      <input type="hidden" name="expected_absent" value={String(!game.hasState)} />
      <input type="hidden" name="confirm_final" value={finalReview ? "yes" : "no"} />
      <div className="grid grid-cols-2 gap-3">
        <label className="min-w-0 text-xs font-bold"><span className="block min-h-9 leading-4">{game.awayName} (away)</span><input name="away_score" type="number" inputMode="numeric" min="0" max="150" required value={away} onChange={(event) => { setAway(event.target.value); setFinalReview(false); }} className={input} /></label>
        <label className="min-w-0 text-xs font-bold"><span className="block min-h-9 leading-4">{game.homeName} (home)</span><input name="home_score" type="number" inputMode="numeric" min="0" max="150" required value={home} onChange={(event) => { setHome(event.target.value); setFinalReview(false); }} className={input} /></label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-bold">Period<select name="period" value={period} onChange={(event) => { setPeriod(event.target.value); setFinalReview(false); }} className="mt-1 w-full rounded-xl border border-white/20 bg-black/50 px-3 py-3 text-base"><option value="">Unknown</option>{["1st", "2nd", "3rd", "4th", "OT", "OT2", "OT3", "OT4"].map((value) => <option key={value}>{value}</option>)}</select></label>
        <label className="text-xs font-bold">Clock<input name="clock" maxLength={30} placeholder="4:21" value={clock} onChange={(event) => { setClock(event.target.value); setFinalReview(false); }} className="mt-1 w-full rounded-xl border border-white/20 bg-black/50 px-3 py-3 text-base" /></label>
      </div>
      <label className="block text-xs font-bold">Source note (optional)<input name="source_note" maxLength={1000} placeholder="At game, broadcast, school source…" className="mt-1 w-full rounded-xl border border-white/20 bg-black/50 px-3 py-3 text-base" /></label>
      {finalReview ? <div className="rounded-xl border border-amber-300/35 bg-amber-300/10 p-4">
        <p className="text-xs font-black uppercase tracking-widest text-amber-100">Confirm FINAL</p>
        <p className="mt-2 text-base font-bold">{game.awayName} {away} · {game.homeName} {home}</p>
        <p className="mt-1 text-xs text-amber-100/75">This records the first verified FINAL. Later changes require an audited correction.</p>
        <button type="submit" name="intent" value="final" className="mt-4 w-full rounded-xl bg-amber-300 px-4 py-3.5 text-sm font-black text-black">Confirm and publish FINAL</button>
        <button type="button" onClick={() => setFinalReview(false)} className="mt-2 w-full rounded-xl border border-white/20 px-4 py-3 text-sm font-bold">Back to live editor</button>
      </div> : <div className="grid gap-2 sm:grid-cols-2"><button type="submit" name="intent" value="live" className="rounded-xl bg-[var(--vv-primary)] px-4 py-3.5 text-sm font-black">Save live update</button><button type="button" onClick={() => setFinalReview(true)} className="rounded-xl border border-amber-300/40 px-4 py-3.5 text-sm font-black text-amber-100">Review FINAL…</button></div>}
    </form>}
    {game.reports.length > 0 && <div className="mt-5 border-t border-white/10 pt-4 text-sm">
      <div className="flex items-center justify-between gap-2"><h3 className="font-black">Pending reports ({game.reports.length})</h3><Link href={`/internal/score-review#report-${game.id}`} className="text-xs font-bold text-amber-100">Review reports →</Link></div>
      <p className="mt-1 text-xs text-white/50">Canonical: {game.awayScore ?? "—"}–{game.homeScore ?? "—"} · {game.status}</p>
      {game.reports.slice(0, 4).map((report) => <p key={report.id} className="mt-2 rounded-lg bg-black/30 p-2 text-xs">Submitted: {report.away_score}–{report.home_score} · {report.game_status} · {age(report.created_at, now)} ago{game.updatedAt && new Date(game.updatedAt) > new Date(report.created_at) ? " · Canonical state advanced since report" : ""}</p>)}
    </div>}
    {game.intelligenceOpen && <Link href="/internal/score-intelligence" className="mt-3 inline-block text-xs font-bold text-sky-100">Open missing-score candidate →</Link>}
  </section>;
}

export default function ScoringBoard({ games, week, weeks, initialGameId, receipt, stale, error, now }: {
  games: OperationalGame[]; week: number; weeks: number[]; initialGameId: string;
  receipt: boolean; stale: boolean; error: boolean; now: string;
}) {
  const router = useRouter();
  const listRef = useRef<HTMLElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedId, setSelectedId] = useState(games.some((game) => game.id === initialGameId) ? initialGameId : "");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "live" | "awaiting" | "pending">("all");
  const visible = useMemo(() => games.filter((game) => {
    const match = `${game.awayName} ${game.homeName} ${game.id}`.toLowerCase().includes(query.trim().toLowerCase());
    return match && (filter === "all" || filter === "live" && game.status === "live" ||
      filter === "awaiting" && ["scheduled", "upcoming"].includes(game.status) && Boolean(game.kickoff && new Date(game.kickoff) < new Date(now)) ||
      filter === "pending" && game.reports.length > 0);
  }), [games, query, filter, now]);
  const selected = games.find((game) => game.id === selectedId);
  return <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(340px,440px)] lg:items-start">
    <section ref={listRef} className={`min-w-0 ${selected ? "order-2 lg:order-1" : ""}`}>
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-black">Week {week} games <span className="text-sm text-white/40">({games.length})</span></h2><div className="flex gap-2"><button type="button" onClick={() => router.refresh()} className="rounded-lg border border-white/20 px-3 py-2 text-xs font-bold">Refresh state</button><select aria-label="Scoring week" value={week} onChange={(event) => { window.location.href = `/internal/scoring?week=${event.target.value}`; }} className="rounded-lg border border-white/20 bg-black px-2 py-2 text-sm">{weeks.map((value) => <option key={value} value={value}>Week {value}</option>)}</select></div></div>
      <label className="mt-3 block"><span className="sr-only">Find a school or matchup</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find school or matchup" className="w-full rounded-xl border border-white/20 bg-white/[0.06] px-4 py-3 text-base outline-none focus:border-[var(--vv-accent)]" /></label>
      <div className="mt-3 flex flex-wrap gap-2" aria-label="Game filters">{([ ["all", "All"], ["live", "Live"], ["awaiting", "Awaiting Result"], ["pending", "Pending Reports"] ] as const).map(([key, label]) => <button key={key} type="button" onClick={() => setFilter(key)} aria-pressed={filter === key} className={`rounded-full border px-3 py-2.5 text-xs font-bold ${filter === key ? "border-[var(--vv-accent)] bg-[var(--vv-primary)]" : "border-white/15 bg-white/[0.04]"}`}>{label}</button>)}</div>
      <div className="mt-3 max-h-[52vh] space-y-2 overflow-y-auto pr-1 lg:max-h-[65vh]">{visible.length === 0 && <p className="rounded-xl border border-white/15 p-4 text-sm text-white/50">No games match this search and filter.</p>}{visible.map((game) => <button type="button" key={game.id} onClick={() => { setSelectedId(game.id); requestAnimationFrame(() => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })); }} aria-pressed={selectedId === game.id} className={`w-full rounded-xl border p-3 text-left ${selectedId === game.id ? "border-[var(--vv-accent)] bg-white/[0.09]" : "border-white/10 bg-white/[0.035]"}`}>
        <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wide text-white/45"><span>{centralTime(game.kickoff)}{game.featured ? " · Featured school" : ""}</span><span className="shrink-0">{game.status}</span></div>
        <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] gap-3"><div className="min-w-0 space-y-1"><div className="flex min-w-0 items-center gap-2"><Mark logo={game.awayLogo} name={game.awayName} /><span className="min-w-0 truncate text-sm font-bold">{game.awayName}</span></div><div className="flex min-w-0 items-center gap-2"><Mark logo={game.homeLogo} name={game.homeName} /><span className="min-w-0 truncate text-sm font-bold">{game.homeName}</span></div></div><div className="flex flex-col justify-around text-right text-xl font-black tabular-nums"><span>{game.awayScore ?? "—"}</span><span>{game.homeScore ?? "—"}</span></div></div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-white/55">{game.period && <span>{game.period}{game.clock ? ` · ${game.clock}` : ""}</span>}{game.updatedAt && <span>Updated {centralTime(game.updatedAt)}</span>}{game.reports.length > 0 && <span className="font-bold text-amber-100">{game.reports.length} pending · oldest {age(game.reports[0].created_at, now)}</span>}{game.attention.map((reason) => <span key={reason} className="text-amber-100/80">{reason}</span>)}</div>
      </button>)}</div>
    </section>
    <div ref={editorRef} className={`${selected ? "order-1" : ""} scroll-mt-4 lg:order-2 lg:sticky lg:top-4`}>{selected ? <LiveEditor key={`${selected.id}:${selected.updatedAt ?? "absent"}`} game={selected} week={week} receipt={receipt && initialGameId === selected.id} stale={stale && initialGameId === selected.id} error={error && initialGameId === selected.id} now={now} onChoose={() => listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })} /> : <p className="rounded-xl border border-white/15 bg-white/[0.04] p-5 text-sm text-white/55">Select a game to view its canonical score and enter an update.</p>}</div>
  </div>;
}
