import { regionTwoD1, regionTwoD2, regionThree4AD1 } from "@/data/playoff-bracket-fields";

export const regionOne2AD1 = [
  ["Panhandle", "Floydada"], ["Forsan", "Abernathy"],
  ["Tulia", "Sanford-Fritch"], ["New Home", "Ballinger"],
  ["Post", "Ozona"], ["Olton", "Highland Park"],
  ["Sonora", "New Deal"], ["Spearman", "Farwell"],
] as const;

// UIL-linked MaxPreps 2026 2A Division I bracket, games G17-G32.
export const regionThree2AD1 = [
  ["Cooper", "Como-Pickton"], ["Shelbyville", "Waskom"],
  ["Carlisle", "Honey Grove"], ["Beckville", "Garrison"],
  ["Pewitt", "Joaquin"], ["Frankston", "Whitewright"],
  ["San Augustine", "Union Grove"], ["Tom Bean", "Hawkins"],
] as const;
export const regionFour2AD1 = [
  ["Thorndale", "Groveton"], ["Refugio", "Weimar"],
  ["Leon", "Bruceville-Eddy"], ["Ganado", "Taft"],
  ["Shiner", "Freer"], ["Lovelady", "Granger"],
  ["Dilley", "Flatonia"], ["Rosebud-Lott", "Corrigan-Camden"],
] as const;

// 2026 UIL-linked MaxPreps 2A Division II: G1-G8, G17-G24, G25-G32.
// https://www.maxpreps.com/tournament/T9IzeuJN60OqN3mH1cM0qw/XZGmaAD6qk-NrhqmU1Ar5A/football-26/2026-uil-texas-football-state-championships-2026-football-conference-2a-d2.htm
export const regionOne2AD2 = [
  ["Gruver", "Plains"], ["McCamey", "Tahoka"],
  ["Ropes", "Vega"], ["Lockney", "Iraan"],
  ["Roscoe", "Eldorado"], ["Sudan", "West Texas"],
  ["Wink", "Ralls"], ["Stratford", "Seagraves"],
] as const;
export const regionThree2AD2 = [
  ["Collinsville", "Maud"], ["Colmesneil", "Cushing"],
  ["Clarksville", "Boles"], ["Grapeland", "West Hardin"],
  ["Overton", "Evadale"], ["Detroit", "Era"],
  ["West Sabine", "Tenaha"], ["Lindsay", "Bowie"],
] as const;
export const regionFour2AD2 = [
  ["Bremond", "D'Hanis"], ["Ben Bolt", "Three Rivers"],
  ["Junction", "Bartlett"], ["Yorktown", "Santa Maria"],
  ["Falls City", "Agua Dulce"], ["Harper", "Burton"],
  ["La Villa", "Pettus"], ["Chilton", "Brackett"],
] as const;

// 2026 UIL-linked MaxPreps 3A Division I: G1–G32 in exact bracket order.
// https://www.maxpreps.com/tournament/T9IzeuJN60OqN3mH1cM0qw/il2A4x778EusgRk6t5UYDQ/football-26/2026-uil-texas-football-state-championships-2026-football-conference-3a-d1.htm
export const regionOne3AD1 = [
  ["Shallowater", "Compass Academy"], ["Peaster", "Early"],
  ["Clyde", "Denver City"], ["Ingram Moore", "Vernon"],
  ["Wall", "Bowie"], ["Sweetwater", "Dalhart"],
  ["Paradise", "Llano"], ["Bushland", "Jim Ned"],
] as const;
export const regionTwo3AD1 = [
  ["Gunter", "Groesbeck"], ["Liberty-Eylau", "Commerce"],
  ["Whitney", "Life Oak Cliff"], ["Winnsboro", "Tatum"],
  ["Malakoff", "Gladewater"], ["Mexia", "Pilot Point"],
  ["Atlanta", "Mount Vernon"], ["Whitesboro", "Grandview"],
] as const;
export const regionThree3AD1 = [
  ["Diboll", "Buna"], ["Lorena", "Sweeny"],
  ["Orangefield", "Trinity"], ["Edna", "C.H. Yoe"],
  ["Columbus", "Little River Academy"], ["Anahuac", "Westwood"],
  ["Franklin", "Hempstead"], ["Fairfield", "East Chambers"],
] as const;
export const regionFour3AD1 = [
  ["Yoakum", "Carrizo Springs"], ["Rio Hondo", "Goliad"],
  ["Devine", "Randolph"], ["Orange Grove", "Raymondville"],
  ["Sinton", "Lyford"], ["Jourdanton", "Hallettsville"],
  ["San Diego", "Mathis"], ["Marion", "Hondo"],
] as const;

// 2026 UIL-linked MaxPreps 3A Division II bracket, G1–G32 in official order.
// https://www.maxpreps.com/tournament/T9IzeuJN60OqN3mH1cM0qw/49_sTsweqEqmuXEnk5KIrg/football-26/2026-uil-texas-football-state-championships-2026-football-conference-3a-d2.htm
export const regionOne3AD2 = [
  ["Canadian", "Muleshoe"], ["Merkel", "Crane"],
  ["Idalou", "Dimmitt"], ["Coahoma", "Holliday"],
  ["Stanton", "Henrietta"], ["Slaton", "Friona"],
  ["Jacksboro", "Grape Creek"], ["Childress", "Littlefield"],
] as const;
export const regionTwo3AD2 = [
  ["Millsap", "Trinity Leadership"], ["Edgewood", "Valley View"],
  ["Maypearl", "Clifton"], ["Howe", "Quitman"],
  ["Bells", "Lone Oak"], ["Madison", "Hamilton"],
  ["Grand Saline", "Leonard"], ["Tolar", "Scurry-Rosser"],
] as const;
export const regionThree3AD2 = [
  ["Hooks", "Arp"], ["New Waverly", "Buffalo"],
  ["Jefferson", "Redwater"], ["Teague", "Hardin"],
  ["Mildred", "Woodville"], ["West Rusk", "New Boston"],
  ["Newton", "Elkhart"], ["De Kalb", "Troup"],
] as const;
export const regionFour3AD2 = [
  ["Thrall", "Brazos"], ["Hebbronville", "Blanco"],
  ["East Bernard", "Anderson-Shiro"], ["Stockdale", "Cotulla"],
  ["Poth", "Santa Rosa"], ["Rice Consolidated", "Rogers"],
  ["George West", "Nixon-Smiley"], ["Lexington", "Boling"],
] as const;

export const statewideDivisions = [
  { id: "2A-D1", label: "2A Division I", regions: [regionOne2AD1, regionTwoD1, regionThree2AD1, regionFour2AD1] },
  { id: "2A-D2", label: "2A Division II", regions: [regionOne2AD2, regionTwoD2, regionThree2AD2, regionFour2AD2] },
  { id: "3A-D1", label: "3A Division I", regions: [regionOne3AD1, regionTwo3AD1, regionThree3AD1, regionFour3AD1] },
  { id: "3A-D2", label: "3A Division II", regions: [regionOne3AD2, regionTwo3AD2, regionThree3AD2, regionFour3AD2] },
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
