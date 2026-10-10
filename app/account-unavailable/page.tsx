import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Member access temporarily unavailable",
  robots: { index: false, follow: false, nocache: true },
};

export default function AccountUnavailablePage() {
  return <main className="mx-auto max-w-xl px-4 py-12 text-white">
    <h1 className="text-2xl font-bold">Member access temporarily unavailable</h1>
    <p className="mt-4">We could not verify your account access. Your session has not been signed out. Protected changes are paused until access can be verified.</p>
    <p className="mt-4">Wait a moment, then return to your page and try again. A score submission is not automatically repeated.</p>
    <div className="mt-6 flex gap-6"><Link href="/account">Check account access</Link><Link href="/games">Games &amp; Scores</Link></div>
  </main>;
}
