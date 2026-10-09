import type { Metadata } from "next";
import Link from "next/link";
import { Smartphone } from "lucide-react";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Add VarsityVue to Your Home Screen",
  description: "Keep VarsityVue one tap away with Home Screen instructions for iPhone and Android.",
  alternates: { canonical: "/add-to-home-screen" },
};

const linkClass = "rounded font-bold text-white underline decoration-white/30 underline-offset-4 hover:decoration-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";

export default function HomeScreenGuidePage() {
  return (
    <main className="min-h-screen bg-[var(--vv-bg)] text-white">
      <PageHero
        eyebrow="VarsityVue on your phone"
        title="Keep Friday night one tap away."
        description="Add VarsityVue to your Home Screen for quick access to games, teams and local coverage."
      />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <p className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/65">
          If you opened this page inside Facebook or another app, open varsityvue.com in Safari on iPhone or Chrome on Android first.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <section aria-labelledby="iphone-heading" className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <Smartphone aria-hidden="true" className="mb-3 text-[var(--vv-accent)]" size={28} />
            <h2 id="iphone-heading" className="text-2xl font-black">iPhone · Safari</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-white/70">
              <li>Open <Link href="/" className={linkClass}>varsityvue.com</Link> in Safari.</li>
              <li>Tap Safari&apos;s More button (three dots) and choose <strong className="text-white">Share</strong>, or tap its Share button (a square with an upward arrow).</li>
              <li>In the Share list, choose <strong className="text-white">Add to Home Screen</strong>.</li>
              <li>If offered, enable <strong className="text-white">Open as Web App</strong>. Keep the VarsityVue name, then tap <strong className="text-white">Add</strong>.</li>
              <li>Return to your Home Screen and tap the VarsityVue icon.</li>
            </ol>
            <p className="mt-4 text-xs leading-5 text-white/50">Missing the option? Scroll to Edit Actions at the bottom of the Share list and enable Add to Home Screen.</p>
            <a href="https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios" className={`${linkClass} mt-4 inline-block text-xs`}>Apple&apos;s Home Screen instructions</a>
          </section>
          <section aria-labelledby="android-heading" className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
            <Smartphone aria-hidden="true" className="mb-3 text-[var(--vv-accent)]" size={28} />
            <h2 id="android-heading" className="text-2xl font-black">Android · Chrome</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-6 text-white/70">
              <li>Open <Link href="/" className={linkClass}>varsityvue.com</Link> in Chrome.</li>
              <li>Tap Chrome&apos;s three-dot menu beside the address bar.</li>
              <li>Choose <strong className="text-white">Install and create shortcut</strong>, then <strong className="text-white">Install</strong> or <strong className="text-white">Create shortcut</strong>. Some versions show <strong className="text-white">Add to Home screen</strong> or <strong className="text-white">Install app</strong> directly.</li>
              <li>Keep the VarsityVue name and finish the on-screen steps using <strong className="text-white">Add</strong> or <strong className="text-white">Install</strong>.</li>
              <li>Open VarsityVue from the new icon. If it appears in your app list, move it to your Home Screen.</li>
            </ol>
            <a href="https://support.google.com/chrome/answer/15085120?co=GENIE.Platform%3DAndroid&amp;hl=en" className={`${linkClass} mt-4 inline-block text-xs`}>Google&apos;s shortcut instructions</a>
          </section>
        </div>
        <p className="mt-5 text-sm leading-6 text-white/55">Scores and coverage need an internet connection. When you open the new icon, sign in if prompted to access your followed teams and picks.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/games" className="inline-flex min-h-11 items-center rounded-full bg-[var(--vv-primary)] px-5 py-3 text-sm font-bold hover:bg-[var(--vv-primary-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Open Games</Link>
          <Link href="/schools" className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-5 py-3 text-sm font-bold hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Find your team</Link>
        </div>
      </div>
    </main>
  );
}
