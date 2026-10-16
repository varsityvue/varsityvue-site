"use client";

import { useFormStatus } from "react-dom";

export function CheckAccessButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} aria-busy={pending}
    className="min-h-11 rounded-lg border border-white/30 px-4 py-2 font-semibold disabled:opacity-60">
    {pending ? "Checking access…" : "Check account access"}
  </button>;
}
