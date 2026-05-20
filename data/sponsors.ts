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

export const sponsors: Sponsor[] = [
  {
    id: "1-way-landscape",
    name: "1 Way Landscape",
    logo: "/sponsors/1way-landscape.png",
    website: "https://1waylandscape.com",
    placementTypes: ["school-hub", "game-page"],
    schoolIds: ["de-leon"],
    tier: "founding",
    active: true,
  },
  {
    id: "premier-event-rentals",
    name: "Premier Event Rentals",
    logo: "/sponsors/premier-event-rentals.png",
    website: "https://premiereventrentals.shop",
    placementTypes: ["school-hub"],
    schoolIds: ["de-leon"],
    tier: "premium",
    active: true,
  },
];

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