import type { Game } from "@/types/platform";

export type CanonicalScoreState = {
  game_id: string;
  status: string;
  away_score: number | null;
  home_score: number | null;
  period: string | null;
  clock: string | null;
  updated_at: string;
  score_revision: number;
  away_school_slug: string | null;
  home_school_slug: string | null;
  verified: boolean;
};

export type PendingScoreReport = {
  id: string;
  game_id: string;
  away_score: number;
  home_score: number;
  game_status: string;
  created_at: string;
};

export function centralDate(instant: string | Date): string {
  const date = typeof instant === "string" ? new Date(instant) : instant;
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  const part = (name: string) => parts.find((item) => item.type === name)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function weekForOperations(games: Game[], now: Date): number | null {
  const date = centralDate(now);
  const day = new Date(`${date}T12:00:00Z`);
  const monday = new Date(day);
  monday.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 7);
  const start = monday.toISOString().slice(0, 10);
  const end = sunday.toISOString().slice(0, 10);
  const inWeek = games.find((game) => game.week != null && game.kickoff &&
    centralDate(game.kickoff) >= start && centralDate(game.kickoff) < end);
  if (inWeek?.week != null) return inWeek.week;
  const future = games.filter((game) => game.week != null && game.kickoff && centralDate(game.kickoff) >= date)
    .sort((a, b) => (a.kickoff ?? "").localeCompare(b.kickoff ?? ""))[0];
  return future?.week ?? null;
}

export function attentionReasons(
  game: Game,
  state: CanonicalScoreState | undefined,
  reports: PendingScoreReport[],
  intelligenceOpen: boolean,
  now: Date,
): string[] {
  const reasons: string[] = [];
  if (reports.length) {
    reasons.push(`${reports.length} pending report${reports.length === 1 ? "" : "s"}`);
    if (reports.some((report) => reports.some((other) =>
      report.away_score !== other.away_score || report.home_score !== other.home_score || report.game_status !== other.game_status))) {
      reasons.push("Pending reports conflict");
    }
    if (state && reports.some((report) => new Date(report.created_at) < new Date(state.updated_at))) {
      reasons.push("Canonical score changed after a pending report");
    }
  }
  if (state && (!state.away_school_slug || !state.home_school_slug)) reasons.push("Canonical identity missing");
  if (state?.verified && state.status === "live" && now.getTime() - new Date(state.updated_at).getTime() > 90 * 60_000) {
    reasons.push("Live update older than 90 minutes");
  }
  if (["scheduled", "upcoming"].includes(game.status) && game.kickoff && new Date(game.kickoff) < now) {
    reasons.push("Kickoff passed; awaiting update");
  }
  if (intelligenceOpen) reasons.push("Open missing-score candidate");
  return reasons;
}
