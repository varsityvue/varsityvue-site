// Approved full canonical slate, independent of the Pick ’Em subset.
export const weekSevenPilotGameIds = [
  "abilene-tlca-at-hico-2026-week-7",
  "albany-at-stamford-2026-week-7",
  "anson-at-cisco-2026-week-7",
  "city-view-at-breckenridge-2026-week-7",
  "comanche-at-millsap-2026-week-7",
  "crawford-at-hubbard-2026-week-7",
  "de-leon-at-hawley-2026-week-7",
  "dublin-at-hamilton-2026-week-7",
  "eastland-at-clifton-2026-week-7",
  "frost-at-mart-2026-week-7",
  "hamlin-at-goldthwaite-2026-week-7",
  "henrietta-at-holliday-2026-week-7",
  "lampasas-at-stephenville-2026-week-7",
  "merkel-at-jacksboro-2026-week-7",
  "miles-at-winters-2026-week-7",
  "rio-vista-at-tolar-2026-week-7",
  "wortham-at-meridian-2026-week-7"
] as const;

export const weekEightPilotGameIds = [
  "anson-at-abilene-tlca-2026-week-8",
  "china-spring-at-stephenville-2026-week-8",
  "cisco-at-hawley-2026-week-8",
  "clifton-at-hamilton-2026-week-8",
  "comanche-at-dublin-2026-week-8",
  "goldthwaite-at-albany-2026-week-8",
  "hico-at-de-leon-2026-week-8",
  "holliday-at-city-view-2026-week-8",
  "hubbard-at-frost-2026-week-8",
  "jacksboro-at-breckenridge-2026-week-8",
  "mart-at-santo-2026-week-8",
  "meridian-at-crawford-2026-week-8",
  "merkel-at-henrietta-2026-week-8",
  "millsap-at-rio-vista-2026-week-8",
  "stamford-at-cross-plains-2026-week-8",
  "tolar-at-eastland-2026-week-8",
  "winters-at-hamlin-2026-week-8"
] as const;

// Explicit approval, not calendar-based or partial-coverage enablement.
export const approvedLocationPilotSlates: Readonly<Record<number, readonly string[]>> = {
  7: weekSevenPilotGameIds,
  8: weekEightPilotGameIds,
};
