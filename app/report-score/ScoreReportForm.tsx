"use client";

import { useMemo, useState } from "react";

import { submitScore } from "./actions";

type TeamVisualIdentity = {
  abbreviation: string;
  mascot: string;
  primary: string;
  secondary: string;
  logoPath: string | null;
} | null;

type PendingReport = {
  awayScore: number;
  homeScore: number;
  gameStatus: string;
  period: string | null;
  clock: string | null;
  createdAt: string;
} | null;

type ScoreGameOption = {
  id: string;
  week?: number;
  awayName: string;
  homeName: string;
  awayIdentity: TeamVisualIdentity;
  homeIdentity: TeamVisualIdentity;
  status: "live" | "scheduled";
  pendingReport: PendingReport;
};

type Props = {
  games: ScoreGameOption[];
  selectedGameId: string;
  disabled: boolean;
  restricted: boolean;
};

function TeamMark({ name, identity }: { name: string; identity: TeamVisualIdentity }) {
  if (!identity) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/35 text-lg font-black text-white/50">
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }

  if (identity.logoPath) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/35 p-1.5">
        <img src={identity.logoPath} alt={`${name} logo`} className="h-full w-full object-contain" />
      </div>
    );
  }

  return (
    <div className="w-16 shrink-0 overflow-hidden rounded-2xl border-[2px] border-black bg-black shadow-lg">
      <div className="relative flex min-h-11 items-center justify-center px-1 py-2 text-center font-black uppercase leading-none" style={{ color: identity.primary, WebkitTextStroke: `1px ${identity.secondary}`, textShadow: "1px 1px 0 #000, -1px -1px 0 #000" }}>
        <span className="text-base tracking-[-0.04em]">{identity.abbreviation}</span>
      </div>
      <div className="flex min-h-5 items-center justify-center border-t-2 border-black bg-[#0b0b0b] px-1 py-1 text-center text-[6px] font-black uppercase leading-none" style={{ color: identity.secondary }}>
        {identity.mascot}
      </div>
    </div>
  );
}

function formatPendingContext(report: NonNullable<PendingReport>) {
  if (report.gameStatus === "final") return "Final";
  return [report.period || "Live", report.clock].filter(Boolean).join(" · ");
}

