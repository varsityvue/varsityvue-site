import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pick ’Em Official Rules | VarsityVue",
  description: "Official Rules for VarsityVue’s 2026 Weeks 6–11 Pick ’Em contests.",
};

const sections = [
  ["Operator and sponsor", [
    "Blaine Garcia d/b/a VarsityVue operates and administers six separate free Pick ’Em contests for Weeks 6 through 11 of the 2026 football season. Each week has its own slate, deadline, entrants, standings, prize, and winner. Gilder Storage is the presenting advertising sponsor and has provided up to $500 total toward the six-week promotion. VarsityVue remains responsible for all advertised weekly prizes, including any aggregate amount beyond that contribution. Gilder Storage does not administer entries or claims, determine eligibility or winners, grade picks, or directly pay winners.",
    "No purchase from VarsityVue or Gilder Storage is necessary. Purchasing from, contacting, renting from, or otherwise doing business with Gilder Storage provides no contest advantage. Internet access and a free VarsityVue account are required.",
  ]],
  ["Eligibility", [
    "Texas residents age 18 or older at entry may participate. Blaine Garcia, the contest operator, is the sole automatically excluded entrant. Administrators, moderators, graders, and other helpers are not excluded solely because of their roles. All entrants remain subject to the same integrity rules. Void where prohibited.",
    "Each entrant must affirm: “I confirm that I am 18 or older, a Texas resident, and agree to the Official Rules.” This is a recorded self-attestation, not independent age, residency, or identity verification.",
  ]],
  ["One entry per person and how to enter", [
    "One valid entry per person per week, regardless of accounts, devices, or phone numbers. Sign into a free VarsityVue account; provide a U.S. mobile number; pick a winner for every included, non-VOID game; predict one whole number from 0 to 300 for both teams’ combined points in the Pick ’Em Tiebreaker Game; give the required attestation; and submit a complete entry before the new-entry deadline. If the tiebreaker game is already VOID, no prediction is required and that comparison is skipped.",
    "A successful completed-entry confirmation indicates receipt. A registered account, incomplete or unsaved slate, missing required prediction or attestation, and a draft do not qualify. Draft picks and a draft prediction may be saved, but a draft has no valid-entry time, standing, or prize effect. Phone formats are normalized and checked for reuse across entrant accounts. VarsityVue does not verify ownership or mobile-line type. Entrants must keep their account and contact details accurate.",
  ]],
  ["Opening, deadline, edits, and locks", [
    "Each weekly contest opens at its announced time after these rules are published. At opening, the deadline for new completed entries freezes at the then-scheduled kickoff of the earliest included game. The entry page displays its exact Central Time date and time. A complete entry must be received before that instant. Later schedule changes do not move the frozen deadline; an incomplete draft cannot become valid afterward.",
    "Existing valid entrants may edit an unlocked game until that game’s applicable lock, and the tiebreaker prediction until the Tiebreaker Game locks, even after new entry closes. Edits do not reset the initial valid completed-entry time or add another entrant. A failed save leaves the prior accepted entry in effect. Once all games have locked, no selections can be edited.",
    "An included game moved ahead of the frozen new-entry deadline is made VOID for Pick ’Em before the earlier lock is recorded. A postponement or later kickoff does not extend the entry deadline. Times use America/Chicago, including daylight saving time.",
  ]],
  ["Scoring and tiebreakers", [
    "Each correct pick in a qualifying verified game earns one point; an incorrect pick earns zero. A VOID game earns neither a point nor a loss. An official verified forfeit with an explicit winner counts for pick scoring. A played overtime game uses its official winner and full final score, including overtime points.",
    "Entries rank by most correct picks, then the smallest absolute difference between the predicted combined points and the qualifying verified played final total of the designated Pick ’Em Tiebreaker Game, then the earliest initial valid completed-entry time. If completion times match, VarsityVue’s recorded entry order resolves the tie. Later edits do not change that time. If the Tiebreaker Game has no qualifying verified played total, everyone skips the prediction comparison and ranking proceeds to initial entry order.",
  ]],
  ["Schedule exceptions and corrected results", [
    "An included game must have a verified official result by 11:59 p.m. Central on the Monday immediately following the contest weekend to count. Otherwise it becomes VOID for that week, even if played or reported later. A cancellation, no contest, or official tie without a pickable winner is VOID for pick scoring. A postponed or rescheduled game remains pending until a timely result or that Monday cutoff. A scoreless forfeit with an explicit official winner counts for pick scoring but supplies no combined-points tiebreaker total.",
    "An authorized correction of a timely verified official result can change grades, standings, tiebreaker differences, and the provisional winner. A matchup already VOID under the weekly cutoff is not revived by a later canonical result. The designated Tiebreaker Game cannot be replaced after the contest opens.",
  ]],
  ["Weekly cash prize", [
    "There is one cash prize per week: $1 for each valid accepted completed entry that week, capped at $100. Seventeen qualifying entries produce $17; 100 or more produce $100. The six weekly maximums could total $600. Gilder Storage contributes up to $500 toward the six-week promotion without an allocation to particular weeks; VarsityVue remains responsible for the advertised prizes. Unused weekly capacity does not roll over.",
    "Incomplete drafts, rejected or disqualified entries, duplicates, and test entries do not count. The displayed entry count and prize are provisional, subject to eligibility and disqualification review. VarsityVue pays the winner using a mutually agreed electronic payment method or a reasonable alternative. No fee is required to claim.",
  ]],
  ["Winner review, notice, and claim", [
    "After included games have qualifying results or become VOID, VarsityVue reviews grading, eligibility, duplicates, tiebreakers, and entry order and records results finalization. It will attempt to notify the provisional winner within 24 hours. That candidate has 72 hours from actual notification to respond and establish eligibility as reasonably required.",
    "If a candidate is ineligible, disqualified, cannot be contacted, or fails to respond, VarsityVue documents the reason and contacts the next ranked eligible entrant under the same final ranking. Each replacement receives 72 hours from notification. No reallocation continues more than 30 days after the applicable results finalization; if no eligible winner claims by then, the prize remains unawarded. There is no redraw.",
    "Before payment, a winner-changing authorized correction requires review of corrected standings and a new results finalization. Earlier contact or confirmation alone does not entitle the former leader to payment. Prior notice and claim history is preserved, and the newly determined provisional winner begins the normal notice and response process. A correction that does not change the leading eligible entrant does not restart that candidate’s response window. After recorded payment, VarsityVue reviews a later correction under these rules and applicable law; there is no automatic clawback.",
  ]],
  ["Integrity and technical issues", [
    "VarsityVue may investigate and disqualify actual duplicate participation, false contact details, manipulated or automated entries, attempts to evade locks, advance access to nonpublic picks or locked contest information, score tampering, misuse of privileged access, or other conduct compromising fairness. A role alone is not misconduct. Decisions are documented and made in good faith, subject to applicable law.",
    "Technical failures do not extend a game lock or guarantee an unsaved entry was received. If a material outage prevents fair administration, VarsityVue will announce an equitable remedy consistent with applicable law.",
  ]],
  ["Privacy and winner identification", [
    "VarsityVue privately uses the required phone number for duplicate deterrence and winner contact, not public display or marketing-text consent. Number ownership and mobile-line type are not verified. Gilder Storage receives no entrant phone numbers, email addresses, private account information, or administrative contest records merely because it sponsors the promotion. The Pick ’Em Privacy Notice explains retention.",
    "Account display names, picks after applicable locks, points, and rankings may appear publicly. VarsityVue may identify a winner by the existing display name, Pick ’Em result, and weekly prize amount. Entry or winning does not grant broad rights to use a legal name, photograph, likeness, biography, testimonial, or unrelated advertising without separate permission.",
  ]],
  ["Taxes, social platforms, and contact", [
    "Winners are responsible for applicable taxes. VarsityVue will handle applicable prize reporting as required by law. This promotion is not sponsored, endorsed, administered by, or associated with Facebook or Meta. Entrants release Facebook and Meta from claims arising from this promotion to the extent permitted by law.",
    "Questions or eligibility disputes may be sent to info@varsityvue.com. VarsityVue may publish authorized clarifications or corrections consistent with applicable law.",
  ]],
] as const;

