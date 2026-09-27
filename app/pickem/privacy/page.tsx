import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pick ’Em Privacy Notice | VarsityVue",
  description: "How VarsityVue handles information collected for Pick ’Em.",
};

export default function PickemPrivacyPage() {
  return <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-10 text-white sm:px-6 sm:py-16">
    <article className="mx-auto max-w-2xl rounded-2xl border border-white/15 bg-white/[0.04] p-5 sm:p-10">
      <h1 className="text-3xl font-black">Pick ’Em Privacy Notice</h1>
      <p className="mt-3 text-sm text-white/60">2026 Weeks 6–11 · Version 2026-pickem-cash-v1</p>
      <div className="mt-6 space-y-5 text-sm leading-7 text-white/75">
        <p>VarsityVue collects the U.S. mobile number you provide with a completed Pick ’Em entry to help enforce one entry per person and contact a provisional winner. We normalize its format and check whether it is already used by another entrant. This is duplicate deterrence, not SMS verification: we do not verify number ownership or mobile-line type.</p>
        <p>We record your eligibility and Official Rules self-attestation with the entry. Age and Texas residency are self-attested, not independently verified at entry. Your account, picks, prediction, initial entry time, and contest results are used to administer scoring, rankings, prize counts, winner review, and claims.</p>
        <p>Your number is stored privately and is not shown in public standings. Gilder Storage receives no entrant phone numbers, email addresses, private account data, or administrative contest records merely because it sponsors the promotion. Entering Pick ’Em does not consent to marketing texts from VarsityVue or Gilder Storage.</p>
        <p>Contest-specific phone information may be kept through the conclusion of the Week 11 promotion and for 90 days afterward. VarsityVue will then delete or anonymize it unless continued retention is reasonably necessary for an unresolved prize claim, contest dispute, legal obligation, security or fraud investigation, or another separately disclosed legitimate account purpose. This retention process is administered manually; deletion is not automatic.</p>
        <p>Your account display name, picks after applicable locks, points, and ranking may appear as described in the <Link href="/pickem/rules" className="font-bold text-white underline underline-offset-2">Official Rules</Link>. VarsityVue may identify a winner by their existing display name, Pick ’Em result, and weekly prize amount. Questions about contest information may be sent to <a href="mailto:info@varsityvue.com" className="font-bold text-white underline underline-offset-2">info@varsityvue.com</a>.</p>
      </div>
      <Link href="/pickem" className="mt-7 inline-block rounded-full border border-white/20 px-5 py-3 text-sm font-bold">Back to Pick ’Em</Link>
    </article>
  </main>;
}
