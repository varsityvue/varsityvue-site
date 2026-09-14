export type ScoreboardTeamIdentity = {
  abbreviation: string;
  mascot: string;
  primary: string;
  secondary: string;
  accent: string;
};

const scoreboardTeamIdentities: Record<string, ScoreboardTeamIdentity> = {
  "grape creek": {
    abbreviation: "GCHS",
    mascot: "Eagles",
    primary: "#355E3B",
    secondary: "#000000",
    accent: "#FFFFFF",
  },
  keene: {
    abbreviation: "KHS",
    mascot: "Chargers",
    primary: "#4169E1",
    secondary: "#FFFFFF",
    accent: "#FFFFFF",
  },
  mcgregor: {
    abbreviation: "MHS",
    mascot: "Bulldogs",
    primary: "#000000",
    secondary: "#D4AF37",
    accent: "#FFFFFF",
  },
  "atlas homeschool": {
    abbreviation: "AHS",
    mascot: "Rattlers",
    primary: "#800000",
    secondary: "#000000",
    accent: "#FFFFFF",
  },
  austin: {
    abbreviation: "AHS",
    mascot: "Maroons",
    primary: "#800000",
    secondary: "#FFFFFF",
    accent: "#FFFFFF",
  },
  fredericksburg: {
    abbreviation: "FHS",
    mascot: "Battlin’ Billies",
    primary: "#C8102E",
    secondary: "#FFFFFF",
    accent: "#FFFFFF",
  },
  "lago vista": {
    abbreviation: "LVHS",
    mascot: "Vikings",
    primary: "#4169E1",
    secondary: "#D4AF37",
    accent: "#FFFFFF",
  },
  "central catholic": {
    abbreviation: "CCHS",
    mascot: "Buttons",
    primary: "#000080",
    secondary: "#FFFFFF",
    accent: "#FFFFFF",
  },
  gatesville: {
    abbreviation: "GHS",
    mascot: "Hornets",
    primary: "#000000",
    secondary: "#D4AF37",
    accent: "#FFFFFF",
  },
  italy: {
    abbreviation: "IHS",
    mascot: "Gladiators",
    primary: "#D4AF37",
    secondary: "#FFFFFF",
    accent: "#000000",
  },
  "archer city": {
    abbreviation: "ACHS",
    mascot: "Wildcats",
    primary: "#C5B358",
    secondary: "#000000",
    accent: "#FFFFFF",
  },
  "reagan county": {
    abbreviation: "RCHS",
    mascot: "Owls",
    primary: "#005C97",
    secondary: "#FFFFFF",
    accent: "#D4AF37",
  },
  "san angelo texas leadership": {
    abbreviation: "TLCA",
    mascot: "Eagles",
    primary: "#6698C9",
    secondary: "#000000",
    accent: "#FFFFFF",
  },
  riesel: {
    abbreviation: "RHS",
    mascot: "Indians",
    primary: "#800000",
    secondary: "#FFFFFF",
    accent: "#FFFFFF",
  },
  dawson: {
    abbreviation: "DHS",
    mascot: "Bulldogs",
    primary: "#000000",
    secondary: "#D4AF37",
    accent: "#FFFFFF",
  },
  centerville: {
    abbreviation: "CHS",
    mascot: "Tigers",
    primary: "#F26522",
    secondary: "#04113E",
    accent: "#FFFFFF",
  },
  axtell: {
    abbreviation: "AHS",
    mascot: "Longhorns",
    primary: "#C8102E",
    secondary: "#FFFFFF",
    accent: "#FFFFFF",
  },
  snook: {
    abbreviation: "SHS",
    mascot: "Bluejays",
    primary: "#0046B7",
    secondary: "#FFFFFF",
    accent: "#FFFFFF",
  },
  "cross roads": {
    abbreviation: "CRHS",
    mascot: "Bobcats",
    primary: "#1B4D3E",
    secondary: "#FFFFFF",
    accent: "#FFFFFF",
  },
  callisburg: {
    abbreviation: "CHS",
    mascot: "Wildcats",
    primary: "#800000",
    secondary: "#FFFFFF",
    accent: "#FFFFFF",
  },
  "rosebud-lott": {
    abbreviation: "RLHS",
    mascot: "Cougars",
    primary: "#000000",
    secondary: "#D4AF37",
    accent: "#FFFFFF",
  },
  west: {
    abbreviation: "WHS",
    mascot: "Trojans",
    primary: "#C8102E",
    secondary: "#000000",
    accent: "#FFFFFF",
  },
  taylor: {
    abbreviation: "THS",
    mascot: "Ducks",
    primary: "#228B22",
    secondary: "#FFFFFF",
    accent: "#FFFFFF",
  },
  "waco university": {
    abbreviation: "UHS",
    mascot: "Trojans",
    primary: "#451899",
    secondary: "#FFFFFF",
    accent: "#FFFFFF",
  },
  "midland christian": {
    abbreviation: "MCHS",
    mascot: "Mustangs",
    primary: "#C8102E",
    secondary: "#003DA5",
    accent: "#FFFFFF",
  },
  "pflugerville connally": {
    abbreviation: "CHS",
    mascot: "Cougars",
    primary: "#005710",
    secondary: "#000000",
    accent: "#FFFFFF",
  },
  "little river academy": {
    abbreviation: "AHS",
    mascot: "Bumblebees",
    primary: "#005710",
    secondary: "#FDBA31",
    accent: "#FFFFFF",
  },
  bremond: {
    abbreviation: "BHS",
    mascot: "Tigers",
    primary: "#C8102E",
    secondary: "#FFFFFF",
    accent: "#FFFFFF",
  },
};

export function getScoreboardTeamIdentity(teamName: string) {
  const normalized = teamName.trim().toLowerCase() === "san angelo tlca"
    ? "san angelo texas leadership"
    : teamName.trim().toLowerCase();
  return scoreboardTeamIdentities[normalized];
}
