import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireActiveMember } from "@/lib/member-access";

export const metadata: Metadata = {
  title: "Conversion Dashboard",
  robots: { index: false, follow: false, nocache: true },
};

type BreakdownRow = { intent?: string; source?: string; accounts: number; confirmed: number; pickem_participants?: number };
type DailyRow = { date: string; accounts: number };
type DashboardData = {
  generated_at: string;
  range_days: number;
  summary: {
    total_members: number;
    new_accounts: number;
    confirmed_accounts: number;
    active_accounts: number;
    pickem_participants: number;
    complete_slate_members: number;
  };
  intent_breakdown: BreakdownRow[];
  source_breakdown: BreakdownRow[];
  daily_accounts: DailyRow[];
  pickem: { participants: number; saved_picks: number; complete_slates: number };
};

type PageProps = { searchParams: Promise<{ days?: string }> };

function selectedDays(value?: string) {
  return value === "7" || value === "90" ? Number(value) : 30;
}

function percent(part: number, total: number) {
  return total > 0 ? `${Math.round((part / total) * 100)}%` : "—";
}

function label(value?: string) {
  return (value ?? "unknown").split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

export default async function ConversionDashboardPage({ searchParams }: PageProps) {
  const { supabase, userId } = await requireActiveMember();
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((row) => row.role === "admin")) redirect("/account");

  const days = selectedDays((await searchParams).days);
  const { data, error } = await supabase.rpc("admin_conversion_dashboard", { range_days: days });
  const dashboard = data as DashboardData | null;
  const summary = dashboard?.summary;
  const maxDaily = Math.max(1, ...(dashboard?.daily_accounts ?? []).map((row) => row.accounts));
  const funnel = summary ? [
    ["Accounts created", summary.new_accounts],
    ["Email confirmed", summary.confirmed_accounts],
    ["Made a Pick ’Em pick", summary.pickem_participants],
    ["Completed a slate", summary.complete_slate_members],
  ] as const : [];

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">Admin · Growth</p>
            <h1 className="mt-3 text-4xl font-black sm:text-5xl">Conversion Dashboard</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/50">Authoritative account and Pick ’Em outcomes. Page views and Facebook clicks remain in Vercel Analytics; this dashboard measures what actually became a member.</p>
          </div>
          <Link href="/account#platform-tools" className="text-sm font-bold text-white/50 transition hover:text-white">← Admin tools</Link>
        </header>

        <nav aria-label="Reporting period" className="mt-6 flex gap-2">
          {[7, 30, 90].map((option) => <Link key={option} href={`/internal/conversions?days=${option}`} className={`rounded-full border px-4 py-2 text-xs font-black ${days === option ? "border-[var(--vv-primary)] bg-[var(--vv-primary)]" : "border-white/10 bg-white/[0.04] text-white/55"}`}>{option} days</Link>)}
        </nav>

        {error || !dashboard || !summary ? (
          <div role="alert" className="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 p-5 text-sm text-red-50">Conversion data is temporarily unavailable.</div>
        ) : (
          <>
            <section className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {[
                ["Total Members", summary.total_members],
                [`New · ${days} Days`, summary.new_accounts],
                ["Confirmation Rate", percent(summary.confirmed_accounts, summary.new_accounts)],
                ["New-Member Pick Rate", percent(summary.pickem_participants, summary.new_accounts)],
              ].map(([metric, value]) => <div key={metric} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:p-5"><p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">{metric}</p><p className="mt-2 text-3xl font-black">{value}</p></div>)}
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--vv-accent)]">Member Funnel · {days} Days</p>
                <div className="mt-5 space-y-4">
                  {funnel.map(([name, count], index) => <div key={name}><div className="flex items-center justify-between text-sm"><span className="font-bold text-white/70">{name}</span><span className="font-black">{count} <span className="ml-1 text-[10px] text-white/35">{index === 0 ? "100%" : percent(count, summary.new_accounts)}</span></span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-[var(--vv-primary)]" style={{ width: `${summary.new_accounts > 0 ? Math.max(2, (count / summary.new_accounts) * 100) : 0}%` }} /></div></div>)}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--vv-accent)]">All-Time Pick ’Em</p>
                <div className="mt-5 grid grid-cols-3 gap-2">
                  {[["Participants", dashboard.pickem.participants], ["Saved Picks", dashboard.pickem.saved_picks], ["Complete Slates", dashboard.pickem.complete_slates]].map(([metric, value]) => <div key={metric} className="rounded-xl border border-white/10 bg-black/20 p-3"><p className="text-2xl font-black">{value}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white/35">{metric}</p></div>)}
                </div>
                <p className="mt-4 text-xs leading-5 text-white/35">A participant has saved at least one pick. A complete slate means every game in a weekly slate was selected.</p>
              </div>
            </section>

            <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6">
              <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--vv-accent)]">Account Creation</p><h2 className="mt-1 text-2xl font-black">Daily trend</h2></div><p className="text-[10px] text-white/30">Durable accounts, not visits</p></div>
              <div className="mt-5 flex h-40 items-end gap-1" aria-label={`Daily account creation for the last ${days} days`}>
                {dashboard.daily_accounts.map((row) => <div key={row.date} className="group flex min-w-0 flex-1 flex-col items-center justify-end"><span className="mb-1 text-[8px] font-bold text-white/0 group-hover:text-white/70">{row.accounts}</span><div title={`${row.date}: ${row.accounts} account${row.accounts === 1 ? "" : "s"}`} className="w-full min-w-1 rounded-t bg-[var(--vv-primary)]/80" style={{ height: `${row.accounts > 0 ? Math.max(4, (row.accounts / maxDaily) * 120) : 2}px` }} /></div>)}
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <Breakdown title="Signup Intent" rows={dashboard.intent_breakdown} keyName="intent" showPickem />
              <Breakdown title="Entry Source" rows={dashboard.source_breakdown} keyName="source" />
            </section>

            <p className="mt-5 text-xs leading-5 text-white/30">Intent and source attribution begins with accounts created after this release. Older accounts and untagged links appear as Unknown or Direct/Other instead of being guessed.</p>
          </>
        )}
      </div>
    </main>
  );
}

function Breakdown({ title, rows, keyName, showPickem = false }: { title: string; rows: BreakdownRow[]; keyName: "intent" | "source"; showPickem?: boolean }) {
  return <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 sm:p-6"><h2 className="text-xl font-black">{title}</h2><div className="mt-4 divide-y divide-white/10">{rows.length ? rows.map((row) => { const key = row[keyName] ?? "unknown"; return <div key={key} className={`grid ${showPickem ? "grid-cols-[1fr_auto_auto_auto]" : "grid-cols-[1fr_auto_auto]"} items-center gap-4 py-3 text-sm`}><span className="font-bold text-white/70">{label(key)}</span><span className="text-right"><strong>{row.accounts}</strong><small className="block text-[9px] uppercase text-white/30">Accounts</small></span><span className="text-right"><strong>{row.confirmed}</strong><small className="block text-[9px] uppercase text-white/30">Confirmed</small></span>{showPickem ? <span className="text-right"><strong>{row.pickem_participants ?? 0}</strong><small className="block text-[9px] uppercase text-white/30">Players</small></span> : null}</div>; }) : <p className="py-5 text-sm text-white/40">No accounts in this period.</p>}</div></div>;
}
