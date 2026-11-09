// Verified against UIL-linked 2026 MaxPreps brackets, November 9, 2026.
// 2A D1: https://www.maxpreps.com/tournament/T9IzeuJN60OqN3mH1cM0qw/rLBY1SGZOka6yqc8JiA-OA/football-26/2026-uil-texas-football-state-championships-2026-football-conference-2a-d1.htm
// 2A D2: https://www.maxpreps.com/tournament/T9IzeuJN60OqN3mH1cM0qw/XZGmaAD6qk-NrhqmU1Ar5A/football-26/2026-uil-texas-football-state-championships-2026-football-conference-2a-d2.htm
// 4A D1: https://www.maxpreps.com/tournament/T9IzeuJN60OqN3mH1cM0qw/JKMjB4e-2kmUYUBjwilOkA/football-26/2026-uil-texas-football-state-championships-2026-football-conference-4a-d1.htm
export const regionTwoD1 = [
  ["Cisco", "Nocona"],
  ["Bosqueville", "Johnson City"],
  ["Muenster", "Hawley"],
  ["San Saba", "Valley Mills"],
  ["Mason", "Itasca"],
  ["Tioga", "Anson"],
  ["Axtell", "Bangs"],
  ["De Leon", "Alvord"],
] as const;


export const regionTwoD2 = [
  ["Wellington", "Munday"], ["Crawford", "Albany"],
  ["Windthorst", "Quanah"], ["Stamford", "Mart"],
  ["Goldthwaite", "Hubbard"], ["Haskell", "Clarendon"],
  ["Santo", "Miles"], ["Wheeler", "Seymour"],
] as const;
export const regionThree4AD1 = [
  ["Little Cypress-Mauriceville", "Austin"], ["Jarrell", "El Campo"],
  ["Stafford", "Bridge City"], ["Sealy", "China Spring"],
  ["Bay City", "Lampasas"], ["Fort Bend Willowridge", "Hargrave"],
  ["Stephenville", "Navasota"], ["Vidor", "Sterling"],
] as const;
export const brackets = [
  { title: "2A Division I · Region II", teams: regionTwoD1, featured: "Cisco · Hawley · Anson · De Leon" },
  { title: "2A Division II · Region II", teams: regionTwoD2, featured: "Goldthwaite · Santo · Albany" },
  { title: "4A Division I · Region III", teams: regionThree4AD1, featured: "Stephenville" },
] as const;
