"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function ReadRecovery({ message }: { message: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return <section className="mt-5 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-5 text-amber-50">
    <p role="status">{pending ? "Checking the latest saved information…" : message}</p>
    <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}
      className="mt-3 rounded-xl border border-white/25 px-4 py-3 text-sm font-bold disabled:opacity-50">
      {pending ? "Checking…" : "Try loading again"}
    </button>
  </section>;
}
