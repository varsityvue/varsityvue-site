"use client";

import { useEffect, useReducer, useRef, useState, useTransition, type FormEvent } from "react";

import { savePickemDraft, savePickemSlate, type PickemActionState } from "@/app/pickem/actions";
import { PickemChoice, PickemGameHeader, PickemProgress } from "@/components/PickemSelectionCard";
import {
  canSubmitPickem,
  createPickemClientState,
  derivePickemClientState,
  isPickSelected,
  pickemClientReducer,
  shouldShowMobileSaveBar,
  shouldWarnBeforeUnload,
} from "@/lib/pickem-client-state";

export type PickemSlateGame = {
  id: string;
  gameId: string;
  awayName: string;
  awaySlug: string;
  awayMark: string;
  awayColor: string;
  awayLogoUrl?: string;
  awayLogoFilter?: string;
  homeName: string;
  homeSlug: string;
  homeMark: string;
  homeColor: string;
  homeLogoUrl?: string;
  homeLogoFilter?: string;
  kickoffLabel: string;
  locked: boolean;
  savedSlug?: string;
  selectedSlug?: string;
};

const initialActionState: PickemActionState = { status: "idle", message: "" };

export default function PickemSlateForm({
  weekId,
  games,
  contest,
  tiebreaker,
  saveAction = savePickemSlate,
  saveDraftAction = savePickemDraft,
}: {
  weekId: string;
  games: PickemSlateGame[];
  contest?: { entered: boolean; completedAt?: string; status?: string };
  tiebreaker?: { matchup: string; savedPrediction?: number; locked?: boolean };
  saveAction?: (previousState: PickemActionState, formData: FormData) => Promise<PickemActionState>;
  saveDraftAction?: (previousState: PickemActionState, formData: FormData) => Promise<PickemActionState>;
}) {
  const [transitionPending, startTransition] = useTransition();
  const submittingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLParagraphElement>(null);
  const [prediction, setPrediction] = useState(tiebreaker?.savedPrediction?.toString() ?? "");
  const [savedPrediction, setSavedPrediction] = useState(tiebreaker?.savedPrediction?.toString() ?? "");
  const [state, dispatch] = useReducer(
    pickemClientReducer,
    undefined,
    () => createPickemClientState(
      Object.fromEntries(games.flatMap((game) => game.selectedSlug ? [[game.id, game.selectedSlug]] : [])),
      Object.fromEntries(games.flatMap((game) => game.savedSlug ? [[game.id, game.savedSlug]] : [])),
    ),
  );
  const derived = derivePickemClientState(games, state);
  const pending = state.saveStatus === "pending" || transitionPending;
  const hasUnsavedChanges = derived.hasUnsavedChanges || Boolean(tiebreaker && prediction !== savedPrediction);
  const canSubmit = (contest && !contest.entered
    ? derived.totalGames > 0 && derived.selectedCount === derived.totalGames
      && (!tiebreaker || prediction.trim() !== "")
    : canSubmitPickem(state, hasUnsavedChanges) || Boolean(tiebreaker && hasUnsavedChanges && derived.selectedCount > 0)) && !transitionPending;
  const showMobileSaveBar = shouldShowMobileSaveBar(hasUnsavedChanges);

  useEffect(() => {
    if (!shouldWarnBeforeUnload(hasUnsavedChanges)) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (state.saveStatus === "success") {
      statusRef.current?.focus({ preventScroll: true });
    }
  }, [state.saveStatus]);

  const action = (formData: FormData) => {
    if (!canSubmit || submittingRef.current) return;
    submittingRef.current = true;
    dispatch({ type: "save-start" });
    startTransition(async () => {
      try {
        const nextState = await saveAction(initialActionState, formData);
        if (nextState.status === "success") setSavedPrediction(prediction);
        dispatch(nextState.status === "success"
          ? { type: "save-success", message: nextState.message }
          : { type: "save-error", message: nextState.message });
      } catch {
        dispatch({ type: "save-error", message: "Your picks could not be saved. Try again." });
      } finally {
        submittingRef.current = false;
      }
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    action(new FormData(event.currentTarget));
  };

  const saveDraft = () => {
    if (!contest || contest.entered || !derived.hasUnsavedChanges || submittingRef.current || !formRef.current) return;
    submittingRef.current = true;
    dispatch({ type: "save-start" });
    const formData = new FormData(formRef.current);
    startTransition(async () => {
      try {
        const nextState = await saveDraftAction(initialActionState, formData);
        dispatch(nextState.status === "success"
          ? { type: "save-success", message: nextState.message }
          : { type: "save-error", message: nextState.message });
      } catch {
        dispatch({ type: "save-error", message: "Your draft could not be saved. Try again." });
      } finally {
        submittingRef.current = false;
      }
    });
  };

  const statusMessage = pending
    ? "Saving your picks…"
    : state.message || (derived.savedPickCount > 0
      ? `${derived.savedPickCount} pick${derived.savedPickCount === 1 ? " is" : "s are"} saved. Change any unlocked pick and save again before kickoff.`
      : "Selections remain editable until each game’s kickoff.");
  const standardSaveLabel = contest && !contest.entered ? "Submit Contest Entry" : pending
    ? "Saving…"
    : !derived.hasUnsavedChanges
      ? derived.savedPickCount > 0 ? "Picks Saved" : "Save My Picks"
      : derived.savedPickCount > 0
        ? "Save Changes"
        : "Save My Picks";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={`mt-5 sm:mt-7 ${showMobileSaveBar ? "pb-24 sm:pb-0" : ""}`}>
      <input type="hidden" name="week_id" value={weekId} />
      {contest && <div className="mb-4 rounded-xl border border-white/15 bg-black/35 p-4">
        {contest.entered ? <p className="text-sm font-bold text-emerald-200">Entry completed {contest.completedAt ? new Date(contest.completedAt).toLocaleString("en-US", { timeZone: "America/Chicago", timeZoneName: "short" }) : ""}. Edits do not change your entry time.</p> : <><label htmlFor="mobile_phone" className="block text-sm font-black">Mobile phone number required to enter</label><input id="mobile_phone" name="mobile_phone" type="tel" autoComplete="tel-national" inputMode="tel" required placeholder="(254) 555-1234" className="mt-3 w-full max-w-xs rounded-xl border border-white/15 bg-[#161616] px-4 py-3 text-base text-white" /><p className="mt-2 text-xs text-white/50">One entry per person. We use this number to deter duplicates and contact a winner. Number ownership is not SMS verified. Your number will not appear publicly.</p></>}
        {contest.status === "disqualified" && <p role="alert" className="mt-2 text-sm text-red-200">This entry is ineligible. Contact VarsityVue for review.</p>}
      </div>}
      {tiebreaker && <div className="mb-4 rounded-xl border border-white/15 bg-black/35 p-4"><label htmlFor="predicted_total" className="block text-sm font-black">Game of the Week total points · {tiebreaker.matchup}</label><p className="mt-1 text-xs text-white/50">Predict both teams’ combined score. Closest prediction breaks a weekly points tie.{tiebreaker.locked ? " Prediction locked at kickoff." : ""}</p><input id="predicted_total" name="predicted_total" type="number" min="0" max="300" step="1" required readOnly={tiebreaker.locked} value={prediction} onChange={(event) => setPrediction(event.target.value)} className="mt-3 w-full max-w-xs rounded-xl border border-white/15 bg-[#161616] px-4 py-3 text-base text-white" /></div>}
      <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
        <PickemProgress selectedCount={derived.selectedCount} totalGames={derived.totalGames} />
        {hasUnsavedChanges ? <span className="text-[9px] font-black uppercase tracking-[0.1em] text-[var(--vv-accent)]">Not saved</span> : null}
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {games.map((game, index) => {
          const lockedMessageId = `pickem-${game.id}-locked`;
          return (
          <fieldset key={game.id} disabled={game.locked || pending} className={`min-w-0 rounded-[1.2rem] border p-3.5 sm:rounded-[1.5rem] sm:p-5 ${game.locked ? "border-white/15 bg-white/[0.025]" : "border-white/10 bg-black/25"}`}>
            <legend className="sr-only">{game.awayName} at {game.homeName}</legend>
            <PickemGameHeader index={index} kickoffLabel={game.kickoffLabel} locked={game.locked} lockedMessageId={lockedMessageId} />
            <div className="mt-3 grid grid-cols-2 gap-2">
              <PickemChoice name={`pick_${game.id}`} slug={game.awaySlug} team={game.awayName} label="Away" mark={game.awayMark} color={game.awayColor} logoUrl={game.awayLogoUrl} logoFilter={game.awayLogoFilter} checked={isPickSelected(state.selections, game.id, game.awaySlug)} locked={game.locked} lockedMessageId={lockedMessageId} onSelect={() => dispatch({ type: "select", gameId: game.id, schoolSlug: game.awaySlug, locked: game.locked })} />
              <PickemChoice name={`pick_${game.id}`} slug={game.homeSlug} team={game.homeName} label="Home" mark={game.homeMark} color={game.homeColor} logoUrl={game.homeLogoUrl} logoFilter={game.homeLogoFilter} checked={isPickSelected(state.selections, game.id, game.homeSlug)} locked={game.locked} lockedMessageId={lockedMessageId} onSelect={() => dispatch({ type: "select", gameId: game.id, schoolSlug: game.homeSlug, locked: game.locked })} />
            </div>
          </fieldset>
        );})}
      </div>

      {showMobileSaveBar ? (
        <div className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[#080808]/95 p-3 shadow-2xl backdrop-blur-xl sm:hidden">
          <p className="text-xs font-bold text-white/70">{derived.pendingChangeCount} change{derived.pendingChangeCount === 1 ? "" : "s"} pending</p>
          {contest && !contest.entered && <button type="button" onClick={saveDraft} disabled={pending || !derived.hasUnsavedChanges} className="shrink-0 rounded-xl border border-white/25 px-3 py-2.5 text-[10px] font-black text-white disabled:opacity-50">Save Draft</button>}
          <button type="submit" disabled={!canSubmit} className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50">
            {pending ? "Saving…" : contest && !contest.entered ? "Enter" : "Save Changes"}
          </button>
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-white/15 bg-[#080808]/95 p-3 shadow-2xl sm:mt-6 sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-4">
        <p ref={statusRef} tabIndex={-1} role={state.saveStatus === "error" ? "alert" : "status"} aria-live={state.saveStatus === "error" ? "assertive" : "polite"} className={`text-xs leading-5 focus:outline-none ${state.saveStatus === "error" ? "text-red-200" : state.saveStatus === "success" ? "text-emerald-200" : "text-white/45"}`}>
          {statusMessage}
        </p>
        {contest && !contest.entered && <button type="button" onClick={saveDraft} disabled={pending || !derived.hasUnsavedChanges} className="mt-3 w-full rounded-xl border border-white/25 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white disabled:opacity-50 sm:mt-0 sm:w-auto">Save Draft</button>}
        <button type="submit" disabled={!canSubmit} className="mt-3 w-full rounded-xl bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto sm:shrink-0">
          {standardSaveLabel}
        </button>
      </div>
    </form>
  );
}
