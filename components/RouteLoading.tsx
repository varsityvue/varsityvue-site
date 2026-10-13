"use client";

import { useEffect, useState } from "react";

export default function RouteLoading({ label = "page" }: { label?: string }) {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 8000);
    return () => window.clearTimeout(timer);
  }, []);
  return <section className="min-h-[60vh] px-4 py-8 text-white" aria-label={`Loading ${label}`} aria-busy="true">
    <div className="mx-auto max-w-[1200px]">
      <p role="status" className="text-sm font-bold">Loading {label}…</p>
      {slow && <div className="mt-4 text-sm">
        <p role="status">This is taking longer than expected. Check your connection or try loading the page again.</p>
        <button type="button" onClick={() => window.location.reload()} className="mt-3 rounded-xl border border-white/25 px-4 py-3 font-bold">Reload page</button>
      </div>}
      <div aria-hidden="true" className="mt-5 h-32 rounded-2xl border border-white/10 bg-white/[0.04]" />
    </div>
  </section>;
}
