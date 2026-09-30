import type { Game } from "@/types/platform";
import { PICKEM_PRESENTING_SPONSOR, PICKEM_RULES_VERSION } from "@/lib/pickem-admin-configuration";

export type ConfiguredPickemWeek = {
  id: string; week: number; title: string; status: string; configuration_revision: number;
  tiebreaker_game_id: string | null; opens_at: string | null; closes_at: string | null;
  entry_deadline_at: string | null; outcome_resolution_at: string | null;
  official_rules_version: string | null; official_rules_published_at: string | null;
  presenting_sponsor_name: string | null;
  pickem_games: { id: string; game_id: string; sort_order: number; lock_at: string; graded_at: string | null }[];
};

type Props = {
  now: number; week: number; games: Game[]; configured?: ConfiguredPickemWeek;
  revisions: Record<string, number>; unavailable: boolean;
  saveAction: (data: FormData) => void | Promise<void>;
  openAction: (data: FormData) => void | Promise<void>;
};

function gameLabel(games: Game[], id: string) {
  const game = games.find((candidate) => candidate.id === id);
  return game ? `${game.awayTeam} at ${game.homeTeam}` : id || "Not set";
}

function central(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString("en-US", { timeZone: "America/Chicago", dateStyle: "medium", timeStyle: "short" }) : "Not set";
}

export function PickemWeekSetup({ now, week, games, configured, revisions, unavailable, saveAction, openAction }: Props) {
  const selected = new Set(configured?.pickem_games.map((game) => game.game_id));
  const tiebreaker = configured?.pickem_games.find((game) => game.id === configured.tiebreaker_game_id)?.game_id ?? "";
  const readOnly = unavailable || Boolean(configured && (configured.status !== "draft" || configured.opens_at || configured.entry_deadline_at
    || configured.pickem_games.some((game) => game.graded_at || Date.parse(game.lock_at) <= now)));
  return <section className="min-w-0 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="text-2xl font-black">Week {week}</h2><span className="rounded-full border border-white/10 px-3 py-1.5 text-xs">{configured?.status ?? "Not configured"}</span></div>
    {readOnly ? <div className="mt-4 space-y-2 text-sm text-white/70">
      <p role="status">Read-only: published or unavailable contests cannot be changed in setup. Use the dedicated audited operations for corrections and winner administration.</p>
      <p>{configured?.title ?? "Configuration unavailable"}</p>
      <p>Pick ’Em tiebreaker: {gameLabel(games, tiebreaker)}</p>
      <p>Presented by {configured?.presenting_sponsor_name ?? "Not set"} · Rules: {configured?.official_rules_version ?? "Not set"}</p>
      <p>New-entry deadline: {central(configured?.entry_deadline_at)} Central</p>
      <p>Opens: {central(configured?.opens_at)} · Closes: {central(configured?.closes_at)} Central</p>
      <p>Outcome resolution: {central(configured?.outcome_resolution_at)} Central</p>
      <ul className="space-y-2">{configured?.pickem_games.map((row) => <li key={row.id} className="break-words">{gameLabel(games, row.game_id)} · locks {central(row.lock_at)} Central</li>)}</ul>
    </div> : <>
      <form action={saveAction} className="mt-4">
        <input type="hidden" name="season" value="2026" /><input type="hidden" name="week" value={week} />
        <input type="hidden" name="configuration_revision" value={configured?.configuration_revision ?? -1} />
        <label className="block text-sm">Slate title<input name="title" required maxLength={150} defaultValue={configured?.title ?? `Week ${week} Pick ’Em`} className="mt-2 w-full rounded-xl border border-white/15 bg-black/35 px-4 py-3" /></label>
        <p className="mt-4 text-sm text-white/65">Choose 1–12 games. Save a draft first; saving does not publish it.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">{games.map((game) => <label key={game.id} className="flex min-w-0 items-start gap-3 rounded-xl border border-white/10 p-3">
          <input type="hidden" name={`schedule_revision:${game.id}`} value={revisions[game.id] ?? 0} />
          <input type="checkbox" name="game_id" value={game.id} defaultChecked={selected.has(game.id)} className="mt-1 h-4 w-4 shrink-0" />
          <span className="min-w-0 text-sm"><strong className="block">{game.awayTeam} at {game.homeTeam}</strong><span className="text-xs text-white/50">{central(game.kickoff)} Central</span></span>
        </label>)}</div>
        <label className="mt-4 block text-sm">Pick ’Em tiebreaker game<select name="tiebreaker_game_id" required defaultValue={tiebreaker} className="mt-2 w-full min-w-0 rounded-xl border border-white/15 bg-[#111] px-3 py-3">
          <option value="">Select one included game</option>{games.map((game) => <option key={game.id} value={game.id}>{game.awayTeam} at {game.homeTeam}</option>)}
        </select></label>
        <p className="mt-2 text-xs text-white/55">Select a game included in this slate. This designation is independent of the editorial Game of the Week and homepage feature.</p>
        {week >= 6 && <p className="mt-4 text-sm text-white/70">Presented by {PICKEM_PRESENTING_SPONSOR} · Approved rules: {PICKEM_RULES_VERSION}</p>}
        <button type="submit" disabled={games.length === 0} className="mt-5 rounded-full border border-white/20 px-5 py-3 text-sm font-bold disabled:opacity-40">Save draft</button>
      </form>
      {configured && <form action={openAction} className="mt-6 border-t border-white/10 pt-5">
        <input type="hidden" name="week_id" value={configured.id} /><input type="hidden" name="configuration_revision" value={configured.configuration_revision} />
        <input type="hidden" name="schedule_revisions" value={JSON.stringify(Object.fromEntries(configured.pickem_games.map((game) => [game.game_id, revisions[game.game_id] ?? 0])))} />
        <p className="text-sm text-amber-100">Opening publishes the saved draft and freezes the new-entry deadline at its earliest kickoff. A later published week becomes the public Pick ’Em contest. Save any edits before opening.</p>
        <p className="mt-2 text-xs text-white/60">Saved draft: {configured.pickem_games.length} games · Tiebreaker: {gameLabel(games, tiebreaker)}</p>
        <label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" name="confirm_open" value="yes" required className="mt-1 h-4 w-4 shrink-0" /><span>I reviewed the saved draft and intend to make this week public now.</span></label>
        <button type="submit" className="mt-4 rounded-full bg-white px-5 py-3 text-sm font-bold text-black">Open saved draft</button>
      </form>}
    </>}
  </section>;
}
