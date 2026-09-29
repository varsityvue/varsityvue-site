import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pick ’Em Official Rules | VarsityVue",
  description: "Official Rules for VarsityVue’s 2026 Weeks 6–11 Pick ’Em contests.",
};

const sections = [
  ["Contest and eligibility", [
    "VarsityVue operates six separate free Pick ’Em contests, one each week from Week 6 through Week 11 of the 2026 football season. Each week has its own entries, standings, prize and winner. No purchase is necessary. Void where prohibited.",
    "You must be a Texas resident age 18 or older, have a free VarsityVue account, and confirm that you meet the eligibility requirements and agree to these rules. The contest operator is not eligible to enter. Only one valid entry per person is allowed each week.",
    "Gilder Storage is the presenting sponsor. VarsityVue operates the contests and is responsible for the advertised prizes. Gilder Storage does not administer entries or determine winners. Buying from or doing business with Gilder Storage gives you no advantage.",
  ]],
  ["Entering and making picks", [
    "To enter, provide a U.S. mobile number, pick a winner for every included game that is not VOID, predict a whole number from 0 to 300 for the combined points in the designated Pick ’Em Tiebreaker Game, give the eligibility confirmation, and submit the complete entry before the week’s new-entry deadline. If the tiebreaker game is already VOID, no points prediction is required.",
    "Saved drafts and incomplete slates are not entries. A completed entry must be received and confirmed to count.",
    "When a week opens, its new-entry deadline is fixed at the then-scheduled kickoff of its earliest included game. The Pick ’Em page shows the exact deadline in Central Time. A later postponement does not extend it. If an included game moves to a time before the fixed deadline, that game becomes VOID for Pick ’Em.",
    "After entering, you may change picks for games that have not kicked off, even after the new-entry deadline. Each game locks at kickoff; the points prediction locks when the tiebreaker game kicks off. A change counts only when successfully saved. Edits do not change the time of your original valid entry.",
  ]],
  ["Scores and ranking", [
    "You earn one point for each correct pick and zero for an incorrect pick. A VOID game neither earns nor loses a point. An official forfeit with a declared winner counts. A cancellation, no contest or official tie without a pickable winner is VOID.",
    "A game counts only if VarsityVue has a verified official result by Monday at 11:59 p.m. Central following that contest weekend. Otherwise, it is VOID for that week. Overtime counts in the full official final score.",
    "Entrants rank by most correct picks, then the closest prediction of the designated tiebreaker game’s combined final points, then the earliest original valid completed-entry time. If that game is VOID or has no qualifying played final total, the points comparison is skipped. If completion times match exactly, VarsityVue’s recorded entry order breaks the tie.",
    "Authorized corrections before payment may change grades, standings and the provisional winner. After a prize has been paid, a later correction does not automatically require repayment.",
  ]],
  ["Weekly prize and winner", [
    "The weekly prize is $1 per valid accepted entry, up to $100. Unused prize capacity does not roll over. Displayed entry counts and prize amounts are provisional until eligibility, duplicates and disqualifications are reviewed.",
    "VarsityVue aims to contact the provisional winner within 24 hours after results are finalized. The winner has 72 hours after notification to respond and confirm eligibility if requested. If the winner is ineligible, disqualified, cannot be contacted or does not respond, the prize passes to the next eligible entrant under the final standings. The same 72-hour response period applies. Reallocation ends 30 days after results are finalized. If no eligible winner claims the prize by then, it may remain unawarded.",
    "VarsityVue will pay by a mutually agreed electronic method or a reasonable alternative. No fee is required to claim.",
  ]],
] as const;

const paragraphClassName = "mt-3 text-sm leading-7 text-white/75";

export default function PickemRulesPage() {
  return <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-10 text-white sm:px-6 sm:py-16">
    <article className="mx-auto max-w-3xl rounded-2xl border border-white/15 bg-white/[0.04] p-5 sm:p-10">
      <p className="text-xs font-bold uppercase tracking-widest text-[var(--vv-accent)]">Free to play · Texas 18+</p>
      <h1 className="mt-3 text-3xl font-black sm:text-4xl">VarsityVue Pick ’Em Official Rules</h1>
      <p className="mt-3 text-sm text-white/60">2026 Weeks 6–11</p>
      <div className="mt-8 space-y-8">{sections.map(([title, paragraphs], index) => <section key={title}>
        <h2 className="text-xl font-black">{index + 1}. {title}</h2>
        {paragraphs.map((paragraph) => <p key={paragraph} className={paragraphClassName}>{paragraph}</p>)}
      </section>)}
        <section>
          <h2 className="text-xl font-black">5. Fair play, privacy and other terms</h2>
          <p className={paragraphClassName}>VarsityVue may reject or disqualify duplicate, fraudulent, manipulated or lock-evading participation. A technical failure does not guarantee receipt of an unsaved entry or extend a deadline or game lock. VarsityVue may address a material technical problem fairly.</p>
          <p className={paragraphClassName}>VarsityVue keeps the required mobile number private and uses it for duplicate deterrence and winner contact. Providing a mobile number does not consent to marketing texts. Gilder Storage receives no entrant private information merely because it sponsors Pick ’Em. Display names, picks, points and rankings may be shown publicly. The <Link href="/pickem/privacy" className="font-bold text-white underline underline-offset-2">Pick ’Em Privacy Notice</Link> provides more detail.</p>
          <p className={paragraphClassName}>This promotion is not sponsored, endorsed, administered by or associated with Facebook or Meta.</p>
          <p className={paragraphClassName}>Questions or eligibility disputes: info@varsityvue.com.</p>
        </section>
      </div>
      <Link href="/pickem" className="mt-6 inline-block rounded-full border border-white/20 px-5 py-3 text-sm font-bold">Back to Pick ’Em</Link>
    </article>
  </main>;
}
