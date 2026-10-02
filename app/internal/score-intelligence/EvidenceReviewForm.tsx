import { scoutExpectedState, type ScoutState, type scoutEvidenceSnapshot } from "@/lib/score-scout-review";

type Props = {
  action: (form: FormData) => Promise<void>;
  snapshot: ReturnType<typeof scoutEvidenceSnapshot>;
  state?: ScoutState;
  decision: "approve" | "reject" | "defer";
  awayTeam: string; homeTeam: string;
};
export default function EvidenceReviewForm({ action, snapshot, state, decision, awayTeam, homeTeam }: Props) {
  const expected = scoutExpectedState(state);
  return <form action={action} className="flex flex-col gap-2">
    <input type="hidden" name="evidence_id" value={snapshot.id} />
    <input type="hidden" name="game_id" value={snapshot.game_id} />
    <input type="hidden" name="decision" value={decision} />
    <input type="hidden" name="evidence_snapshot" value={JSON.stringify(snapshot)} />
    <input type="hidden" name="expected_updated_at" value={expected.updatedAt} />
    <input type="hidden" name="expected_revision" value={expected.revision} />
    <input type="hidden" name="expected_absent" value={String(expected.absent)} />
    <input type="hidden" name="review_note" value={`${decision === "approve" ? "Approved" : decision === "reject" ? "Rejected" : "Deferred"} during Score Scout evidence review.`} />
    {decision === "approve" ? <label className="max-w-lg text-xs leading-5 text-white/70"><input type="checkbox" name="confirm_final" value="yes" required className="mr-2" />I verified {awayTeam} {snapshot.away_score} — {homeTeam} {snapshot.home_score} is an ordinary played FINAL, not a tie, forfeit, or exceptional outcome. Publish this canonical FINAL result.</label> : null}
    <button className={`self-start rounded-lg border px-3 py-1.5 text-[10px] font-black ${decision === "approve" ? "border-emerald-300/20 bg-emerald-400/15 text-emerald-100" : decision === "reject" ? "border-red-300/15 text-red-100/70" : "border-amber-300/15 text-amber-100/70"}`}>{decision === "approve" ? "Approve & Publish Final" : decision === "reject" ? "Reject" : "Defer"}</button>
  </form>;
}
