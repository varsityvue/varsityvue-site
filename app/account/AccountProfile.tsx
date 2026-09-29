"use client";

import { useActionState, useEffect, useState } from "react";
import { saveUsername, type UsernameState } from "./profile-actions";
import { centralDateTime } from "@/lib/account-username";

const initial: UsernameState = { status: "idle", message: "" };

export default function AccountProfile({ username, changedAt, displayName }: {
  username: string | null; changedAt: string | null; displayName: string;
}) {
  const [state, action, pending] = useActionState(saveUsername, initial);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    const initialTimer = setTimeout(() => setNow(Date.now()), 0);
    return () => { clearInterval(timer); clearTimeout(initialTimer); };
  }, []);
  const current = state.username ?? username;
  const changed = state.nextEligible ?? changedAt;
  const next = changed ? new Date(new Date(changed).getTime() + 30 * 86400000) : null;
  const locked = next && (now === null || next.getTime() > now);
  return <section id="profile" className="mt-6 scroll-mt-24 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:p-7">
    <h2 className="text-2xl font-black">Profile</h2>
    <p className="mt-3 text-sm text-white/65">Display name: {displayName}</p>
    <p className="mt-1 text-xs text-white/45">Your display name remains your primary public name, including in Pick ’Em.</p>
    <h3 className="mt-6 text-lg font-bold">{current ? `@${current}` : "Username"}</h3>
    <p className="mt-1 text-sm text-white/60">{current
      ? "Your username is visible on VarsityVue. You can change it once every 30 days after your first rename."
      : "Choose a public @username for your VarsityVue account."}</p>
    {locked ? <p className="mt-3 text-sm text-amber-100">You can change it after {centralDateTime(next.toISOString())}.</p> :
      <form action={action} className="mt-4 flex max-w-lg flex-col gap-3 sm:flex-row sm:items-end">
        <label className="min-w-0 flex-1 text-sm font-semibold">New username
          <input name="username" required minLength={3} maxLength={30} autoComplete="off" spellCheck={false}
            pattern="[A-Za-z0-9_]{3,30}" aria-describedby="username-help"
            className="mt-2 w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white" />
        </label>
        <button disabled={pending} className="rounded-full bg-[var(--vv-primary)] px-5 py-3 font-bold disabled:opacity-50">
          {pending ? "Saving…" : current ? "Change username" : "Choose username"}
        </button>
      </form>}
    <p id="username-help" className="mt-2 text-xs text-white/45">3–30 letters, numbers, or underscores. Stored in lowercase.</p>
    {state.message && <p role={state.status === "error" ? "alert" : "status"} className="mt-3 text-sm">{state.message}</p>}
  </section>;
}
