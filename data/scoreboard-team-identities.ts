export type ScoreboardTeamIdentity = {
  abbreviation: string;
  mascot: string;
  primary: string;
  secondary: string;
  accent: string;
};

const scoreboardTeamIdentities: Record<string, ScoreboardTeamIdentity> = {
  "grape creek": { abbreviation: "GCHS", mascot: "Eagles", primary: "#355E3B", secondary: "#000000", accent: "#FFFFFF" },
  keene: { abbreviation: "KHS", mascot: "Chargers", primary: "#4169E1", secondary: "#FFFFFF", accent: "#FFFFFF" },
  mcgregor: { abbreviation: "MHS", mascot: "Bulldogs", primary: "#000000", secondary: "#D4AF37", accent: "#FFFFFF" },
  "atlas homeschool": { abbreviation: "AHS", mascot: "Rattlers", primary: "#800000", secondary: "#000000", accent: "#FFFFFF" },
  austin: { abbreviation: "AHS", mascot: "Maroons", primary: "#800000", secondary: "#FFFFFF", accent: "#FFFFFF" },
  fredericksburg: { abbreviation: "FHS", mascot: "Battlin’ Billies", primary: "#C8102E", secondary: "#FFFFFF", accent: "#FFFFFF" },
  "lago vista": { abbreviation: "LVHS", mascot: "Vikings", primary: "#4169E1", secondary: "#D4AF37", accent: "#FFFFFF" },
  "central catholic": { abbreviation: "CCHS", mascot: "Buttons", primary: "#000080", secondary: "#FFFFFF", accent: "#FFFFFF" },
  gatesville: { abbreviation: "GHS", mascot: "Hornets", primary: "#000000", secondary: "#D4AF37", accent: "#FFFFFF" },
  italy: { abbreviation: "IHS", mascot: "Gladiators", primary: "#D4AF37", secondary: "#FFFFFF", accent: "#000000" },
  "archer city": { abbreviation: "ACHS", mascot: "Wildcats", primary: "#C5B358", secondary: "#000000", accent: "#FFFFFF" },
  "reagan county": { abbreviation: "RCHS", mascot: "Owls", primary: "#005C97", secondary: "#FFFFFF", accent: "#D4AF37" },
  "san angelo texas leadership": { abbreviation: "TLCA", mascot: "Eagles", primary: "#6698C9", secondary: "#000000", accent: "#FFFFFF" },
  riesel: { abbreviation: "RHS", mascot: "Indians", primary: "#800000", secondary: "#FFFFFF", accent: "#FFFFFF" },
  dawson: { abbreviation: "DHS", mascot: "Bulldogs", primary: "#000000", secondary: "#D4AF37", accent: "#FFFFFF" },
  centerville: { abbreviation: "CHS", mascot: "Tigers", primary: "#F26522", secondary: "#04113E", accent: "#FFFFFF" },
  axtell: { abbreviation: "AHS", mascot: "Longhorns", primary: "#C8102E", secondary: "#FFFFFF", accent: "#FFFFFF" },
  snook: { abbreviation: "SHS", mascot: "Bluejays", primary: "#0046B7", secondary: "#FFFFFF", accent: "#FFFFFF" },
  "cross roads": { abbreviation: "CRHS", mascot: "Bobcats", primary: "#1B4D3E", secondary: "#FFFFFF", accent: "#FFFFFF" },
  callisburg: { abbreviation: "CHS", mascot: "Wildcats", primary: "#800000", secondary: "#FFFFFF", accent: "#FFFFFF" },
  "rosebud-lott": { abbreviation: "RLHS", mascot: "Cougars", primary: "#000000", secondary: "#D4AF37", accent: "#FFFFFF" },
  west: { abbreviation: "WHS", mascot: "Trojans", primary: "#C8102E", secondary: "#000000", accent: "#FFFFFF" },
  taylor: { abbreviation: "THS", mascot: "Ducks", primary: "#228B22", secondary: "#FFFFFF", accent: "#FFFFFF" },
  "waco university": { abbreviation: "UHS", mascot: "Trojans", primary: "#451899", secondary: "#FFFFFF", accent: "#FFFFFF" },
  "midland christian": { abbreviation: "MCHS", mascot: "Mustangs", primary: "#C8102E", secondary: "#003DA5", accent: "#FFFFFF" },
  "pflugerville connally": { abbreviation: "CHS", mascot: "Cougars", primary: "#005710", secondary: "#000000", accent: "#FFFFFF" },
  "little river academy": { abbreviation: "AHS", mascot: "Bumblebees", primary: "#005710", secondary: "#FDBA31", accent: "#FFFFFF" },
  bremond: { abbreviation: "BHS", mascot: "Tigers", primary: "#C8102E", secondary: "#FFFFFF", accent: "#FFFFFF" },
  whitney: { abbreviation: "WHS", mascot: "Wildcats", primary: "#4169E1", secondary: "#FFFFFF", accent: "#FFFFFF" },
  "valley mills": { abbreviation: "VMHS", mascot: "Eagles", primary: "#4CBB17", secondary: "#D4AF37", accent: "#FFFFFF" },
  "waco connally": { abbreviation: "CHS", mascot: "Cadets", primary: "#4169E1", secondary: "#808080", accent: "#FFFFFF" },
  ballinger: { abbreviation: "BHS", mascot: "Bearcats", primary: "#C31013", secondary: "#000000", accent: "#FFFFFF" },
  baird: { abbreviation: "BHS", mascot: "Bears", primary: "#B20000", secondary: "#FFFFFF", accent: "#000000" },
  boyd: { abbreviation: "BHS", mascot: "Yellowjackets", primary: "#174434", secondary: "#FCC63C", accent: "#FFFFFF" },
  "bruceville-eddy": { abbreviation: "BEHS", mascot: "Eagles", primary: "#F6C127", secondary: "#000000", accent: "#FFFFFF" },
  crosbyton: { abbreviation: "CHS", mascot: "Chiefs", primary: "#410346", secondary: "#FFBB1E", accent: "#FFFFFF" },
  sonora: { abbreviation: "SHS", mascot: "Broncos", primary: "#FF0000", secondary: "#FFFFFF", accent: "#000000" },
  chilton: { abbreviation: "CHS", mascot: "Pirates", primary: "#005DA3", secondary: "#FFFFFF", accent: "#FFFFFF" },
  "blooming grove": { abbreviation: "BGHS", mascot: "Lions", primary: "#005DA3", secondary: "#FFFFFF", accent: "#000000" },
  milano: { abbreviation: "MHS", mascot: "Eagles", primary: "#800000", secondary: "#D4AF37", accent: "#FFFFFF" },
  kerens: { abbreviation: "KHS", mascot: "Bobcats", primary: "#4CBB17", secondary: "#000000", accent: "#FFFFFF" },
  bosqueville: { abbreviation: "BHS", mascot: "Bulldogs", primary: "#0042BE", secondary: "#000000", accent: "#FFFFFF" },
  llano: { abbreviation: "LHS", mascot: "Yellowjackets", primary: "#FF8200", secondary: "#000000", accent: "#FFFFFF" },
  "austin navarro": { abbreviation: "ANHS", mascot: "Vikings", primary: "#DCC16F", secondary: "#000000", accent: "#FFFFFF" },
  lockhart: { abbreviation: "LHS", mascot: "Lions", primary: "#800000", secondary: "#FFFFFF", accent: "#FFFFFF" },
  shamrock: { abbreviation: "SHS", mascot: "Irish", primary: "#008000", secondary: "#FFFFFF", accent: "#FFFFFF" },
  itasca: { abbreviation: "IHS", mascot: "Wampus Cats", primary: "#FFD700", secondary: "#000000", accent: "#FFFFFF" },
  seymour: { abbreviation: "SHS", mascot: "Panthers", primary: "#360305", secondary: "#FFFFFF", accent: "#000000" },
  christoval: { abbreviation: "CHS", mascot: "Cougars", primary: "#CF152D", secondary: "#FFFFFF", accent: "#000000" },
  "colorado city": { abbreviation: "CCHS", mascot: "Wolves", primary: "#CC0000", secondary: "#000000", accent: "#FFFFFF" },
  crawford: { abbreviation: "CHS", mascot: "Pirates", primary: "#B47609", secondary: "#000000", accent: "#FFFFFF" },
  frost: { abbreviation: "FHS", mascot: "Polar Bears", primary: "#4169E1", secondary: "#FFFFFF", accent: "#FFFFFF" },
  hubbard: { abbreviation: "HHS", mascot: "Jaguars", primary: "#000000", secondary: "#D4AF37", accent: "#FFFFFF" },
  mart: { abbreviation: "MHS", mascot: "Panthers", primary: "#4E2A84", secondary: "#CBB77D", accent: "#FFFFFF" },
  meridian: { abbreviation: "MHS", mascot: "Yellowjackets", primary: "#000000", secondary: "#D4AF37", accent: "#FFFFFF" },
  wortham: { abbreviation: "WHS", mascot: "Bulldogs", primary: "#004CA0", secondary: "#FFFFFF", accent: "#FFFFFF" },
  breckenridge: { abbreviation: "BHS", mascot: "Buckaroos", primary: "#008442", secondary: "#FFFFFF", accent: "#FFFFFF" },
  bangs: { abbreviation: "BHS", mascot: "Dragons", primary: "#0D9443", secondary: "#FFFFFF", accent: "#000000" },
  mason: { abbreviation: "MHS", mascot: "Punchers", primary: "#320065", secondary: "#FFFFFF", accent: "#FFFFFF" },
  jacksboro: { abbreviation: "JHS", mascot: "Tigers", primary: "#502984", secondary: "#FFFFFF", accent: "#9FA1A0" },
  "rio vista": { abbreviation: "RVHS", mascot: "Eagles", primary: "#008000", secondary: "#000000", accent: "#FFFFFF" },
  tolar: { abbreviation: "THS", mascot: "Rattlers", primary: "#800080", secondary: "#FFFFFF", accent: "#FFFFFF" },
  "lubbock cooper": { abbreviation: "LCHS", mascot: "Pirates", primary: "#C8102E", secondary: "#000000", accent: "#FFFFFF" },
  clyde: { abbreviation: "CHS", mascot: "Bulldogs", primary: "#CEB767", secondary: "#000000", accent: "#FFFFFF" },
  haskell: { abbreviation: "HHS", mascot: "Indians", primary: "#C6B47E", secondary: "#000000", accent: "#FFFFFF" },
  olney: { abbreviation: "OHS", mascot: "Cubs", primary: "#BB0303", secondary: "#A70303", accent: "#E4E4E4" },
  brady: { abbreviation: "BHS", mascot: "Bulldogs", primary: "#B3A264", secondary: "#000000", accent: "#FFFFFF" },
  moody: { abbreviation: "MHS", mascot: "Bearcats", primary: "#008000", secondary: "#D4AF37", accent: "#000000" },
  jarrell: { abbreviation: "JHS", mascot: "Cougars", primary: "#002F87", secondary: "#FFFFFF", accent: "#FFFFFF" },
  "marble falls": { abbreviation: "MFHS", mascot: "Mustangs", primary: "#4E2A84", secondary: "#CBB778", accent: "#FFFFFF" },
  burnet: { abbreviation: "BHS", mascot: "Bulldogs", primary: "#036330", secondary: "#000000", accent: "#FFFFFF" },
  lampasas: { abbreviation: "LHS", mascot: "Badgers", primary: "#00009C", secondary: "#FFFFFF", accent: "#FFFFFF" },
  "china spring": { abbreviation: "CSHS", mascot: "Cougars", primary: "#478BCA", secondary: "#121B4E", accent: "#FFFFFF" },
};

const scoreboardTeamAliases: Record<string, string> = {
  "san angelo tlca": "san angelo texas leadership",
};

const scoreboardTeamDisplayNames: Record<string, string> = {
  "san angelo texas leadership": "San Angelo Texas Leadership",
};

function normalizeScoreboardTeamName(teamName: string) {
  const normalized = teamName.trim().toLowerCase();
  return scoreboardTeamAliases[normalized] ?? normalized;
}

export function getScoreboardTeamIdentity(teamName: string) {
  return scoreboardTeamIdentities[normalizeScoreboardTeamName(teamName)];
}

export function getCanonicalScoreboardTeamName(teamName: string) {
  const normalized = normalizeScoreboardTeamName(teamName);
  return scoreboardTeamDisplayNames[normalized] ?? teamName.trim();
}

export function hasCompleteScoreboardTeamIdentity(teamName: string) {
  const identity = getScoreboardTeamIdentity(teamName);
  return Boolean(
    identity?.abbreviation?.trim() &&
    identity?.mascot?.trim() &&
    identity?.primary?.trim() &&
    identity?.secondary?.trim(),
  );
}
