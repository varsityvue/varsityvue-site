import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { requireActiveMember } from "@/lib/member-access";
import { getSchools } from "@/lib/schools";
import { createControlledProductEmailTest } from "./actions";

export const metadata: Metadata = {
  title: "Product Email Diagnostics | VarsityVue",
  robots: { index: false, follow: false, nocache: true },
};

type Diagnostics = {
  pending?: number;
  processing?: number;
  provider_accepted?: number;
  delivered?: number;
  failed?: number;
  cancelled?: number;
  stale_processing?: number;
};

type PageProps = { searchParams: Promise<{ message?: string; created?: string }> };

export default async function ProductEmailDiagnosticsPage({ searchParams }: PageProps) {
  const { supabase, userId } = await requireActiveMember();
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((row) => row.role === "admin")) redirect("/account");

  const [{ data: diagnostics, error }, params] = await Promise.all([
    supabase.rpc("admin_product_email_diagnostics"),
    searchParams,
  ]);
  const counts = (diagnostics ?? {}) as Diagnostics;
  const schools = getSchools().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <main className="min-h-screen bg-[#050505] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">Admin · Phase 6</p>
        <h1 className="mt-3 text-4xl font-black">Product Email Diagnostics</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/50">Durable state for member product email. This surface can create only a controlled test addressed to your own eligible admin account; it cannot publish a game or article event.</p>

        {params.created ? <div role="status" className="mt-6 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-50">{params.created}</div> : null}
        {params.message ? <div role="alert" className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">{params.message}</div> : null}
        {error ? <div role="alert" className="mt-6 rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-sm text-red-50">Diagnostics are temporarily unavailable.</div> : null}

        <section className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Pending / retryable" value={counts.pending} />
          <Metric label="Processing" value={counts.processing} warning={Boolean(counts.stale_processing)} />
          <Metric label="Provider accepted" value={counts.provider_accepted} />
          <Metric label="Delivered" value={counts.delivered} />
          <Metric label="Failed / suppressed" value={counts.failed} warning={Boolean(counts.failed)} />
          <Metric label="Cancelled / ineligible" value={counts.cancelled} />
          <Metric label="Stale claims" value={counts.stale_processing} warning={Boolean(counts.stale_processing)} />
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-7">
          <h2 className="text-2xl font-black">Controlled test event</h2>
          <p className="mt-2 text-sm leading-6 text-white/50">Eligibility is real: your account must be active, have the category enabled, and currently follow the selected school. One event creates at most one delivery to you.</p>
          <form action={createControlledProductEmailTest} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-white/70">Category
              <select name="category" className="mt-2 w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white" defaultValue="final_score">
                <option value="final_score">Final Score Email</option>
                <option value="new_coverage">New Coverage Email</option>
              </select>
            </label>
            <label className="text-sm font-bold text-white/70">Canonical school
              <select name="school_slug" className="mt-2 w-full rounded-xl border border-white/10 bg-[#111] px-4 py-3 text-white" defaultValue="de-leon">
                {schools.map((school) => <option key={school.slug} value={school.slug}>{school.name}</option>)}
              </select>
            </label>
            <div className="sm:col-span-2 flex flex-wrap gap-3">
              <button className="rounded-full bg-[var(--vv-primary)] px-5 py-3 text-sm font-black">Queue controlled test</button>
              <Link href="/account#email-preferences" className="rounded-full border border-white/15 px-5 py-3 text-sm font-black text-white/65">Review my eligibility</Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, warning = false }: { label: string; value?: number; warning?: boolean }) {
  return <div className={`rounded-2xl border p-4 ${warning ? "border-amber-300/25 bg-amber-300/10" : "border-white/10 bg-white/[0.035]"}`}><p className="text-3xl font-black">{value ?? 0}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/40">{label}</p></div>;
}
