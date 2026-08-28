export type SponsorPlacement =
  | "school-hub"
  | "game-page"
  | "district-hub"
  | "directory";

export type SponsorTier = "founding" | "premium" | "standard";

export type Sponsor = {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  placementTypes: SponsorPlacement[];
  schoolIds?: string[];
  districtIds?: string[];
  tier: SponsorTier;
  active: boolean;
};

// Sponsor inventory remains intentionally unclaimed during the 2026 pilot.
// Add businesses here only after a real sponsorship relationship is active.
export const sponsors: Sponsor[] = [];

export function getSchoolSponsors(schoolId: string) {
  return sponsors.filter(
    (sponsor) =>
      sponsor.active &&
      sponsor.placementTypes.includes("school-hub") &&
      sponsor.schoolIds?.includes(schoolId)
  );
}

export function getGameSponsors(schoolId: string) {
  return sponsors.filter(
    (sponsor) =>
      sponsor.active &&
      sponsor.placementTypes.includes("game-page") &&
      sponsor.schoolIds?.includes(schoolId)
  );
}
