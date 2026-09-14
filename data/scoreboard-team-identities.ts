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
};

export function getScoreboardTeamIdentity(teamName: string) {
  return scoreboardTeamIdentities[teamName.trim().toLowerCase()];
}
