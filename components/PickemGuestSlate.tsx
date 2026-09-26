"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import { useReducer } from "react";

import type { PickemSlateGame } from "@/components/PickemSlateForm";
import { PickemChoice, PickemGameHeader, PickemProgress } from "@/components/PickemSelectionCard";
import { createPickemClientState, derivePickemClientState, isPickSelected, pickemClientReducer } from "@/lib/pickem-client-state";

export default function PickemGuestSlate({ games }: { games: PickemSlateGame[] }) {
  const [state, dispatch] = useReducer(
    pickemClientReducer,
    undefined,
    () => createPickemClientState(
      Object.fromEntries(games.flatMap((game) => game.selectedSlug ? [[game.gameId, game.selectedSlug]] : [])),
      {},
    ),
  );
  const guestGames = games.map((game) => ({ id: game.gameId, locked: game.locked }));
  const derived = derivePickemClientState(guestGames, state);
  const unlockedCount = games.filter((game) => !game.locked).length;
  const intent = games
    .filter((game) => state.selections[game.gameId])
    .map((game) => `${game.gameId}~${state.selections[game.gameId]}`)
    .join("|");
  const returnPath = intent ? `/pickem?intent=${encodeURIComponent(intent)}` : "/pickem";
  const loginHref = `/login?next=${encodeURIComponent(returnPath)}&source=pickem`;
  const signupHref = `/login?mode=signup&next=${encodeURIComponent(returnPath)}&source=pickem`;

  const trackRegistrationIntent = (mode: "login" | "signup") => {
    track("Pick Registration Intent", {
      mode,
      picks: derived.selectedCount,
      complete: derived.allPicksMade,
    });
  };

  return (
    <section className="mt-5 rounded-[1.5rem] border border-[var(--vv-accent)]/25 bg-white/[0.045] p-4 shadow-xl sm:mt-7 sm:p-7">
      <div className="text-center">
        <h2 className="text-xl font-black sm:text-2xl">{unlockedCount > 0 ? "Choose Your Winners" : "This Week’s Matchups"}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-white/50">{unlockedCount > 0 ? `Make all ${unlockedCount} picks now. Create a free account when you’re ready to save them.` : "Selections are closed. Review the matchups and weekly standings below."}</p>
        {unlockedCount > 0 && <div className="mt-3 flex justify-center"><PickemProgress selectedCount={derived.selectedCount} totalGames={derived.totalGames} /></div>}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {games.map((game, index) => {
          const lockedMessageId = `guest-pickem-${game.id}-locked`;
          return (
          <fieldset key={game.id} disabled={game.locked} className={`min-w-0 rounded-[1.2rem] border p-3.5 sm:rounded-[1.5rem] sm:p-5 ${game.locked ? "border-white/15 bg-white/[0.025]" : "border-white/10 bg-black/25"}`}>
            <legend className="sr-only">{game.awayName} at {game.homeName}</legend>
            <PickemGameHeader index={index} kickoffLabel={game.kickoffLabel} locked={game.locked} lockedMessageId={lockedMessageId} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <PickemChoice name={`guest_${game.gameId}`} slug={game.awaySlug} team={game.awayName} label="Away" mark={game.awayMark} color={game.awayColor} logoUrl={game.awayLogoUrl} logoFilter={game.awayLogoFilter} checked={isPickSelected(state.selections, game.gameId, game.awaySlug)} locked={game.locked} lockedMessageId={lockedMessageId} onSelect={() => dispatch({ type: "select", gameId: game.gameId, schoolSlug: game.awaySlug, locked: game.locked })} />
              <PickemChoice name={`guest_${game.gameId}`} slug={game.homeSlug} team={game.homeName} label="Home" mark={game.homeMark} color={game.homeColor} logoUrl={game.homeLogoUrl} logoFilter={game.homeLogoFilter} checked={isPickSelected(state.selections, game.gameId, game.homeSlug)} locked={game.locked} lockedMessageId={lockedMessageId} onSelect={() => dispatch({ type: "select", gameId: game.gameId, schoolSlug: game.homeSlug, locked: game.locked })} />
            </div>
          </fieldset>
        );})}
      </div>

      {unlockedCount > 0 && <div className="sticky bottom-3 z-20 mt-4 rounded-2xl border border-white/15 bg-[#080808]/95 p-3 shadow-2xl backdrop-blur-xl sm:mt-6 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-4">
        <p className="text-xs leading-5 text-white/55"><span className="font-black text-white">{derived.selectedCount} of {derived.totalGames}</span> games selected{derived.allPicksMade ? " · Complete slate" : ""}</p>
        <div className="mt-3 flex gap-2 sm:mt-0">
          <Link href={loginHref} onClick={() => trackRegistrationIntent("login")} className={`flex-1 rounded-full border border-white/15 px-4 py-2.5 text-center text-[10px] font-black uppercase tracking-[0.1em] text-white/70 transition hover:bg-white/10 sm:flex-none ${derived.selectedCount === 0 ? "pointer-events-none opacity-40" : ""}`}>Log In</Link>
          <Link href={signupHref} onClick={() => trackRegistrationIntent("signup")} className={`flex-1 rounded-full bg-white px-4 py-2.5 text-center text-[10px] font-black uppercase tracking-[0.1em] text-black transition hover:bg-white/85 sm:flex-none ${derived.selectedCount === 0 ? "pointer-events-none opacity-40" : ""}`}>Save With Free Account →</Link>
        </div>
      </div>}
    </section>
  );
}
