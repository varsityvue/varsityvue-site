"use client";

import { useMemo, useState } from "react";

function slug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

export default function CampaignLinkBuilder() {
  const [path, setPath] = useState("/pickem");
  const [campaign, setCampaign] = useState("week-5-pickem");
  const [copied, setCopied] = useState(false);
  const url = useMemo(() => {
    const safePath = path.startsWith("/") && !path.startsWith("//") ? path : "/";
    const result = new URL(safePath, "https://varsityvue.com");
    result.searchParams.set("utm_source", "facebook");
    result.searchParams.set("utm_medium", "social");
    result.searchParams.set("utm_campaign", slug(campaign) || "facebook-post");
    return result.toString();
  }, [campaign, path]);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--vv-accent)]">Facebook Attribution</p>
      <h2 className="mt-1 text-2xl font-black">Campaign link builder</h2>
      <p className="mt-2 text-sm leading-6 text-white/45">Use one campaign name per post or promotion. Anyone who creates an account within 30 days keeps the original campaign attribution.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-bold text-white/55">Destination path<input value={path} onChange={(event) => setPath(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[var(--vv-accent)]" /></label>
        <label className="text-xs font-bold text-white/55">Campaign name<input value={campaign} onChange={(event) => setCampaign(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none focus:border-[var(--vv-accent)]" /></label>
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-black/25 p-3 sm:flex-row sm:items-center">
        <code className="min-w-0 flex-1 break-all text-xs text-white/55">{url}</code>
        <button type="button" onClick={copy} className="shrink-0 rounded-full bg-[var(--vv-primary)] px-4 py-2.5 text-xs font-black">{copied ? "Copied" : "Copy Link"}</button>
      </div>
    </section>
  );
}