export default function PickemRulesPage() {
  return <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-10 text-white sm:px-6 sm:py-16">
    <article className="mx-auto max-w-3xl rounded-2xl border border-white/15 bg-white/[0.04] p-5 sm:p-10">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--vv-accent)]">Free to play · Texas 18+</p>
      <h1 className="mt-3 text-3xl font-black sm:text-4xl">VarsityVue Pick ’Em Official Rules</h1>
      <p className="mt-3 text-sm text-white/60">2026 Weeks 6–11 · Version 2026-pickem-cash-v1</p>
      <p className="mt-4 text-sm leading-7 text-white/75">Six separate weekly contests. Each week’s opening time and exact new-entry deadline appear on the Pick ’Em page when opened.</p>
      <div className="mt-8 space-y-8">{sections.map(([title, paragraphs], index) => <section key={title}>
        <h2 className="text-xl font-black">{index + 1}. {title}</h2>
        {paragraphs.map((paragraph) => <p key={paragraph} className="mt-3 text-sm leading-7 text-white/75">{paragraph}</p>)}
      </section>)}</div>
      <p className="mt-8 text-sm text-white/70">Read the <Link href="/pickem/privacy" className="font-bold text-white underline underline-offset-2">Pick ’Em Privacy Notice</Link>.</p>
      <Link href="/pickem" className="mt-6 inline-block rounded-full border border-white/20 px-5 py-3 text-sm font-bold">Back to Pick ’Em</Link>
    </article>
  </main>;
}
