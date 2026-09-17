import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Account Suspended | VarsityVue",
  robots: { index: false, follow: false, nocache: true },
};

export default function AccountSuspendedPage() {
  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-12 text-white sm:px-6 sm:py-20 lg:px-8">
      <section className="mx-auto max-w-xl rounded-[1.5rem] border border-amber-300/20 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.34),transparent_42%),rgba(255,255,255,0.04)] p-6 sm:p-8">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-200">Member Access</p>
        <h1 className="mt-3 text-3xl font-black sm:text-4xl">Account suspended</h1>
        <p className="mt-4 text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
          This account cannot use signed-in VarsityVue features right now. Public scores, schools, schedules, and coverage remain available.
        </p>
        <p className="mt-3 text-sm leading-6 text-white/45">
          If you believe this is an error, contact VarsityVue for account assistance.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/" className="rounded-full bg-[var(--vv-primary)] px-5 py-3 text-sm font-black transition hover:bg-[#93142a]">
            Return home
          </Link>
          <Link href="/contact" className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/10 hover:text-white">
            Contact VarsityVue
          </Link>
        </div>
      </section>
    </main>
  );
}
