import { regionTwoD1, regionTwoD2, regionThree4AD1 } from "@/data/playoff-bracket-fields";

export const statewideDivisions = [
  { id: "2A-D1", label: "2A Division I", regions: [null, regionTwoD1, null, null] },
  { id: "2A-D2", label: "2A Division II", regions: [null, regionTwoD2, null, null] },
  { id: "3A-D1", label: "3A Division I", regions: [null, null, null, null] },
  { id: "3A-D2", label: "3A Division II", regions: [null, null, null, null] },
  { id: "4A-D1", label: "4A Division I", regions: [null, null, regionThree4AD1, null] },
  { id: "4A-D2", label: "4A Division II", regions: [null, null, null, null] },
] as const;

export const regionLabels = ["Region I", "Region II", "Region III", "Region IV"] as const;
export const stateSemifinalRegionPairs = [[0, 1], [2, 3]] as const;

export function validateRegionalField(field: readonly (readonly [string, string])[] | null): string[] {
  if (!field) return ["regional field not verified"];
  const errors: string[] = [];
  if (field.length !== 8) errors.push("regional field must have eight first-round games");
  const names = field.flatMap((pair) => [...pair]);
  if (names.some((name) => !name.trim())) errors.push("blank school name");
  if (new Set(names).size !== names.length) errors.push("duplicate school in regional field");
  return errors;
}

export function statewideCoverage() {
  return statewideDivisions.map((division) => ({
    id: division.id,
    verifiedRegions: division.regions.filter((field) => validateRegionalField(field).length === 0).length,
    totalRegions: 4,
  }));
}