export default function ScoreReportForm({ games, selectedGameId, disabled, restricted }: Props) {
  const initialGame = games.find((game) => game.id === selectedGameId);
  const [gameId, setGameId] = useState(selectedGameId);
  const [gameStatus, setGameStatus] = useState<"live" | "final">(initialGame?.status === "scheduled" ? "final" : "live");
  const [period, setPeriod] = useState("");
  const [clock, setClock] = useState("");
  const selectedGame = useMemo(() => games.find((game) => game.id === gameId), [games, gameId]);

  const awayLabel = selectedGame ? `${selectedGame.awayName} score` : "Away score";
  const homeLabel = selectedGame ? `${selectedGame.homeName} score` : "Home score";

  function handleGameChange(value: string) {
    setGameId(value);
    const nextGame = games.find((game) => game.id === value);
    setGameStatus(nextGame?.status === "scheduled" ? "final" : "live");
    setPeriod("");
    setClock("");
  }

  function handleStatusChange(value: "live" | "final") {
    setGameStatus(value);
    if (value === "final") {
      setPeriod("");
      setClock("");
    }
  }

  if (games.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
        <p className="text-sm font-black text-white">No games are open for score reporting right now.</p>
        <p className="mt-2 text-xs leading-5 text-white/45">
          Games open automatically at kickoff and remain available after the live window when a verified final is still needed.
        </p>
      </div>
    );
  }

  return (
    <form action={submitScore} className="space-y-5">
      <div>
        <label htmlFor="game_id" className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">
          Game
        </label>
        <select
          id="game_id"
          name="game_id"
          required
          value={gameId}
          onChange={(event) => handleGameChange(event.target.value)}
          disabled={disabled}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--vv-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          <option value="" disabled>Select a game</option>
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              Week {game.week}: {game.awayName} at {game.homeName} · {game.status === "live" ? "Live" : "Awaiting result"}{game.pendingReport ? " · Pending report" : ""}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs leading-5 text-white/35">
          {restricted
            ? "Only identity-ready games involving one of your assigned programs are shown."
            : "Only games with complete team identity data are available for score reporting."}
        </p>
      </div>

      {selectedGame ? (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col items-center text-center">
              <TeamMark name={selectedGame.awayName} identity={selectedGame.awayIdentity} />
              <p className="mt-2 line-clamp-2 text-xs font-black text-white sm:text-sm">{selectedGame.awayName}</p>
              <span className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/30">Away</span>
            </div>

            <div className="shrink-0 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/30">Week {selectedGame.week}</p>
              <p className="mt-1 text-sm font-black text-white/60">AT</p>
            </div>

            <div className="flex min-w-0 flex-1 flex-col items-center text-center">
              <TeamMark name={selectedGame.homeName} identity={selectedGame.homeIdentity} />
              <p className="mt-2 line-clamp-2 text-xs font-black text-white sm:text-sm">{selectedGame.homeName}</p>
              <span className="mt-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/30">Home</span>
            </div>
          </div>
        </div>
      ) : null}

      {selectedGame?.pendingReport ? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] px-4 py-3 text-sm leading-6 text-amber-50/85">
          <p className="font-black">You already have a report pending for this game.</p>
          <p className="mt-1 text-xs leading-5 text-amber-50/60">
            {selectedGame.awayName} {selectedGame.pendingReport.awayScore} · {selectedGame.homeName} {selectedGame.pendingReport.homeScore} · {formatPendingContext(selectedGame.pendingReport)}
          </p>
          <p className="mt-1 text-xs leading-5 text-amber-50/50">Send another update only if the score or game status has changed. Exact duplicate reports are blocked.</p>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="away_score" className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">{awayLabel}</label>
          <input id="away_score" name="away_score" type="number" min="0" max="150" required disabled={disabled} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white focus:border-[var(--vv-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40" />
        </div>
        <div>
          <label htmlFor="home_score" className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">{homeLabel}</label>
          <input id="home_score" name="home_score" type="number" min="0" max="150" required disabled={disabled} className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white focus:border-[var(--vv-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40" />
        </div>
      </div>

      <div>
        <label htmlFor="game_status" className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Status</label>
        <select
          id="game_status"
          name="game_status"
          value={gameStatus}
          onChange={(event) => handleStatusChange(event.target.value as "live" | "final")}
          disabled={disabled}
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[var(--vv-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
        >
          <option value="live">Live</option>
          <option value="final">Final</option>
        </select>
      </div>

      {gameStatus === "live" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="period" className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Quarter / Period</label>
            <input
              id="period"
              name="period"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              placeholder="3rd"
              disabled={disabled}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-white/25 focus:border-[var(--vv-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            />
          </div>
          <div>
            <label htmlFor="clock" className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">Clock</label>
            <input
              id="clock"
              name="clock"
              value={clock}
              onChange={(event) => setClock(event.target.value)}
              placeholder="4:21"
              disabled={disabled}
              className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-white placeholder:text-white/25 focus:border-[var(--vv-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-3 text-sm leading-6 text-emerald-50/75">
          Final score selected. Quarter and clock are not needed and will not be saved with this report.
        </div>
      )}

      <div>
        <label htmlFor="source_note" className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-white/45">How do you know? <span className="font-normal normal-case tracking-normal text-white/30">Optional</span></label>
        <textarea id="source_note" name="source_note" rows={3} disabled={disabled} placeholder="At the game, radio broadcast, school stream, scoreboard photo, etc." className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-6 text-white placeholder:text-white/25 focus:border-[var(--vv-accent)] focus:outline-none disabled:cursor-not-allowed disabled:opacity-40" />
      </div>

      <button type="submit" disabled={disabled} className="w-full rounded-full bg-[var(--vv-primary)] px-6 py-3.5 text-sm font-black transition hover:bg-[#93142a] disabled:cursor-not-allowed disabled:opacity-35">
        {gameStatus === "final" ? "Submit Final Score" : "Submit Live Update"}
      </button>
    </form>
  );
}
