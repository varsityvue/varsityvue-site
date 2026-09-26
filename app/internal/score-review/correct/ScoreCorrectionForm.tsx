"use client";

import { useState } from "react";
import { correctScore } from "./actions";

type Props = { gameId: string; awayName: string; homeName: string; state: {
  status: string; away_score: number | null; home_score: number | null; period: string | null;
  clock: string | null; updated_at: string; outcome_revision: number; result_type: string | null;
}; isAdmin: boolean };

export default function ScoreCorrectionForm({ gameId, awayName, homeName, state, isAdmin }: Props) {
  const [status, setStatus] = useState(state.status === "scheduled" ? "upcoming" : state.status);
  const [away, setAway] = useState(String(state.away_score ?? 0));
  const [home, setHome] = useState(String(state.home_score ?? 0));
  const [period, setPeriod] = useState(state.period ?? "");
  const [clock, setClock] = useState(state.clock ?? "");
  const [review, setReview] = useState(false);
  const priorFinal = state.status === "final";
  const inputClass = "mt-1 w-full rounded-xl border border-white/20 bg-black/60 px-3 py-3 text-base text-white";
  return <form action={correctScore} className="mt-6 grid max-w-xl gap-4 rounded-2xl border border-white/15 bg-white/[0.04] p-4 sm:p-6">
    <input type="hidden" name="game_id" value={gameId}/>
    <input type="hidden" name="expected_updated_at" value={state.updated_at}/>
    <input type="hidden" name="expected_outcome_revision" value={state.outcome_revision}/>
    <input type="hidden" name="prior_final" value={String(priorFinal)}/>
    <input type="hidden" name="confirmed" value={review ? "yes" : "no"}/>
    <p className="text-sm text-white/60">Current: {awayName} {state.away_score ?? "—"} · {homeName} {state.home_score ?? "—"} · {state.status}{state.period ? ` · ${state.period}` : ""}{state.clock ? ` · ${state.clock}` : ""}</p>
    {priorFinal && <p className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">You are correcting a finalized result. This can change the winner and recalculate Pick ’Em grades and standings. The original FINAL alert will not be resent.</p>}
    <div className="grid grid-cols-2 gap-3">
      <label className="text-sm">{awayName} score<input className={inputClass} type="number" name="away_score" min="0" max="150" required value={away} onChange={e => { setAway(e.target.value); setReview(false); }}/></label>
      <label className="text-sm">{homeName} score<input className={inputClass} type="number" name="home_score" min="0" max="150" required value={home} onChange={e => { setHome(e.target.value); setReview(false); }}/></label>
    </div>
    <label className="text-sm">Game status<select className={inputClass} name="status" value={status} onChange={e => { setStatus(e.target.value); setReview(false); }}>
      {!priorFinal && <option value="upcoming">Upcoming</option>}
      {!priorFinal && <option value="live">Live</option>}
      {isAdmin && <option value="final">Final</option>}
    </select></label>
    <div className="grid grid-cols-2 gap-3">
      <label className="text-sm">Quarter / period<input className={inputClass} name="period" maxLength={30} value={period} onChange={e => { setPeriod(e.target.value); setReview(false); }}/></label>
      <label className="text-sm">Game clock<input className={inputClass} name="clock" maxLength={30} value={clock} onChange={e => { setClock(e.target.value); setReview(false); }}/></label>
    </div>
    <p className="text-xs text-white/50">Overtime is recorded using the existing period field (for example, OT or 2OT).</p>
    <label className="text-sm">Correction reason<input className={inputClass} name="reason" maxLength={500} required onChange={() => setReview(false)} placeholder="Source and reason for the change"/></label>
    {review ? <div className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-4 text-sm"><p className="font-bold">Confirm {priorFinal ? "final result correction" : "score correction"}</p><p className="mt-2">{awayName} {away} · {homeName} {home} · {status}{period ? ` · ${period}` : ""}{clock ? ` · ${clock}` : ""}</p><button type="submit" className="mt-4 w-full rounded-xl bg-amber-400 px-4 py-3 font-bold text-black">Save confirmed correction</button><button type="button" onClick={() => setReview(false)} className="mt-2 w-full rounded-xl border border-white/20 px-4 py-3">Back to edit</button></div> : <button type="button" onClick={() => setReview(true)} className="rounded-xl bg-white px-4 py-3 font-bold text-black">Review correction</button>}
  </form>;
}
