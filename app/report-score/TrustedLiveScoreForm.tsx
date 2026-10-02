"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { submitAssignedLiveScore } from "./actions";

export type TrustedLiveGame = {
  id: string; awayName: string; homeName: string;
  awayScore: number; homeScore: number; period: string | null; clock: string | null;
  updatedAt: string; scoreRevision: number;
};
function PublishButton({ confirmationRequired }: { confirmationRequired: boolean }) {
  const { pending } = useFormStatus();
  return <button disabled={pending || confirmationRequired} className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-black disabled:opacity-40">{pending ? "Publishing…" : "Publish Trusted LIVE Update"}</button>;
}
function LiveForm({ game }: { game: TrustedLiveGame }) {
  const [away, setAway] = useState(String(game.awayScore));
  const [home, setHome] = useState(String(game.homeScore));
  const [confirmed, setConfirmed] = useState(false);
  const decreased = Number(away) < game.awayScore || Number(home) < game.homeScore;
  return <form action={submitAssignedLiveScore} className="mt-4 space-y-4">
    <input type="hidden" name="game_id" value={game.id} />
    <input type="hidden" name="expected_state_updated_at" value={game.updatedAt} />
    <input type="hidden" name="expected_state_revision" value={game.scoreRevision} />
    <p className="text-sm text-white/70">Current LIVE: {game.awayName} {game.awayScore} – {game.homeScore} {game.homeName}. This action publishes immediately.</p>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="min-w-0 text-sm">{game.awayName} (away)<input required name="away_score" type="number" min="0" max="150" value={away} onChange={(e) => { setAway(e.target.value); setConfirmed(false); }} className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 p-3" /></label>
      <label className="min-w-0 text-sm">{game.homeName} (home)<input required name="home_score" type="number" min="0" max="150" value={home} onChange={(e) => { setHome(e.target.value); setConfirmed(false); }} className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 p-3" /></label>
      <label className="text-sm">Quarter / overtime<input name="period" defaultValue={game.period ?? ""} placeholder="1st, 2nd, 3rd, 4th, OT, OT2…" maxLength={30} className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 p-3" /></label>
      <label className="text-sm">Clock<input name="clock" defaultValue={game.clock ?? ""} placeholder="12:00" pattern="((0?[0-9]|1[0-4]):[0-5][0-9]|15:00)" className="mt-1 w-full rounded-lg border border-white/20 bg-black/30 p-3" /><span className="text-xs text-white/60">Optional; 0:00 through 15:00.</span></label>
    </div>
    {decreased ? <label className="flex items-start gap-3 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100"><input required type="checkbox" name="confirm_score_decrease" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" />I confirm that a score is being reduced from the current LIVE score shown above.</label> : null}
    <PublishButton confirmationRequired={decreased && !confirmed} />
    <p className="text-xs leading-5 text-white/60">LIVE only. Submit a pending FINAL report below when the game ends; a moderator or administrator publishes FINAL.</p>
  </form>;
}
export default function TrustedLiveScoreForm({ games, selectedGameId }: { games: TrustedLiveGame[]; selectedGameId: string }) {
  const [selected, setSelected] = useState(games.some((g) => g.id === selectedGameId) ? selectedGameId : games[0]?.id ?? "");
  const game = games.find((g) => g.id === selected);
  return <section className="mt-6 rounded-[1.5rem] border border-emerald-300/20 bg-white/[0.04] p-5 sm:p-7">
    <h2 className="text-xl font-bold">Trusted LIVE Update</h2>
    <p className="mt-2 text-sm leading-6 text-white/60">Available only for an existing verified LIVE game covered by your active scorekeeper assignment.</p>
    <label className="mt-4 block text-sm">LIVE game<select value={selected} onChange={(e) => setSelected(e.target.value)} className="mt-1 w-full rounded-lg border border-white/20 bg-black p-3">{games.map((g) => <option key={g.id} value={g.id}>{g.awayName} at {g.homeName}</option>)}</select></label>
    {game ? <LiveForm key={`${game.id}:${game.updatedAt}:${game.scoreRevision}`} game={game} /> : null}
  </section>;
}
