/** Presentation only. Receipt status and server submission rules remain authoritative. */
export function pickemEntrySummary(input: {
  status?: string; entered: boolean; entryClosed: boolean; allLocked: boolean;
  uncertain: boolean; reconciled: boolean; selected: number; total: number;
  needsPrediction: boolean; hasPhone: boolean; attested: boolean;
}) {
  if (input.uncertain) return {
    title: input.reconciled ? "Saved state matched — review latest entry" : "Save outcome uncertain",
    detail: "Your selections are retained. Check saved state and review the latest entry before another save.",
  };
  if (input.entered && input.status !== "valid") return {
    title: "Entry ineligible or under review",
    detail: "This receipt is not a valid entry. Contact VarsityVue for review.",
  };
  if (input.entered) return {
    title: "Entry accepted.",
    detail: input.allLocked ? "Picks are locked. Review your saved picks and results below. Prize eligibility remains subject to review."
      : "Your original acceptance time is preserved. Only unlocked picks can be edited; save any changes. Prize eligibility remains subject to review.",
  };
  if (input.entryClosed || input.allLocked) return {
    title: "Entry closed — not entered",
    detail: "The new-entry deadline has passed. Saved draft selections do not qualify as an accepted entry.",
  };
  const detail = input.selected === 0
    ? `Pick all ${input.total} winners, predict the tiebreaker score, and complete the entry requirements before the deadline.`
    : input.selected < input.total
      ? `Pick ${input.total - input.selected} more winner${input.total - input.selected === 1 ? "" : "s"} to complete your slate.`
      : input.needsPrediction
        ? "Predict the tiebreaker score: both teams’ combined points."
        : !input.hasPhone
          ? "Add your mobile number below to continue."
          : !input.attested
            ? "Confirm your eligibility and agree to the rules below."
            : "Submit your entry before the deadline. Acceptance is confirmed after validation.";
  return { title: "Your entry isn’t submitted yet.", detail };

}

export function pickemRecoveryCopy(section: "history" | "standings", entryAvailable: boolean) {
  return `Your Pick ’Em ${section} is temporarily unavailable. ${entryAvailable
    ? "Review the entry form above; only a confirmed valid receipt means you are entered."
    : "New entries are closed. Your saved picks and entry records have not been changed."}`;
}
