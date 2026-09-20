"use client";

import { track } from "@vercel/analytics";
import Image from "next/image";
import Link from "next/link";
import { useState, type Dispatch, type SetStateAction } from "react";

import type { PickemSlateGame } from "@/components/PickemSlateForm";

export default function PickemGuestSlate({ games }: { games: PickemSlateGame[] }) {
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    Object.fromEntries(games.flatMap((game) => game.selectedSlug ? [[game.gameId, game.selectedSlug]] : [])),
  );
  const selectedCount = Object.keys(selections).length;
  const unlockedCount = games.filter((game) => !game.locked).length;
  const intent = games
    .filter((game) => selections[game.gameId])
    .map((game) => `${game.gameId}~${selections[game.gameId]}`)
    .join("|");
  const returnPath = intent ? `/pickem?intent=${encodeURIComponent(intent)}` : "/pickem";
  const loginHref = `/login?next=${encodeURIComponent(returnPath)}&source=pickem`;
  const signupHref = `/login?mode=signup&next=${encodeURIComponent(returnPath)}&source=pickem`;

  const trackRegistrationIntent = (mode: "login" | "signup") => {
    track("Pick Registration Intent", {
      mode,
      picks: selectedCount,
      complete: selectedCount === unlockedCount,
    });
  };

  return (
    <section className="mt-5 rounded-[1.5rem] border border-[var(--vv-accent)]/25 bg-white/[0.045] p-4 shadow-xl sm:mt-7 sm:p-7">
      <div className="text-center">
        <h2 className="text-xl font-black sm:text-2xl">Choose Your Winners</h2>
        <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-white/50">Make all {unlockedCount} picks now. Create a free account when you’re ready to save them.</p>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        {games.map((game, index) => (
          <fieldset key={game.id} disabled={game.locked} className="min-w-0 rounded-[1.2rem] border border-white/10 bg-black/25 p-3.5 disabled:opacity-60 sm:rounded-[1.5rem] sm:p-5">
            <legend className="sr-only">{game.awayName} at {game.homeName}</legend>
            <div className="flex items-center justify-between gap-3"><p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">Game {index + 1}</p><p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/45">{game.locked ? "Locked" : game.kickoffLabel}</p></div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <GuestChoice gameId={game.gameId} slug={game.awaySlug} team={game.awayName} label="Away" mark={game.awayMark} color={game.awayColor} logoUrl={game.awayLogoUrl} logoFilter={game.awayLogoFilter} logoScale={game.awayLogoScale} checked={selections[game.gameId] === game.awaySlug} onSelect={setSelections} />
              <GuestChoice gameId={game.gameId} slug={game.homeSlug} team={game.homeName} label="Home" mark={game.homeMark} color={game.homeColor} logoUrl={game.homeLogoUrl} logoFilter={game.homeLogoFilter} logoScale={game.homeLogoScale} checked={selections[game.gameId] === game.homeSlug} onSelect={setSelections} />
            </div>
          </fieldset>
        ))}
      </div>

      <div className="sticky bottom-3 z-20 mt-4 rounded-2xl border border-white/15 bg-[#080808]/95 p-3 shadow-2xl backdrop-blur-xl sm:mt-6 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-4">
        <p className="text-xs leading-5 text-white/55"><span className="font-black text-white">{selectedCount} of {unlockedCount}</span> unlocked games selected{selectedCount === unlockedCount && unlockedCount > 0 ? " · Complete slate" : ""}</p>
        <div className="mt-3 flex gap-2 sm:mt-0">
          <Link href={loginHref} onClick={() => trackRegistrationIntent("login")} className={`flex-1 rounded-full border border-white/15 px-4 py-2.5 text-center text-[10px] font-black uppercase tracking-[0.1em] text-white/70 transition hover:bg-white/10 sm:flex-none ${selectedCount === 0 ? "pointer-events-none opacity-40" : ""}`}>Log In</Link>
          <Link href={signupHref} onClick={() => trackRegistrationIntent("signup")} className={`flex-1 rounded-full bg-white px-4 py-2.5 text-center text-[10px] font-black uppercase tracking-[0.1em] text-black transition hover:bg-white/85 sm:flex-none ${selectedCount === 0 ? "pointer-events-none opacity-40" : ""}`}>Save With Free Account →</Link>
        </div>
      </div>
    </section>
  );
}

function GuestChoice({ gameId, slug, team, label, mark, color, logoUrl, logoFilter, logoScale, checked, onSelect }: { gameId: string; slug: string; team: string; label: string; mark: string; color: string; logoUrl?: string; logoFilter?: string; logoScale: number; checked: boolean; onSelect: Dispatch<SetStateAction<Record<string, string>>> }) {
  return <label className="group relative cursor-pointer"><input type="radio" name={`guest_${gameId}`} value={slug} checked={checked} onChange={() => onSelect((current) => ({ ...current, [gameId]: slug }))} className="peer sr-only" /><span className="flex min-h-24 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center transition group-hover:bg-white/[0.08] peer-checked:border-[var(--vv-accent)] peer-checked:bg-[var(--vv-primary)]/35 peer-checked:shadow-[inset_0_0_0_1px_rgba(242,184,75,0.16)] peer-focus-visible:ring-2 peer-focus-visible:ring-white/70"><TeamMark mark={mark} color={color} logoUrl={logoUrl} logoFilter={logoFilter} logoScale={logoScale}/><span className="mt-2 text-[8px] font-black uppercase tracking-[0.14em] text-white/35">{label}</span><span className="mt-0.5 text-sm font-black leading-tight text-white sm:text-base">{team}</span>{checked ? <span className="mt-1 text-[8px] font-black uppercase tracking-[0.12em] text-[var(--vv-accent)]">Selected</span> : null}</span></label>;
}

function TeamMark({ mark, color, logoUrl, logoFilter, logoScale }: { mark: string; color: string; logoUrl?: string; logoFilter?: string; logoScale: number }) {
  return logoUrl ? <span className="relative h-9 w-9"><Image src={logoUrl} alt="" fill sizes="36px" className="object-contain" style={{ filter: logoFilter, transform: `scale(${logoScale})` }}/></span> : <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-[9px] font-black text-white shadow-lg" style={{ backgroundColor: color }}>{mark.slice(0, 4)}</span>;
}
