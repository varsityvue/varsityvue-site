/** Display names follow the UIL state bracket headings; round indices remain unchanged. */
export const playoffRoundLabels = [
  "Bi-District",
  "Area",
  "Regionals",
  "Quarterfinals",
  "Semifinals",
  "State Championship",
] as const;

export const regionalPlayoffRoundLabels = playoffRoundLabels.slice(0, 4);
