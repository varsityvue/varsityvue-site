import { statewideDivisions, regionLabels } from "@/data/statewide-playoff-brackets";

export type BracketSchoolSlot = {
  region: string;
  slot: number;
  schools: readonly string[];
};

/** Each area slot is formed by two adjacent bi-district games. */
export function getBracketSchoolSlots(): BracketSchoolSlot[] {
  return statewideDivisions.flatMap((division) =>
    division.regions.flatMap((field, regionIndex) =>
      Array.from({ length: field.length / 2 }, (_, slotIndex) => ({
        region: `${division.label} · ${regionLabels[regionIndex]}`,
        slot: slotIndex + 1,
        schools: [
          ...field[slotIndex * 2],
          ...field[slotIndex * 2 + 1],
        ],
      })),
    ),
  );
}

export function bracketSlotMatchesSchool(
  region: string,
  slot: number,
  search: string,
  slots: readonly BracketSchoolSlot[],
): boolean {
  const needle = search.trim().toLocaleLowerCase("en-US");
  if (!needle) return true;
  const bracketSlot = slots.find((item) => item.region === region && item.slot === slot);
  return Boolean(bracketSlot?.schools.some((school) => school.toLocaleLowerCase("en-US").includes(needle)));
}
