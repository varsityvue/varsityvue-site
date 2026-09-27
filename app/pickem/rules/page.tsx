import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pick ’Em Official Rules | VarsityVue",
  robots: { index: false, follow: false, nocache: true },
};

export default function PickemRulesPage() {
  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-10 text-white sm:px-6 sm:py-16">
      <section className="mx-auto max-w-2xl rounded-2xl border border-white/15 bg-white/[0.04] p-6 sm:p-10">
        <h1 className="text-3xl font-black">Pick ’Em Official Rules</h1>
        <p className="mt-5 text-sm leading-7 text-white/70">The Week 6 cash contest rules are awaiting approval and are not published. No Week 6 contest entry can open until the approved rules are published and their version is recorded with the contest.</p>
        <Link href="/pickem" className="mt-6 inline-block rounded-full border border-white/20 px-5 py-3 text-sm font-bold">Back to Pick ’Em</Link>
      </section>
    </main>
  );
}
