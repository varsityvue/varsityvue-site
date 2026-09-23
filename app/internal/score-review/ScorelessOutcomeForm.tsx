"use client";

import { useMemo, useState } from "react";

import {
  scorelessOutcomeSummary,
  scorelessOutcomeValidation,
  type ScorelessOutcomeGame,
  type ScorelessOutcomeType,
} from "@/lib/admin-outcome";
import { originateScorelessOutcome } from "./actions";

type Props = { games: ScorelessOutcomeGame[] };

export default function ScorelessOutcomeForm({ games }: Props) {
  const [gameId, setGameId] = useState("");
  const [resultType, setResultType] = useState<ScorelessOutcomeType>("forfeit");
  const [winnerSlug, setWinnerSlug] = useState("");
  const [source, setSource] = useState("");
  const [reason, setReason] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const game = useMemo(() => games.find((item) => item.gameId === gameId), [gameId, games]);

  function resetReview() {
    setReviewing(false);
    setClientError(null);
  }

  function review() {
    const error = scorelessOutcomeValidation(game, resultType, winnerSlug, source, reason);
    if (error) {
      setClientError(error);
      setReviewing(false);
      return;
    }
    setClientError(null);
    setReviewing(true);
  }

  return (
    <form action={originateScorelessOutcome} className="mt-5 space-y-4">
      <input type="hidden" name="expected_outcome_revision" value={game?.outcomeRevision ?? ""} />

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">Game without a verified final</span>
          <select
            name="game_id"
            required
            value={gameId}
            onChange={(event) => {
              setGameId(event.target.value);
              setWinnerSlug("");
              resetReview();
            }}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-3 text-sm text-white outline-none focus:border-[var(--vv-accent)] focus:ring-2 focus:ring-[var(--vv-accent)]/30"
          >
            <option value="" disabled>Choose a game…</option>
            {games.map((item) => (
              <option key={item.gameId} value={item.gameId}>
                {item.matchup} · {item.status}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">Exceptional outcome</span>
          <select
            name="result_type"
            required
            value={resultType}
            onChange={(event) => {
              setResultType(event.target.value as ScorelessOutcomeType);
              setWinnerSlug("");
              resetReview();
            }}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-3 text-sm text-white outline-none focus:border-[var(--vv-accent)] focus:ring-2 focus:ring-[var(--vv-accent)]/30"
          >
            <option value="forfeit">Forfeit — explicit official winner</option>
            <option value="no_contest">No-contest — VOID for Pick ’Em</option>
          </select>
        </label>
      </div>

      {resultType === "forfeit" ? (
        <fieldset className="rounded-xl border border-white/10 bg-black/25 p-4">
          <legend className="px-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/55">Official winner</legend>
          <p className="mb-3 text-xs leading-5 text-white/45">Choose only the participating school named in the authoritative ruling. No score is inferred or stored.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {game ? [
              [game.awaySlug, game.awayName],
              [game.homeSlug, game.homeName],
            ].map(([slug, name]) => (
              <label key={slug} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-black/25 p-3 focus-within:border-[var(--vv-accent)]">
                <input type="radio" name="official_winner_school_slug" value={slug} checked={winnerSlug === slug} onChange={() => { setWinnerSlug(slug); resetReview(); }} required />
                <span className="text-sm font-bold">{name}</span>
              </label>
            )) : <p className="text-xs text-white/45">Choose a game first.</p>}
          </div>
        </fieldset>
      ) : <input type="hidden" name="official_winner_school_slug" value="" />}

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">Required authoritative source</span>
          <input
            name="source"
            required
            maxLength={300}
            value={source}
            onChange={(event) => { setSource(event.target.value); resetReview(); }}
            placeholder="Official school, district, UIL, or coach ruling"
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[var(--vv-accent)] focus:ring-2 focus:ring-[var(--vv-accent)]/30"
          />
        </label>

        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">Required reason</span>
          <textarea
            name="reason"
            required
            maxLength={500}
            rows={3}
            value={reason}
            onChange={(event) => { setReason(event.target.value); resetReview(); }}
            placeholder="Explain the official ruling and why a numeric final does not apply."
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[var(--vv-accent)] focus:ring-2 focus:ring-[var(--vv-accent)]/30"
          />
        </label>
      </div>

      <div className="rounded-xl border border-sky-300/15 bg-sky-300/[0.06] p-4 text-xs leading-5 text-sky-50/80">
        This operation records no numeric score. It preserves saved picks, applies the existing forfeit or VOID grading rules, and cannot create a numeric final-score alert or email.
      </div>

      {clientError ? <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{clientError}</p> : null}

      {reviewing && game ? (
        <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-100/70">Confirm scoreless outcome</p>
          <p className="mt-2 text-sm leading-6 text-amber-50">{scorelessOutcomeSummary(game, resultType, winnerSlug)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" className="rounded-full bg-amber-200 px-5 py-2.5 text-xs font-black text-black outline-none transition hover:bg-amber-100 focus:ring-2 focus:ring-white">Confirm and record</button>
            <button type="button" onClick={() => setReviewing(false)} className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-black text-white/70 outline-none transition hover:bg-white/10 focus:ring-2 focus:ring-white">Edit details</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={review} className="rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-2.5 text-xs font-black text-amber-50 outline-none transition hover:bg-amber-300/15 focus:ring-2 focus:ring-amber-200">Review exceptional outcome</button>
      )}
    </form>
  );
}
