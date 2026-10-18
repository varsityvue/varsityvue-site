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
    title: "Valid entry accepted",
    detail: input.allLocked ? "Picks are locked. Review your saved picks and results below. Prize eligibility remains subject to review."
      : "Your original acceptance time is preserved. Only unlocked picks can be edited; save any changes. Prize eligibility remains subject to review.",
  };
  if (input.entryClosed || input.allLocked) return {
    title: "Entry closed — not entered",
    detail: "The new-entry deadline has passed. Saved draft selections do not qualify as an accepted entry.",
  };
  const remaining = [
    ...(input.selected < input.total ? [`Choose ${input.total - input.selected} remaining winner${input.total - input.selected === 1 ? "" : "s"}`] : []),
    ...(input.needsPrediction ? ["enter the combined-points prediction"] : []),
    ...(!input.hasPhone ? ["provide your mobile number"] : []),
    ...(!input.attested ? ["confirm eligibility and rules"] : []),
  ];
  return { title: "Draft — not entered", detail: remaining.length
    ? `Still required: ${remaining.join("; ")}. Then submit your entry before the deadline.`
    : "Required fields have values. Submit your entry before the deadline; the server validates eligibility and accepts the entry. Selections alone do not enter the contest." };
}

export function pickemRecoveryCopy(section: "history" | "standings", entryAvailable: boolean) {
  return `Your Pick ’Em ${section} is temporarily unavailable. ${entryAvailable
    ? "Review the entry form above; only a confirmed valid receipt means you are entered."
    : "New entries are closed. Your saved picks and entry records have not been changed."}`;
}
