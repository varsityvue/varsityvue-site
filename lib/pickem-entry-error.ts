export function pickemEntryErrorMessage(errorMessage: string): string {
  const detail = errorMessage.toLowerCase();
  return detail.includes("already has a different contest number") ? "This account is already linked to a different contest number. Contact VarsityVue support for help."
    : detail.includes("already used") ? "This number is already used for another entrant."
    : detail.includes("attestation") ? "Confirm eligibility and agreement to the Official Rules before entering."
    : detail.includes("phone") || detail.includes("mobile") ? "Enter a valid U.S. mobile number."
    : detail.includes("frozen first-kickoff") ? "New entries closed at the frozen first-kickoff deadline."
    : detail.includes("locked") ? "A game or prediction locked while saving. Refresh and try again."
    : detail.includes("every game") ? "Select every game before entering."
    : "Your entry could not be saved. Refresh and review the slate.";
}
