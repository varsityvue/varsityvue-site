"use client";

import { useMemo, useState } from "react";

import {
  canonicalOutcomeLabels,
  canonicalOutcomeSummary,
  canonicalOutcomeValidation,
  type CanonicalOutcomeGame,
  type CanonicalOutcomeType,
} from "@/lib/admin-outcome";
import { setCanonicalGameOutcome } from "./actions";

type Props = { games: CanonicalOutcomeGame[] };

export default function CanonicalOutcomeForm({ games }: Props) {
  const [gameId, setGameId] = useState("");
  const [resultType, setResultType] = useState<CanonicalOutcomeType>("tie");
  const [winnerSlug, setWinnerSlug] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [reason, setReason] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const game = useMemo(() => games.find((item) => item.gameId === gameId), [gameId, games]);

  function resetReview() {
    setReviewing(false);
    setClientError(null);
  }

  function review() {
    const submittedAwayScore = awayScore === "" ? null : Number(awayScore);
    const submittedHomeScore = homeScore === "" ? null : Number(homeScore);
    const error = canonicalOutcomeValidation(game, resultType, winnerSlug, reason, submittedAwayScore, submittedHomeScore);
    if (error) {
      setClientError(error);
      setReviewing(false);
      return;
    }
    setClientError(null);
    setReviewing(true);
  }

  return (
    <form action={setCanonicalGameOutcome} className="mt-5 space-y-4">
      <input type="hidden" name="expected_outcome_revision" value={game?.outcomeRevision ?? ""} />
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">Verified final game</span>
          <select
            name="game_id"
            required
            value={gameId}
            onChange={(event) => {
              const selected = games.find((item) => item.gameId === event.target.value);
              setGameId(event.target.value);
              setAwayScore(selected?.awayScore?.toString() ?? "");
              setHomeScore(selected?.homeScore?.toString() ?? "");
              resetReview();
            }}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-3 text-sm text-white outline-none focus:border-[var(--vv-accent)] focus:ring-2 focus:ring-[var(--vv-accent)]/30"
          >
            <option value="" disabled>Choose a game…</option>
            {games.map((item) => (
              <option key={item.gameId} value={item.gameId}>
                {item.matchup} · {item.awayScore ?? "—"}-{item.homeScore ?? "—"} · {item.resultType ?? "unclassified"}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">Canonical outcome</span>
          <select
            name="result_type"
            required
            value={resultType}
            onChange={(event) => {
              setResultType(event.target.value as CanonicalOutcomeType);
              setWinnerSlug("");
              resetReview();
            }}
            className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-3 text-sm text-white outline-none focus:border-[var(--vv-accent)] focus:ring-2 focus:ring-[var(--vv-accent)]/30"
          >
            {Object.entries(canonicalOutcomeLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      {game ? (
        <div className="grid gap-2 rounded-xl border border-white/10 bg-black/25 p-4 text-xs text-white/60 sm:grid-cols-2 lg:grid-cols-4">
          <p><strong className="text-white/80">Score:</strong> {game.awayName} {game.awayScore ?? "—"}, {game.homeName} {game.homeScore ?? "—"}</p>
          <p><strong className="text-white/80">Lifecycle:</strong> {game.status} · {game.verified ? "verified" : "unverified"}</p>
          <p><strong className="text-white/80">Current result:</strong> {game.resultType ?? "unclassified"}</p>
          <p><strong className="text-white/80">Official winner:</strong> {game.officialWinnerSlug === game.awaySlug ? game.awayName : game.officialWinnerSlug === game.homeSlug ? game.homeName : "None"}</p>
        </div>
      ) : null}

      {resultType === "played" || resultType === "tie" ? (
        <fieldset className="rounded-xl border border-white/10 bg-black/25 p-4">
          <legend className="px-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/55">Authoritative final score</legend>
          <p className="mb-3 text-xs leading-5 text-white/45">
            {resultType === "tie" ? "Enter equal official scores." : "Enter unequal official scores; the winner is derived from them."} The score and outcome are committed atomically.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-white/70">
              {game?.awayName ?? "Away"} score
              <input type="number" name="away_score" min="0" step="1" required value={awayScore} onChange={(event) => { setAwayScore(event.target.value); resetReview(); }} className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-3 text-sm text-white outline-none focus:border-[var(--vv-accent)] focus:ring-2 focus:ring-[var(--vv-accent)]/30" />
            </label>
            <label className="block text-xs font-bold text-white/70">
              {game?.homeName ?? "Home"} score
              <input type="number" name="home_score" min="0" step="1" required value={homeScore} onChange={(event) => { setHomeScore(event.target.value); resetReview(); }} className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-3 text-sm text-white outline-none focus:border-[var(--vv-accent)] focus:ring-2 focus:ring-[var(--vv-accent)]/30" />
            </label>
          </div>
        </fieldset>
      ) : (
        <>
          <input type="hidden" name="away_score" value="" />
          <input type="hidden" name="home_score" value="" />
        </>
      )}

      {resultType === "forfeit" ? (
        <fieldset className="rounded-xl border border-white/10 bg-black/25 p-4">
          <legend className="px-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/55">Authoritative forfeit winner</legend>
          <p className="mb-3 text-xs leading-5 text-white/45">Select the school named by the official ruling. Displayed scores never determine a forfeit winner.</p>
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

      <label className="block">
        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-white/55">Required audit reason</span>
        <textarea
          name="reason"
          required
          maxLength={500}
          rows={3}
          value={reason}
          onChange={(event) => { setReason(event.target.value); resetReview(); }}
          placeholder="Cite the authoritative ruling or explain why this correction is necessary."
          className="mt-2 w-full rounded-xl border border-white/15 bg-black/50 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[var(--vv-accent)] focus:ring-2 focus:ring-[var(--vv-accent)]/30"
        />
      </label>

      <div className="rounded-xl border border-sky-300/15 bg-sky-300/[0.06] p-4 text-xs leading-5 text-sky-50/80">
        Ties and no-contests are VOID for Pick ’Em. Existing member selections are always preserved. Grades and week/season totals are recalculated from the authoritative outcome.
      </div>

      {clientError ? <p role="alert" className="rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{clientError}</p> : null}

      {reviewing && game ? (
        <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-amber-100/70">Confirm canonical correction</p>
          <p className="mt-2 text-sm leading-6 text-amber-50">{canonicalOutcomeSummary(game, resultType, winnerSlug)}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" className="rounded-full bg-amber-200 px-5 py-2.5 text-xs font-black text-black outline-none transition hover:bg-amber-100 focus:ring-2 focus:ring-white">Confirm and apply</button>
            <button type="button" onClick={() => setReviewing(false)} className="rounded-full border border-white/15 px-5 py-2.5 text-xs font-black text-white/70 outline-none transition hover:bg-white/10 focus:ring-2 focus:ring-white">Edit details</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={review} className="rounded-full border border-amber-300/30 bg-amber-300/10 px-5 py-2.5 text-xs font-black text-amber-50 outline-none transition hover:bg-amber-300/15 focus:ring-2 focus:ring-amber-200">Review outcome change</button>
      )}
    </form>
  );
}
