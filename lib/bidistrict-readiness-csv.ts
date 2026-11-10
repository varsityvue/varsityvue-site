import type { BiDistrictReadiness } from "@/lib/bidistrict-readiness";

const columns = ["Division", "Region", "Game slot", "Team 1", "Team 2", "Status", "Game ID", "Missing information"] as const;

function csvCell(value: string | number): string {
  let text = String(value);
  // Avoid formula injection when a CSV is opened in spreadsheet software.
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

/** Export the read-only audit for schedule research; never invents details. */
export function serializeBiDistrictReadinessCsv(entries: readonly BiDistrictReadiness[]): string {
  const rows = [
    columns,
    ...entries.map((entry) => [
      entry.division, entry.region, entry.slot, entry.teams[0], entry.teams[1],
      entry.status, entry.gameId ?? "", entry.missing.join("; "),
    ]),
  ];
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
