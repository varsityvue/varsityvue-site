export function isPickemWeekClosed(week: { status: string; closes_at: string }, now = new Date()) {
  return week.status !== "open" || now.getTime() >= new Date(week.closes_at).getTime();
}
