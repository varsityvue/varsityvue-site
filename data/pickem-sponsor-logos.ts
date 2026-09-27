// Approved Pick ’Em logo placements. The sponsor name remains the per-week
// database configuration; an asset is shown only for a matching week/name.
// Add a reviewed image as a static import and its week mapping here after the
// owner supplies it. Static imports fail the build when the file is missing.
import type { StaticImageData } from "next/image";

export type PickemSponsorLogo = { name: string; image: StaticImageData };

export const pickemSponsorLogos: Readonly<Record<string, PickemSponsorLogo>> = {};

export function logoForPickemWeek(
  season: number,
  week: number,
  sponsorName: string | null,
  placements: Readonly<Record<string, PickemSponsorLogo>> = pickemSponsorLogos,
): StaticImageData | null {
  if (!sponsorName) return null;
  const placement = placements[`${season}-${week}`];
  return placement?.name === sponsorName ? placement.image : null;
}
