"use client";

import Link from "next/link";
import { useActionState } from "react";
import { changePassword, type PasswordState } from "./security-actions";

const initial: PasswordState = { status: "idle", message: "" };

export default function AccountSecurity() {
  const [state, action, pending] = useActionState(changePassword, initial);
  return <section id="security" className="mt-6 scroll-mt-24 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 sm:p-7">
    <h2 className="text-2xl font-black">Security</h2>
    <h3 className="mt-4 text-lg font-bold">Change password</h3>
    {state.status === "success" ? <Link className="mt-4 inline-block rounded-full bg-[var(--vv-primary)] px-5 py-3 font-bold" href="/login">Sign in</Link> :
      <form action={action} className="mt-4 grid max-w-lg gap-4">
        {([ ["current_password", "Current password"], ["new_password", "New password"], ["confirm_password", "Confirm new password"] ] as const).map(([name, label]) =>
          <label key={name} className="text-sm font-semibold">{label}<input name={name} type="password" required autoComplete={name === "current_password" ? "current-password" : "new-password"}
            className="mt-2 block w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white" /></label>)}
        {state.status === "nonce" && <label className="text-sm font-semibold">Email reauthentication code
          <input name="nonce" required autoComplete="one-time-code" className="mt-2 block w-full rounded-xl border border-white/20 bg-black/30 px-4 py-3 text-white" /></label>}
        <button disabled={pending} className="w-fit rounded-full bg-[var(--vv-primary)] px-5 py-3 font-bold disabled:opacity-50">{pending ? "Updating…" : "Change password"}</button>
      </form>}
    {state.message && <p role={state.status === "error" ? "alert" : "status"} className="mt-3 text-sm">{state.message}</p>}
    <Link href="/forgot-password" className="mt-4 inline-block text-sm text-white/60 underline">Forgot your password?</Link>
  </section>;
}
