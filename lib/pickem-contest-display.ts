export function centralContestDeadline(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Deadline unavailable";
  return date.toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", timeZone: "America/Chicago", timeZoneName: "short",
  });
}
