import { statewideDivisions } from "@/data/statewide-playoff-brackets";

export function findSchoolBracketLocation(selection: string) {
  const parts = selection.split("|");
  const school = parts.length === 3 ? parts[2] : selection;
  for (const division of statewideDivisions) {
    for (let regionIndex = 0; regionIndex < division.regions.length; regionIndex++) {
      if (parts.length === 3 && (parts[0] !== division.id || parts[1] !== String(regionIndex))) continue;
      const field = division.regions[regionIndex];
      if (!field) continue;
      const firstIndex = field.findIndex((pair) => pair.some((name) => name === school));
      if (firstIndex >= 0) return { division, regionIndex, field, firstIndex, schoolName: school };
    }
  }
  return null;
}
