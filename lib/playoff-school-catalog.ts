import { playoffSchoolIdentities } from "@/data/playoff-school-slugs";
import { normalizePlayoffDivision } from "@/lib/playoff-division";
import { getSchoolBySlug } from "@/lib/schools";

const normalizeName = (name: string) => name.trim().toLocaleLowerCase("en-US");
const normalizeRegion = (region: string) => region.trim().replace(/^Region\s+/i, "").toUpperCase();

/** Exact qualified identity only; never guesses by mascot, substring or city. */
export function resolveBracketSchool(bracketName: string, division: string, region: string) {
  const normalizedDivision = normalizePlayoffDivision(division);
  if (!normalizedDivision || !["I", "II", "III", "IV"].includes(normalizeRegion(region))) return undefined;
  const matches = playoffSchoolIdentities.filter((item) =>
    normalizeName(item.bracketName) === normalizeName(bracketName) &&
    normalizePlayoffDivision(item.division) === normalizedDivision &&
    normalizeRegion(item.region) === normalizeRegion(region));
  if (matches.length !== 1 || !matches[0].schoolSlug) return undefined;
  return getSchoolBySlug(matches[0].schoolSlug);
}
