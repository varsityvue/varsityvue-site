import { statewideDivisions } from "@/data/statewide-playoff-brackets";

export function findSchoolBracketLocation(school: string) {
  for (const division of statewideDivisions) {
    for (let regionIndex = 0; regionIndex < division.regions.length; regionIndex++) {
      const field = division.regions[regionIndex];
      if (!field) continue;
      const firstIndex = field.findIndex((pair) => pair.some((name) => name === school));
      if (firstIndex >= 0) return { division, regionIndex, field, firstIndex };
    }
  }
  return null;
}
