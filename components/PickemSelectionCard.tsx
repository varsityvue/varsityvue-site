"use client";

import Image from "next/image";

export function PickemProgress({ selectedCount, totalGames }: { selectedCount: number; totalGames: number }) {
  const complete = totalGames > 0 && selectedCount === totalGames;
  return (
    <p aria-live="polite" className="text-xs font-bold text-white/55">
      {complete
        ? `All ${totalGames} pick${totalGames === 1 ? "" : "s"} made`
        : `${selectedCount} of ${totalGames} pick${totalGames === 1 ? "" : "s"} made`}
    </p>
  );
}

export function PickemGameHeader({
  index,
  kickoffLabel,
  locked,
  lockedMessageId,
}: {
  index: number;
  kickoffLabel: string;
  locked: boolean;
  lockedMessageId: string;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/35">Game {index + 1}</p>
        {locked ? (
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-white/15 bg-white/[0.06] px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/75">Locked</span>
            <span className="hidden text-[9px] font-black uppercase tracking-[0.12em] text-white/35 sm:inline">{kickoffLabel}</span>
          </div>
        ) : (
          <p className="text-[9px] font-black uppercase tracking-[0.12em] text-white/45">{kickoffLabel}</p>
        )}
      </div>
      {locked ? <p id={lockedMessageId} className="sr-only">This matchup is locked. Selections can no longer be changed.</p> : null}
    </>
  );
}

export function PickemChoice({
  name,
  slug,
  team,
  label,
  mark,
  color,
  logoUrl,
  logoFilter,
  checked,
  locked,
  lockedMessageId,
  onSelect,
}: {
  name: string;
  slug: string;
  team: string;
  label: string;
  mark: string;
  color: string;
  logoUrl?: string;
  logoFilter?: string;
  checked: boolean;
  locked: boolean;
  lockedMessageId: string;
  onSelect: () => void;
}) {
  return (
    <label className={`group relative ${locked ? "cursor-not-allowed" : "cursor-pointer"}`}>
      <input
        type="radio"
        name={name}
        value={slug}
        checked={checked}
        onChange={onSelect}
        aria-describedby={locked ? lockedMessageId : undefined}
        className="peer sr-only"
      />
      <span className="relative flex min-h-24 flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] px-2 py-3 text-center transition group-hover:bg-white/[0.08] peer-checked:border-[var(--vv-accent)] peer-checked:bg-[var(--vv-primary)]/35 peer-checked:shadow-[inset_0_0_0_1px_rgba(242,184,75,0.16)] peer-focus-visible:ring-2 peer-focus-visible:ring-white/70 peer-disabled:group-hover:bg-white/[0.04]">
        {checked ? <span aria-hidden="true" className="absolute right-2 top-2 text-[8px] font-black uppercase tracking-[0.08em] text-white/80">✓ Selected</span> : null}
        <TeamMark mark={mark} color={color} logoUrl={logoUrl} logoFilter={logoFilter} />
        <span className="mt-2 text-[8px] font-black uppercase tracking-[0.14em] text-white/35">{label}</span>
        <span className="mt-0.5 text-sm font-black leading-tight text-white sm:text-base">{team}</span>
      </span>
    </label>
  );
}

function TeamMark({ mark, color, logoUrl, logoFilter }: { mark: string; color: string; logoUrl?: string; logoFilter?: string }) {
  return logoUrl ? <span className="relative h-9 w-9"><Image src={logoUrl} alt="" fill sizes="36px" className="object-contain" style={{ filter: logoFilter }} /></span> : <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-[9px] font-black text-white shadow-lg" style={{ backgroundColor: color }}>{mark.slice(0, 4)}</span>;
}
