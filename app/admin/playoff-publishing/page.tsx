import "server-only";

import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-access";
import { getDynamicGamesSnapshot } from "@/lib/dynamic-games";
import { getAreaRoundReadiness } from "@/lib/area-round-readiness";

export const dynamic = "force-dynamic";

type Query = { region?: string; status?: string };

export default async function PlayoffPublishingPage({
  searchParams,
}: {
  searchParams: Promise<Query>;
}) {
  // Authentication and authorization occur before loading any publishing data.
  const { supabase, userId } = await requireActiveMember();
  const { data: roleRows, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error || !roleRows?.some((row) => row.role === "admin")) notFound();

  const { region, status } = await searchParams;
  const snapshot = await getDynamicGamesSnapshot();
  const queue = getAreaRoundReadiness(snapshot.games);
  const regions = [...new Set(queue.map((item) => item.region))];
  const filtered = queue.filter((item) =>
    (!region || item.region === region) && (!status || item.status === status));
  const statuses = ["awaiting-results", "needs-schedule", "needs-details", "scheduled", "duplicate-schedule"] as const;
  const counts = Object.fromEntries(statuses.map((key) => [
    key, queue.filter((item) => item.status === key).length,
  ]));

  const href = (nextRegion: string, nextStatus: string) => {
    const params = new URLSearchParams();
    if (nextRegion) params.set("region", nextRegion);
    if (nextStatus) params.set("status", nextStatus);
    return `/admin/playoff-publishing${params.size ? `?${params.toString()}` : ""}`;
  };

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-10 text-white sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header>
          <Link href="/playoffs" className="text-sm text-white/70 underline">Playoff Central</Link>
          <h1 className="mt-4 text-3xl font-bold">Playoff publishing readiness</h1>
          <p className="mt-2 text-sm text-white/70">Admin only · Read-only audit · 2026 statewide area round</p>
          <p className="mt-1 text-sm text-white/60">Score feed: {snapshot.scoreLoadStatus}</p>
        </header>
        <section aria-label="Readiness totals" className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {statuses.map((key) => (
            <Link key={key} href={href(region ?? "", key)}
              className="rounded-xl border border-white/15 bg-white/5 p-4">
              <div className="text-2xl font-bold">{counts[key]}</div>
              <div className="mt-1 break-words text-xs text-white/70">{key.replaceAll("-", " ")}</div>
            </Link>
          ))}
        </section>
        <nav aria-label="Region filters" className="flex flex-wrap gap-2">
          <Link href={href("", status ?? "")} className="rounded border border-white/20 px-3 py-2 text-sm">All regions</Link>
          {regions.map((value) => (
            <Link key={value} href={href(value, status ?? "")}
              aria-current={region === value ? "page" : undefined}
              className={`rounded border px-3 py-2 text-sm ${region === value ? "border-[#8B1020] bg-[#8B1020]" : "border-white/20"}`}>
              {value}
            </Link>
          ))}
          {status && <Link href={href(region ?? "", "")} className="rounded border border-white/20 px-3 py-2 text-sm">Clear status</Link>}
        </nav>
        <p className="text-sm text-white/70">{filtered.length} of {queue.length} area-round slots</p>
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((item) => (
            <article key={`${item.region}-${item.slot}`} className="rounded-xl border border-white/15 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold">{item.region} · Slot {item.slot}</h2>
                <span className="text-xs text-white/60">{item.status.replaceAll("-", " ")}</span>
              </div>
              <p className="mt-3">{item.teams[0] ?? "Winner TBD"} vs {item.teams[1] ?? "Winner TBD"}</p>
              {item.gameId && <p className="mt-2 break-all text-xs text-white/60">Game: {item.gameId}</p>}
              {item.missing.length > 0 && <p className="mt-2 text-sm text-amber-200">Needs: {item.missing.join(", ")}</p>}
            </article>
          ))}
        </div>
        <p className="text-xs text-white/60">This page never writes scores, schedules, or bracket results. All winners require verified final results.</p>
      </div>
    </main>
  );
}
