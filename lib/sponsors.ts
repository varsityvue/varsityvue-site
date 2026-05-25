import { sponsors } from "@/data/sponsors";

export function getSponsors() {
  return sponsors;
}

export function getActiveSponsors(limit?: number) {
  const activeSponsors = sponsors.filter((sponsor) => sponsor.active);

  return typeof limit === "number"
    ? activeSponsors.slice(0, limit)
    : activeSponsors;
}

export function getSponsorById(id: string) {
  return sponsors.find((sponsor) => sponsor.id === id);
}
export function getGameSponsors(schoolId: string) {
  return sponsors.filter(
    (sponsor) =>
      sponsor.active &&
      sponsor.placementTypes.includes("game-page") &&
      sponsor.schoolIds?.includes(schoolId)
  );
}