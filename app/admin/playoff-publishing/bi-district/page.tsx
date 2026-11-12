import "server-only";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireActiveMember } from "@/lib/member-access";
import { canViewPlayoffPublishing } from "@/lib/playoff-publishing-access";
import { getDynamicGamesSnapshot } from "@/lib/dynamic-games";
import { resolveBracketSchool } from "@/lib/playoff-school-catalog";
import { getBiDistrictReadiness } from "@/lib/bidistrict-readiness";

export const dynamic = "force-dynamic";

type Query = { division?: string; region?: string; status?: string; school?: string };

export default async function BiDistrictReadinessPage({ searchParams }: { searchParams: Promise<Query> }) {
  const { supabase, userId } = await requireActiveMember();
  const { data: roles, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!canViewPlayoffPublishing(roles, Boolean(error))) notFound();

  const filters = await searchParams;
  const snapshot = await getDynamicGamesSnapshot();
  const entries = getBiDistrictReadiness(snapshot.games);
  const divisions = [...new Set(entries.map((entry) => entry.division))];
  const regions = [...new Set(entries.map((entry) => entry.region))];
  const statuses = ["missing-record", "duplicate-record", "needs-details", "scheduled", "verified-final", "awaiting-verification"] as const;
  const filtered = entries.filter((entry) =>
    (!filters.division || entry.division === filters.division) &&
    (!filters.region || entry.region === filters.region) &&
    (!filters.status || entry.status === filters.status) &&
    (!filters.school || entry.teams.some((team) => team.toLowerCase().includes(filters.school!.trim().toLowerCase()))));
  const counts = Object.fromEntries(statuses.map((status) => [status, entries.filter((entry) => entry.status === status).length]));

  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-8 text-white sm:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-2">
          <Link href="/admin/playoff-publishing" className="text-sm text-white/70 underline">Area-round publishing dashboard</Link>
          <h1 className="text-3xl font-bold">Bi-District Readiness</h1>
          <a href="/api/admin/bi-district-readiness-export" className="inline-flex min-h-11 items-center rounded-lg border border-white/20 px-4 text-sm font-semibold">Export 192-game research CSV</a>
          <p className="text-sm text-white/70">Private · Read-only · 192 first-round bracket positions</p>
          <p className="text-sm text-white/60">Verified-score feed: {snapshot.scoreLoadStatus}</p>
          {snapshot.scoreLoadStatus === "failed" && (
            <p role="alert" className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm text-amber-100">
              Score verification data is unavailable. Do not rely on these readiness totals for publication.
            </p>
          )}
        </header>
        <section aria-label="Bi-district readiness totals" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statuses.map((status) => (
            <div key={status} className="rounded-xl border border-white/15 bg-white/5 p-3">
              <div className="text-2xl font-bold tabular-nums">{counts[status]}</div>
              <div className="mt-1 text-xs text-white/70">{status.replaceAll("-", " ")}</div>
            </div>
          ))}
        </section>
        <form method="get" action="/admin/playoff-publishing/bi-district"
          aria-label="Filter bi-district games" className="grid gap-3 rounded-xl border border-white/15 bg-white/5 p-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-1 text-sm"><span className="block">Division</span>
            <select name="division" defaultValue={filters.division ?? ""} className="w-full rounded-lg bg-[#201b20] p-3">
              <option value="">All divisions</option>{divisions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm"><span className="block">Region</span>
            <select name="region" defaultValue={filters.region ?? ""} className="w-full rounded-lg bg-[#201b20] p-3">
              <option value="">All regions</option>{regions.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm"><span className="block">Status</span>
            <select name="status" defaultValue={filters.status ?? ""} className="w-full rounded-lg bg-[#201b20] p-3">
              <option value="">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{value.replaceAll("-", " ")}</option>)}
            </select>
          </label>
          <label className="space-y-1 text-sm"><span className="block">School</span>
            <input name="school" type="search" defaultValue={filters.school ?? ""} placeholder="Search bracket school" className="w-full rounded-lg bg-[#201b20] p-3" />
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" className="min-h-11 flex-1 rounded-lg bg-[#8B1020] px-3 py-3 text-sm font-semibold">Apply</button>
            <Link href="/admin/playoff-publishing/bi-district" className="rounded-lg border border-white/20 px-3 py-3 text-sm">Reset</Link>
          </div>
        </form>
        <p className="text-sm text-white/70">{filtered.length} of {entries.length} bi-district games</p>
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((entry) => (
            <article key={`${entry.division}-${entry.region}-${entry.slot}`} className="rounded-xl border border-white/15 bg-white/5 p-4">
              <div className="flex justify-between gap-2 text-sm">
                <h2 className="font-semibold">{entry.division} · {entry.region} · Game {entry.slot}</h2>
                <span className="text-white/60">{entry.status.replaceAll("-", " ")}</span>
              </div>
              <p className="mt-3 font-semibold">{entry.teams.map((team, index) => {
                const school = resolveBracketSchool(team, entry.division, entry.region);
                return <span key={team}>{index > 0 && " vs "}{school ? <Link href={`/schools/${school.slug}`} className="underline underline-offset-4">{team}</Link> : <span>{team} <span className="text-xs font-normal text-amber-200">(school details pending)</span></span>}</span>;
              })}</p>
              {entry.gameId && <p className="mt-2 break-all text-xs text-white/60">Game: {entry.gameId}</p>}
              {entry.missing.length > 0 && <p className="mt-2 text-sm text-amber-200">Needs: {entry.missing.join(", ")}</p>}
            </article>
          ))}
        </div>
        <p className="text-xs text-white/60">Read-only audit. No scores, schedules, or game records can be changed here.</p>
      </div>
    </main>
  );
}
