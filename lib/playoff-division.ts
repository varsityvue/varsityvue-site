/** Normalize UIL conference/division labels used by published game records and bracket IDs. */
export function normalizePlayoffDivision(value: string | undefined): string | null {
  if (!value) return null;
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = /^(2A|3A|4A|5A|6A)(?:DIVISION|DIV|D)?(II|I|2|1)$/.exec(compact);
  if (!match) return null;
  const number = match[2] === "II" || match[2] === "2" ? "2" : "1";
  return `${match[1]}D${number}`;
}
