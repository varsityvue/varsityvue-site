import type { WeeklyGame } from "./unified-games";
import { getGamePresentation } from "./game-presentation";
import { liveGameContext } from "./live-period";

export function gameShare(game: WeeklyGame, now: Date) {
  const p = getGamePresentation(game, now);
  const matchup = `${game.awayTeam ?? "Away Team"} at ${game.homeTeam ?? "Home Team"}`;
  const lines = [p.label];
  if (p.authoritativeScore) lines[0] = `${p.label} — ${game.awayTeam} ${game.awayScore ?? game.score?.away}, ${game.homeTeam} ${game.homeScore ?? game.score?.home}`;
  if (p.authoritativeLive && (game.score?.period || game.score?.clock)) lines.push(liveGameContext(game.score?.period, game.score?.clock));
  lines.push(`${matchup}${game.week === undefined ? "" : ` · Week ${game.week}`}`);
  if (game.resultType === "forfeit") lines.push(`Forfeit${game.winnerName ? ` · Winner: ${game.winnerName}` : ""}`);
  if (game.resultType === "no_contest") lines.push("No contest");
  if (p.kind === "scheduled") {
    const date = game.kickoff ? new Date(game.kickoff.includes("T") ? game.kickoff : `${game.kickoff}T12:00:00Z`) : null;
    if (date && Number.isFinite(date.getTime())) lines.push(new Intl.DateTimeFormat("en-US", {
      weekday: "long", month: "short", day: "numeric", timeZone: game.kickoff?.includes("T") ? "America/Chicago" : "UTC",
      ...(game.kickoff?.includes("T") ? {hour: "numeric", minute: "2-digit", timeZoneName: "short"} as const : {}),
    }).format(date) + (game.kickoff?.includes("T") ? "" : " · Time TBD"));
    else lines.push("Date/time TBD");
    const venue = game.locationInfo.locationQuality === "verified" ? `${game.locationInfo.venueName} · ${game.locationInfo.city}` : game.venue;
    if (venue) lines.push(venue);
  }
  lines.push(p.authoritativeLive ? "Follow the live score on VarsityVue" : p.kind === "scheduled" ? "View the matchup on VarsityVue" : "View the game on VarsityVue");
  return {title: `${matchup} | VarsityVue`, text: lines.join("\n"), url: `https://varsityvue.com/games/${encodeURIComponent(game.id)}`};
}
