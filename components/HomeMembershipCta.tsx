import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import TrackedSignupLink from "@/components/TrackedSignupLink";

export default async function HomeMembershipCta({ surface = "home" }: { surface?: "home" | "scoreboard" }) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();

  if (claimsData?.claims?.sub) return null;

  return (
    <section className="border-b border-white/10 bg-black px-4 py-3 sm:px-6 sm:py-5 lg:px-8" aria-label="VarsityVue membership">
      <div className="mx-auto flex max-w-[1440px] flex-col items-stretch justify-between gap-3 rounded-2xl border border-white/10 bg-[linear-gradient(115deg,rgba(139,16,32,0.18),rgba(255,255,255,0.035))] px-4 py-3 sm:flex-row sm:items-center sm:px-5 sm:py-4">
        <div className="min-w-0">
          <p className="text-sm font-black text-white sm:text-lg">Save your teams. Keep your picks.</p>
          <p className="mt-1 text-[10px] leading-4 text-white/45 sm:text-sm sm:leading-5">Create a free account for final-score alerts and a season-long Pick ’Em record.</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link href="/login" className="hidden rounded-full border border-white/15 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.1em] text-white/70 transition hover:bg-white/[0.06] hover:text-white sm:inline-flex">Log In</Link>
          <TrackedSignupLink surface={surface} className="flex w-full justify-center rounded-full border border-[color:var(--vv-accent)] bg-[var(--vv-primary)] px-3 py-2.5 text-[9px] font-black uppercase tracking-[0.08em] text-white transition hover:bg-[var(--vv-primary-hover)] sm:w-auto sm:px-5 sm:text-[10px] sm:tracking-[0.12em]">Create Free Account</TrackedSignupLink>
        </div>
      </div>
    </section>
  );
}
