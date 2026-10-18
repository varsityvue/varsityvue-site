import type { ExtendedTeamMetric } from "@/data/extended-game-stats";

export type DisplayStat = { label: string; value: string | number };

const labels: Record<string, string> = {
  "#": "Jersey", C: "Completions", A: "Attempts", Att: "Attempts", CAR: "Carries", Car: "Carries",
  REC: "Receptions", Rec: "Receptions", YDS: "Yards", Yds: "Yards", "C%": "Completion rate (source)",
  AVG: "Average (source)", Avg: "Average (source)", "Y-Comp": "Yards / completion", "Y/Comp": "Yards / completion",
  "Y/Att": "Yards / attempt", "Y-Att": "Yards / attempt", LONG: "Longest gain", Long: "Longest gain",
  TD: "Touchdowns", INT: "Interceptions", Rating: "QB rating", "QB Rate": "QB rating", "100+": "100-yard games",
  FG: "Field goals made", FGA: "Field goal attempts", XP: "Extra points made", XPA: "Extra point attempts",
  KR: "Kickoff returns", PR: "Punt returns", "In 20": "Inside 20", TB: "Touchbacks", Tack: "Tackles",
  Ast: "Assists", TFL: "Tackles for loss", Sck: "Sacks", FR: "Fumble recoveries", PD: "Passes defended",
};

export function displayStatLabel(header: string): string {
  return header === "C/A" ? "Completions / attempts" : labels[header] ?? header;
}

/** Only decode known source headers with an exact field count and numeric/missing tokens.
 * Never calculate, round, infer zeroes, or reinterpret a source average as yards/attempt. */
export function presentTeamMetric(metric: ExtendedTeamMetric, side: "away" | "home"): { title: string; fields: DisplayStat[]; fallback: boolean } {
  const match = /^(Pass(?:ing)?|Rush(?:ing)?|Rec(?:eiving)?) (.+)$/.exec(metric.label);
  if (match) {
    const headers = match[2].replaceAll("Y/Att", "Y-Att").replaceAll("Y/Comp", "Y-Comp").split("/").map((header) => header.trim());
    const title = match[1].startsWith("Pass") ? "Passing" : match[1].startsWith("Rush") ? "Rushing" : "Receiving";
    const raw = metric[side];
    const tokens = String(raw).split("/").map((token) => token.trim());
    const supported = headers.every((header) => header in labels);
    const missing = raw === "—";
    if (supported && (missing || (tokens.length === headers.length && tokens.every((token) => /^(?:—|-?\d+(?:\.\d+)?|-?\.\d+)$/.test(token))))) {
      const fields = headers.map((header, index) => ({ label: displayStatLabel(header), value: missing ? "—" : tokens[index] }));
      if (title === "Passing" && !fields.some((field) => field.label === "Yards / attempt")) fields.push({ label: "Yards / attempt", value: "—" });
      return { title, fields, fallback: false };
    }
  }
  return { title: metric.label, fields: [{ label: "Reported value", value: metric[side] }], fallback: true };
}

/** Known highlights are explicitly curated; new source notes never silently become highlights. */
const highlightNotes = new Set([
  "Goldthwaite piled up 502 yards, including 283 rushing yards, in the 59-27 win.",
  "Landry Sanderson accounted for five touchdowns: four rushing and one receiving.",
  "Hayes Greenway threw for 219 yards and three touchdowns and added 72 yards and a rushing score.",
  "Goldthwaite intercepted two Junction passes, with Blaine Hall and Hagen Greenway recording the interceptions.",
  "Goldthwaite's 503 yards included 242 rushing and 261 passing.",
  "Hayes Greenway produced 376 yards of total offense with three passing touchdowns and no interceptions.",
  "Aidyn Lee caught all seven of his targets for 180 yards and three touchdowns.",
  "Landry Sanderson rushed for 120 yards and four touchdowns on 16 carries.",
  "Landry Sanderson rushed for 195 yards and a touchdown on 16 carries.",
  "Hayes Greenway added 64 rushing yards and two touchdowns on eight carries.",
  "Blake Howard made a 29-yard field goal and all three recorded extra-point kicks.",
]);
export function presentExtendedNotes(_gameId: string, notes: string[] = []) {
  const highlights = notes.filter((note) => highlightNotes.has(note));
  const remaining = notes.filter((note) => !highlightNotes.has(note));
  const technical = remaining.filter((note) => /Owner (?:directed|confirmed)|reconciled|Time of possession omitted|Source values retained/.test(note));
  const source = remaining.filter((note) => !technical.includes(note));
  // Keep the actual discrepancy visible without internal editorial instructions.
  const disclosures = technical.map((note) => note.split(/ Owner directed| Source values retained/)[0]).filter((note) => /Coach-supplied totals contain/.test(note));
  return { highlights, source: [...disclosures, ...source], technical };
}

export function presentPlayerValues(title: string, headers: string[], values: (string | number)[]): DisplayStat[] {
  const fields: DisplayStat[] = Array.from({ length: Math.max(values.length, headers.length - 1) }, (_, index) => ({ label: displayStatLabel(headers[index + 1] ?? `Stat ${index + 1}`), value: values[index] ?? "—" }));
  if (title === "Passing detail" && !fields.some((field) => field.label === "Yards / attempt")) fields.push({ label: "Yards / attempt", value: "—" });
  return fields;
}
