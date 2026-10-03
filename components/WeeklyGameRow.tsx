import Link from "next/link";
import type { WeeklyGame } from "@/lib/unified-games";
import { getGamePresentation } from "@/lib/game-presentation";
import { liveGameContext } from "@/lib/live-period";
import { scoreAttributionText } from "@/lib/public-score-state";
import { distanceLabel } from "@/lib/geo-distance";
export default function WeeklyGameRow({
  game: g,
  now,
  returnUrl,
  pending,
  followed,
  distance,
  moved,
  onNearbySelection,
}: {
  game: WeeklyGame;
  now: Date;
  returnUrl: string;
  pending: boolean;
  followed: boolean;
  distance?: number;
  moved?: boolean;
  onNearbySelection?: () => void;
}) {
  const p = getGamePresentation(g, now),
    byline = scoreAttributionText(g);
  const hasScore = p.showScore || p.authoritativeLive;
  const date = g.kickoff
    ? new Date(g.kickoff.includes("T") ? g.kickoff : g.kickoff + "T12:00:00Z")
    : null;
  const kickoff =
    date && !Number.isNaN(date.getTime())
      ? new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          timeZone: g.kickoff?.includes("T") ? "America/Chicago" : "UTC",
          ...(g.kickoff?.includes("T")
            ? { hour: "numeric" as const, minute: "2-digit" as const }
            : {}),
        }).format(date)
      : "Date TBD";
  const detail = `/games/${encodeURIComponent(g.id)}?return=${encodeURIComponent(returnUrl)}`;
  const broadcasts = (g.mediaLinks ?? []).filter((l) =>
    ["radio", "stream", "tv"].includes(l.type),
  );
  const report =
    !["scrimmage", "bye"].includes(g.gameType) &&
    ["live", "scheduled"].includes(g.status);
  return (
    <article data-game-id={g.id} className="weekly-row">
      <Link prefetch={false} href={detail} onClick={onNearbySelection} onAuxClick={e => {if (e.button === 1) onNearbySelection?.();}} className="weekly-row-link">
        <p className="weekly-status">
          <span
            className={p.authoritativeLive ? "live-dot" : ""}
            aria-hidden="true"
          />
          {moved
            ? "Final · moved to Completed"
            : p.authoritativeLive
              ? `${p.label}${g.score?.period || g.score?.clock ? ` · ${liveGameContext(g.score?.period, g.score?.clock)}` : ""}`
              : p.label}
          {g.gameType === "scrimmage" ? " · Scrimmage" : ""}
          {g.districtGame ? " · District" : ""}
        </p>
        <div className="weekly-teams">
          <span>{g.awayTeam ?? "Away Team"}</span>
          <strong>
            {hasScore ? (g.awayScore ?? g.score?.away ?? "—") : ""}
          </strong>
          <span>{g.homeTeam ?? "Home Team"}</span>
          <strong>
            {hasScore ? (g.homeScore ?? g.score?.home ?? "—") : ""}
          </strong>
        </div>
        {g.resultType === "forfeit" && (
          <p className="weekly-meta">
            Forfeit{g.winnerName ? ` · Winner: ${g.winnerName}` : ""}
          </p>
        )}
        {g.resultType === "no_contest" && (
          <p className="weekly-meta">No contest</p>
        )}
        <p className="weekly-meta">
          {kickoff}
          {!g.kickoff?.includes("T") ? " · Time TBD" : ""}
          {followed && distance !== undefined ? " · Following" : ""}
          {distance !== undefined ? ` · ${distanceLabel(distance)}` : ""}
        </p>
        <p className="weekly-meta">
          {g.locationInfo.locationQuality === "verified"
            ? `${g.locationInfo.venueName} · ${g.locationInfo.city}`
            : (g.venue ?? "Venue TBD")}
        </p>
        {byline && <p className="weekly-byline">{byline}</p>}
      </Link>
      <details className="weekly-actions">
        <summary aria-label={`Actions for ${g.awayTeam} at ${g.homeTeam}`}>
          •••
        </summary>
        <div className="weekly-action-menu">
          <Link prefetch={false} href={detail} onClick={onNearbySelection} onAuxClick={e => {if (e.button === 1) onNearbySelection?.();}}>
            Game Center →
          </Link>
          {g.previewHref && (
            <Link prefetch={false} href={detail} onClick={onNearbySelection} onAuxClick={e => {if (e.button === 1) onNearbySelection?.();}}>
              Featured preview →
            </Link>
          )}
          {g.recordLabel && <p>{g.recordLabel}</p>}
          {g.statsLabel && <p>{g.statsLabel}</p>}
          {broadcasts.map((l) => (
            <a
              key={`${l.type}-${l.url}`}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {l.type === "radio" ? "Listen Live" : "Watch Live"} →
            </a>
          ))}
          {(g.venueAddress ||
            g.locationInfo.locationQuality === "verified") && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(g.venueAddress ?? (g.locationInfo.locationQuality === "verified" ? `${g.locationInfo.venueName}, ${g.locationInfo.city}, TX` : ""))}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Venue map →
            </a>
          )}
          {report && (
            <Link
              prefetch={false}
              href={`/report-score?game=${encodeURIComponent(g.id)}`}
            >
              {pending
                ? "Pending Review"
                : g.status === "live"
                  ? "Report Live Score"
                  : "Report Final Score"}{" "}
              →
            </Link>
          )}
        </div>
      </details>
    </article>
  );
}
