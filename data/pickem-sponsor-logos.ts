// Approved Pick ’Em logo placements. The sponsor name remains the per-week
// database configuration; an asset is shown only for a matching week/name.
// Keep each referenced image in public/sponsors and check it in the focused test.

export type PickemSponsorLogo = { name: string; path: `/sponsors/${string}` };

export const pickemSponsorLogos: Readonly<Record<string, PickemSponsorLogo>> = {
  "2026-6": { name: "Gilder Storage", path: "/sponsors/gilder-storage-approved.png" },
};

export function logoForPickemWeek(
  season: number,
  week: number,
  sponsorName: string | null,
  placements: Readonly<Record<string, PickemSponsorLogo>> = pickemSponsorLogos,
): string | null {
  if (!sponsorName) return null;
  const placement = placements[`${season}-${week}`];
  return placement?.name === sponsorName ? placement.path : null;
}
