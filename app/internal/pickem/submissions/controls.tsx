"use client";
import { createContext, useContext, useRef, useActionState, useState, useTransition, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { initialAdminActionState, type AdminActionState } from '@/lib/pickem-admin-recovery';

const OperationContext = createContext<{ locked: boolean; acquire: () => boolean; release: () => void } | null>(null);

export function WeekNavigation({ weeks, selected, children }: { weeks: { id: string; season: number; week: number; status: string }[]; selected: string; children: ReactNode }) {
  const router = useRouter();
  const [value, setValue] = useState(selected);
  const operation = useRef(false);
  const [locked, setLocked] = useState(false);
  const changed = value !== selected;
  const [pending, startTransition] = useTransition();
  return <OperationContext.Provider value={{ locked, acquire: () => { if (operation.current) return false; operation.current = true; setLocked(true); return true; }, release: () => { operation.current = false; setLocked(false); } }}><form method="get" className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={event => { event.preventDefault(); if (!pending) startTransition(() => router.push(`/internal/pickem/submissions?week=${encodeURIComponent(value)}`)); }}>
    <label className="min-w-0 flex-1">Week<select name="week" value={value} disabled={pending || locked} onChange={event => setValue(event.target.value)} className="mt-2 block w-full rounded-xl bg-[#111] p-3">{!selected && <option value="">Choose a week</option>}{weeks.map(week => <option key={week.id} value={week.id}>{week.season} · Week {week.week} · {week.status}</option>)}</select></label>
    <button disabled={pending || locked || !value} className="rounded-xl bg-white px-5 py-3 font-bold text-black disabled:opacity-50">{pending ? 'Loading week…' : 'View week'}</button>
  </form>{pending && <p role="status" className="mt-4">Loading selected week…</p>}{changed && !pending && <p role="status">Select View week to load this week.</p>}<div hidden={pending || changed} aria-busy={pending}>{children}</div></OperationContext.Provider>;
}

export function AdminActionForm({ action, children, className }: { action: (state: AdminActionState, form: FormData) => Promise<AdminActionState>; children: ReactNode; className?: string }) {
  const operation = useContext(OperationContext);
  const [state, submit, pending] = useActionState(async (previous: AdminActionState, form: FormData) => {
    let result: AdminActionState;
    try { result = await action(previous, form); } catch (error) {
      if (error && typeof error === "object" && "digest" in error && String(error.digest).startsWith("NEXT_REDIRECT")) throw error;
      result = { status: "unknown", message: "The response was lost. Refresh status before repeating any operation." };
    }
    if (result.status === "rejected") operation?.release();
    return result;
  }, initialAdminActionState);
  const router = useRouter();
  const [refreshing, refresh] = useTransition();
  const locked = operation?.locked || pending || refreshing || state.status === 'recorded' || state.status === 'unknown';
  return <form action={submit} className={className} onSubmit={event => { if (locked || (operation && !operation.acquire())) event.preventDefault(); }}><fieldset disabled={locked} className="contents">{children}</fieldset>
    {pending && <p role="status">Submitting… Please wait.</p>}
    {state.message && <p role={state.status === 'recorded' ? 'status' : 'alert'} className="mt-2 text-sm">{state.message}</p>}
    {state.status !== 'idle' && <button type="button" disabled={pending || refreshing} className="mt-2 rounded border border-white/30 px-3 py-2" onClick={() => refresh(() => { const url = new URL(window.location.href); url.searchParams.set("status_refresh", String(Date.now())); router.replace(`${url.pathname}${url.search}`); })}>{refreshing ? 'Refreshing status…' : 'Refresh status (does not resubmit)'}</button>}
  </form>;
}
