const CENTRAL = "America/Chicago";

export function fridaySevenCentralForGame(kickoff: string): string {
  const date = new Date(kickoff);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid kickoff");
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: CENTRAL, year: "numeric", month: "numeric", day: "numeric", weekday: "short" }).formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? "";
  const day = new Date(Date.UTC(Number(part("year")), Number(part("month")) - 1, Number(part("day"))));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(part("weekday"));
  day.setUTCDate(day.getUTCDate() + (5 - weekday));
  const zone = new Intl.DateTimeFormat("en-US", { timeZone: CENTRAL, timeZoneName: "shortOffset" }).formatToParts(new Date(day.getTime() + 12 * 60 * 60 * 1000)).find((item) => item.type === "timeZoneName")?.value ?? "";
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(zone);
  if (!match) throw new Error("Central offset unavailable");
  const offset = (match[1] === "+" ? 1 : -1) * (Number(match[2]) * 60 + Number(match[3] ?? 0));
  return new Date(day.getTime() + (19 * 60 - offset) * 60_000).toISOString();
}
