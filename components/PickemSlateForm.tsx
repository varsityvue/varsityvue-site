"use client";

import Image from "next/image";
import { useState, useTransition } from "react";

import { savePickemSlate, type PickemActionState } from "@/app/pickem/actions";

export type PickemSlateGame = {
  id: string;
  gameId: string;
  awayName: string;
  awaySlug: string;
  awayMark: string;
  awayColor: string;
  awayLogoUrl?: string;
  awayLogoFilter?: string;
  awayLogoScale: number;
  homeName: string;
  homeSlug: string;
  homeMark: string;
  homeColor: string;
  homeLogoUrl?: string;
  homeLogoFilter?: string;
  homeLogoScale: number;
  kickoffLabel: string;
  locked: boolean;
  savedSlug?: string;
  selectedSlug?: string;
};

const initialState: PickemActionState = { status: "idle", message: "" };

export default function PickemSlateForm({
  weekId,
  games,
  savedPickCount,
}: {
  weekId: string;
  games: PickemSlateGame[];
  savedPickCount: number;
}) {
  const [state, setState] = useState<PickemActionState>(initialState);
  const [pending, startTransition] = useTransition();
  const [selections, setSelections] = useState<Record<string, string>>(() =>
    Object.fromEntries(games.flatMap((game) => game.selectedSlug ? [[game.id, game.selectedSlug]] : [])),
  );
  const [savedSelections, setSavedSelections] = useState<Record<string, string>>(() =>
    Object.fromEntries(games.flatMap((game) => game.savedSlug ? [[game.id, game.savedSlug]] : [])),
  );
  const hasUnsavedChanges = games.some(
    (game) => !game.locked && selections[game.id] !== savedSelections[game.id],
  );
  const action = (formData: FormData) => {
    startTransition(async () => {
      const nextState = await savePickemSlate(state, formData);
      setState(nextState);
      if (nextState.status === "success") {
        setSavedSelections(selections);
      }
    });
  };

  return (
    <form action={action} className="mt-5 sm:mt-7">
      <input type="hidden" name="week_id" value={weekId} />
      <div className="grid gap-3 lg:grid-cols-2">
        {games.map((game, index) => (
          <fieldset key={game.id} disabled={game.locked || pending} className="min-w-0 rounded-[1.2rem] border border-white/10 bg-black/25 p-3.5 disabled:opacity-60 sm:rounded-[1.5rem] sm:p-5">
            <legend className="sr-only">{game.awayName} at {game.homeName}</legend>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">Game {index + 1}</p>
              <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/45">{game.locked ? "Locked" : game.kickoffLabel}</p>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <PickChoice name={`pick_${game.id}`} slug={game.awaySlug} team={game.awayName} label="Away" mark={game.awayMark} color={game.awayColor} logoUrl={game.awayLogoUrl} logoFilter={game.awayLogoFilter} logoScale={game.awayLogoScale} checked={selections[game.id] === game.awaySlug} onSelect={() => setSelections((current) => ({ ...current, [game.id]: game.awaySlug }))} />
              <PickChoice name={`pick_${game.id}`} slug={game.homeSlug} team={game.homeName} label="Home" mark={game.homeMark} color={game.homeColor} logoUrl={game.homeLogoUrl} logoFilter={game.homeLogoFilter} logoScale={game.homeLogoScale} checked={selections[game.id] === game.homeSlug} onSelect={() => setSelections((current) => ({ ...current, [game.id]: game.homeSlug }))} />
            </div>
          </fieldset>
        ))}
      </div>

      <div className="sticky bottom-3 z-20 mt-4 rounded-2xl border border-white/15 bg-[#080808]/95 p-3 shadow-2xl backdrop-blur-xl sm:mt-6 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-4">
        <p role={state.status === "error" ? "alert" : "status"} aria-live="polite" className={`text-xs leading-5 ${state.status === "error" ? "text-red-200" : state.status === "success" ? "text-emerald-200" : "text-white/45"}`}>
          {state.message || (savedPickCount > 0
            ? `${savedPickCount} pick${savedPickCount === 1 ? " is" : "s are"} saved. Change any unlocked pick and save again before kickoff.`
            : "Selections remain editable until each game’s kickoff.")}
        </p>
        <button type="submit" disabled={pending || !hasUnsavedChanges || games.every((game) => game.locked)} className="mt-3 w-full rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto sm:shrink-0">
          {pending ? "Saving…" : !hasUnsavedChanges ? "Picks Saved" : savedPickCount > 0 ? "Save Changes" : "Save My Picks"}
        </button>
      </div>
    </form>
  );
}

function PickChoice({ name, slug, team, label, mark, color, logoUrl, logoFilter, logoScale, checked, onSelect }: { name: string; slug: string; team: string; label: string; mark: string; color: string; logoUrl?: string; logoFilter?: string; logoScale: number; checked: boolean; onSelect: () => void }) {
  return (
    <label className="group relative cursor-pointer">
      <input type="radio" name={name} value={slug} checked={checked} onChange={onSelect} className="peer sr-only" />
      <span className="flex min-h-24 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center transition group-hover:bg-white/[0.08] peer-checked:border-[var(--vv-accent)] peer-checked:bg-[var(--vv-primary)]/35 peer-checked:shadow-[inset_0_0_0_1px_rgba(242,184,75,0.16)] peer-focus-visible:ring-2 peer-focus-visible:ring-white/70">
        <TeamMark mark={mark} color={color} logoUrl={logoUrl} logoFilter={logoFilter} logoScale={logoScale}/><span className="mt-2 text-[8px] font-black uppercase tracking-[0.14em] text-white/35">{label}</span>
        <span className="mt-0.5 text-sm font-black leading-tight text-white sm:text-base">{team}</span>
      </span>
    </label>
  );
}

function TeamMark({ mark, color, logoUrl, logoFilter, logoScale }: { mark: string; color: string; logoUrl?: string; logoFilter?: string; logoScale: number }) {
  return logoUrl ? <span className="relative h-9 w-9"><Image src={logoUrl} alt="" fill sizes="36px" className="object-contain" style={{ filter: logoFilter, transform: `scale(${logoScale})` }}/></span> : <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-[9px] font-black text-white shadow-lg" style={{ backgroundColor: color }}>{mark.slice(0, 4)}</span>;
}
