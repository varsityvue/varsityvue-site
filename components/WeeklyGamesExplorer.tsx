"use client";
import { useEffectEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  parseWeeklyParams,
  weeklyUrl,
  selectWeeklyGames,
  isFollowed,
  weekDateLabel,
  type WeeklyGame,
  type WeeklyParams,
} from "@/lib/unified-games";
import { getGamePresentation } from "@/lib/game-presentation";
import { toDiscoveryGame } from "@/lib/game-location";
import { pilotGate, NEARBY_RADII, PILOT_SEASON } from "@/lib/game-discovery";
import type { GeographicPoint } from "@/lib/geo-distance";
import type { SchoolCenter } from "@/types/game-location";
import WeeklyGameRow from "./WeeklyGameRow";
import WeeklyNearbyControls from "./WeeklyNearbyControls";

type Props = {
  games: WeeklyGame[];
  initialParams: WeeklyParams;
  centers: SchoolCenter[];
  followedSlugs: string[];
  pendingIds: string[];
  signedIn: boolean;
  followFailed: boolean;
  pendingFailed: boolean;
  scoreLoadStatus: string;
  fetchedAt: string;
};
export default function WeeklyGamesExplorer(props: Props) {
  const [games, setGames] = useState(props.games),
    [params, setParams] = useState(props.initialParams),
    [now, setNow] = useState(props.fetchedAt),
    [fetchedAt, setFetchedAt] = useState(
      props.scoreLoadStatus === "failed" ? "" : props.fetchedAt,
    ),
    [loadStatus, setLoadStatus] = useState(props.scoreLoadStatus),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [center, setCenter] = useState<GeographicPoint | null>(null),
    [heldIds, setHeldIds] = useState<string[] | null>(null),
    [showAll, setShowAll] = useState(false),
    [shareMessage, setShareMessage] = useState("");
  const request = useRef<AbortController | null>(null),
    generation = useRef(0),
    selectedTab = useRef<HTMLAnchorElement | null>(null);
  const followed = useMemo(
      () => new Set(props.followedSlugs),
      [props.followedSlugs],
    ),
    pending = useMemo(() => new Set(props.pendingIds), [props.pendingIds]);
  const gate =
    params.week !== "all" && Number(params.season) === PILOT_SEASON
      ? pilotGate(
          games.map((g) => toDiscoveryGame(g, g.locationInfo)),
          Number(params.week),
        )
      : { enabled: false, total: 0, unresolved: 0 };
  const matched = selectWeeklyGames(
    games,
    params,
    followed,
    new Date(now),
    gate.enabled ? center : null,
  );
  const rows = heldIds
    ? heldIds.flatMap((id) => {
        const g = games.find((g) => g.id === id);
        const current = matched.find((r) => r.game.id === id);
        return g ? [current ?? { game: g, distance: undefined }] : [];
      })
    : matched;
  const matchedIds = new Set(matched.map((r) => r.game.id));
  const changed =
    heldIds !== null &&
    (heldIds.length !== matched.length ||
      heldIds.some((id, i) => matched[i]?.game.id !== id));
  const your =
    params.mode === "all"
      ? rows.filter((r) => isFollowed(r.game, followed))
      : [];
  const other =
    params.mode === "all"
      ? rows.filter((r) => !isFollowed(r.game, followed))
      : rows;
  const url = weeklyUrl(params);
  const active = games.some(
    (g) =>
      String(g.season) === params.season &&
      (params.week === "all" || String(g.week) === params.week) &&
      ["verified_live", "kickoff_window"].includes(
        getGamePresentation(g, new Date(now)).kind,
      ),
  );
  const displayNow = new Date(now);
  function update(updates: Partial<WeeklyParams>, replace = false) {
    const next = { ...params, ...updates };
    generation.current++;
    request.current?.abort();
    request.current = null;
    setBusy(false);
    setError("");
    setHeldIds(null);
    if (
      next.week !== params.week ||
      next.season !== params.season ||
      next.mode !== params.mode
    ) {
      setCenter(null);
      setShowAll(false);
    }
    setParams(next);
    window.history[replace ? "replaceState" : "pushState"](
      null,
      "",
      weeklyUrl(next) + window.location.hash,
    );
  }
  async function refresh() {
    if (request.current || document.hidden || !navigator.onLine) return;
    const controller = new AbortController();
    request.current = controller;
    const id = ++generation.current;
    setBusy(true);
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/games/snapshot", {
        cache: "no-store",
        signal: controller.signal,
      });
      if (!response.ok) throw new Error("unavailable");
      const data = (await response.json()) as {
        games: WeeklyGame[];
        fetchedAt: string;
        scoreLoadStatus: string;
      };
      if (id !== generation.current) return;
      if (
        !Array.isArray(data.games) ||
        !Number.isFinite(Date.parse(data.fetchedAt))
      )
        throw new Error("invalid");
      setHeldIds((old) => old ?? rows.map((r) => r.game.id));
      setGames(data.games);
      setNow(data.fetchedAt);
      setFetchedAt(data.fetchedAt);
      setLoadStatus(data.scoreLoadStatus);
      setError("");
    } catch {
      if (id === generation.current)
        setError(
          "Scores could not be refreshed. Keeping the last available scores and attribution. Retry when connected.",
        );
    } finally {
      clearTimeout(timeout);
      if (id === generation.current) {
        request.current = null;
        setBusy(false);
      }
    }
  }
  const refreshFromEvent = useEffectEvent(refresh);
  useEffect(() => {
    const restore = () => {
      generation.current++;
      request.current?.abort();
      request.current = null;
      setBusy(false);
      setHeldIds(null);
      setCenter(null);
      setParams(
        parseWeeklyParams(
          Object.fromEntries(new URLSearchParams(location.search)),
          props.games,
          new Date(props.fetchedAt),
        ),
      );
    };
    const fragment = () => {
      const hash = location.hash;
      const raw = Object.fromEntries(new URLSearchParams(location.search));
      let next = parseWeeklyParams(raw, props.games, new Date(props.fetchedAt));
      if (["#live-now", "#final-scores", "#upcoming"].includes(hash)) {
        const filter =
          hash === "#live-now"
            ? "live"
            : hash === "#final-scores"
              ? "completed"
              : "upcoming";
        if (!raw.week) {
          const candidates = selectWeeklyGames(
            props.games,
            { ...next, week: "all", filter, current: false, verified: false },
            new Set(),
            new Date(props.fetchedAt),
          );
          next = {
            ...next,
            week: String(candidates[0]?.game.week ?? next.week),
          };
        }
        next = { ...next, filter, current: false, verified: false };
      }
      if (hash === "#nearby-games") next = { ...next, mode: "nearby" };
      setParams(next);
      const normalizedHash = [
        "#live-now",
        "#final-scores",
        "#upcoming",
        "#nearby-games",
      ].includes(hash)
        ? "#all-matchups"
        : hash;
      window.history.replaceState(null, "", weeklyUrl(next) + normalizedHash);
    };
    fragment();
    window.addEventListener("popstate", restore);
    window.addEventListener("hashchange", fragment);
    return () => {
      window.removeEventListener("popstate", restore);
      window.removeEventListener("hashchange", fragment);
      // Invalidate the current request at unmount, rather than a captured generation.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      request.current?.abort();
    };
  }, [props.games, props.fetchedAt]);
  useEffect(() => {
    selectedTab.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [params.week, params.season]);
  useEffect(() => {
    const resume = () => {
      if (!document.hidden && navigator.onLine) void refreshFromEvent();
    };
    const pause = () => {
      if (document.hidden || !navigator.onLine) {
        generation.current++;
        request.current?.abort();
        request.current = null;
        setBusy(false);
      }
    };
    const visibility = () => (document.hidden ? pause() : resume());
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("online", resume);
    window.addEventListener("offline", pause);
    const timer = active ? setInterval(resume, 30000) : null;
    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("online", resume);
      window.removeEventListener("offline", pause);
    };
  }, [active]);
  const weeks = [
    ...new Set(
      games
        .filter(
          (g) =>
            String(g.season) === params.season &&
            g.week !== undefined &&
            g.gameType !== "bye",
        )
        .map((g) => String(g.week)),
    ),
  ].sort((a, b) => Number(a) - Number(b));
  const seasons = [...new Set(games.map((g) => String(g.season)))]
    .sort()
    .reverse();
  const classes = [
    ...new Set(
      games
        .filter((g) => String(g.season) === params.season)
        .map((g) => g.classification),
    ),
  ].sort();
  function navigation(
    e: React.MouseEvent<HTMLAnchorElement>,
    updates: Partial<WeeklyParams>,
  ) {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey)
      return;
    e.preventDefault();
    update(updates);
  }
  function row(r: (typeof rows)[number]) {
    return (
      <WeeklyGameRow
        key={r.game.id}
        game={r.game}
        now={displayNow}
        returnUrl={url}
        pending={pending.has(r.game.id)}
        followed={isFollowed(r.game, followed)}
        distance={r.distance}
        moved={
          !matchedIds.has(r.game.id) &&
          getGamePresentation(r.game, displayNow).kind === "verified_final"
        }
      />
    );
  }
  return (
    <section
      id="all-matchups"
      className="weekly-browser"
      aria-label="Weekly games and scores"
    >
      <div className="weekly-heading">
        <div>
          <h1>Games &amp; Scores</h1>
          <p>Texas high school football · {params.season}</p>
        </div>
        <label className="sr-only" htmlFor="weekly-season">
          Season
        </label>
        <select
          id="weekly-season"
          className="weekly-control"
          value={params.season}
          onChange={(e) => {
            const next = parseWeeklyParams(
              {
                ...Object.fromEntries(new URLSearchParams(url.split("?")[1])),
                season: e.target.value,
                week: undefined,
              },
              games,
              displayNow,
            );
            update({ season: next.season, week: next.week });
          }}
        >
          {seasons.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <nav className="weekly-tabs" aria-label="Schedule weeks">
        {[...weeks, "all"].map((w) => (
          <a
            key={w}
            ref={w === params.week ? selectedTab : undefined}
            href={weeklyUrl(params, { week: w })}
            onClick={(e) => navigation(e, { week: w })}
            aria-current={w === params.week ? "page" : undefined}
          >
            {" "}
            {w === "all" ? "All weeks" : `Week ${w}`}
          </a>
        ))}
      </nav>
      <p className="weekly-date">
        {params.week === "all" ? "All weeks" : `Week ${params.week}`} ·{" "}
        {weekDateLabel(games, params.season, params.week)}
      </p>
      <nav className="weekly-mode" aria-label="Discovery mode">
        {(["all", "nearby"] as const).map((mode) => (
          <a
            key={mode}
            href={weeklyUrl(params, { mode })}
            onClick={(e) => navigation(e, { mode })}
            aria-current={mode === params.mode ? "page" : undefined}
          >
            {mode === "all" ? "All Games" : "Near Me"}
          </a>
        ))}
      </nav>
      <form
        className="weekly-search"
        action="/games"
        method="get"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.currentTarget);
          update({
            q: String(data.get("q") ?? "")
              .trim()
              .slice(0, 200),
          });
        }}
      >
        {[...new URLSearchParams(url.split("?")[1])]
          .filter(([k]) => k !== "q")
          .map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
        <label className="sr-only" htmlFor="weekly-search">
          Search schools, aliases, venue, city or week
        </label>
        <input
          id="weekly-search"
          key={params.q}
          name="q"
          type="search"
          defaultValue={params.q}
          maxLength={200}
          placeholder="Search schools, venues…"
        />
        <button className="weekly-control" type="submit">
          Search
        </button>
      </form>
      <nav className="weekly-status-filters" aria-label="Game status">
        {(["all", "live", "upcoming", "completed"] as const).map((filter) => (
          <a
            key={filter}
            href={weeklyUrl(params, {
              filter,
              current: false,
              verified: false,
            })}
            onClick={(e) =>
              navigation(e, { filter, current: false, verified: false })
            }
            aria-current={
              params.filter === filter && !params.current ? "page" : undefined
            }
          >
            {filter === "live"
              ? "LIVE"
              : filter[0].toUpperCase() + filter.slice(1)}
          </a>
        ))}
      </nav>
      <details className="weekly-filters">
        <summary>
          Filters
          {params.district || params.classification || params.following
            ? " · active"
            : ""}
        </summary>
        <form
          action="/games"
          method="get"
          onSubmit={(e) => {
            e.preventDefault();
            const d = new FormData(e.currentTarget);
            update({
              classification: String(d.get("classification") ?? ""),
              district: d.has("district"),
              following: d.has("following"),
              radius: Number(d.get("radius") ?? 50),
            });
          }}
        >
          {[...new URLSearchParams(url.split("?")[1])]
            .filter(
              ([k]) =>
                !["classification", "district", "following", "radius"].includes(
                  k,
                ),
            )
            .map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
          <label className="weekly-label">
            Classification
            <select
              name="classification"
              className="weekly-control"
              key={params.classification}
              defaultValue={params.classification}
            >
              <option value="">All classifications</option>
              {classes.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="weekly-check">
            <input
              type="checkbox"
              name="district"
              key={`d${params.district}`}
              defaultChecked={params.district}
            />
            District games only
          </label>
          <label className="weekly-check">
            <input
              type="checkbox"
              name="following"
              key={`f${params.following}`}
              defaultChecked={params.following}
            />
            Following only
          </label>
          <label className="weekly-label">
            Nearby radius
            <select
              name="radius"
              className="weekly-control"
              key={params.radius}
              defaultValue={params.radius}
            >
              {NEARBY_RADII.map((r) => (
                <option key={r} value={r}>
                  {r} miles
                </option>
              ))}
            </select>
          </label>
          <button className="weekly-control" type="submit">
            Apply filters
          </button>
        </form>
      </details>
      {(params.current || params.verified) && (
        <p className="weekly-notice">
          Legacy link scope:{" "}
          {params.current
            ? "current and unresolved games"
            : "verified finals only"}
          .{" "}
          <a
            href={weeklyUrl(params, { current: false, verified: false })}
            onClick={(e) => navigation(e, { current: false, verified: false })}
          >
            Show all matching statuses
          </a>
        </p>
      )}
      {params.mode === "nearby" &&
        (gate.enabled ? (
          <WeeklyNearbyControls
            key={`${params.season}-${params.week}`}
            centers={props.centers}
            onCenter={(c) => {
              generation.current++;
              request.current?.abort();
              request.current = null;
              setBusy(false);
              setCenter(c);
              setHeldIds(null);
            }}
          />
        ) : (
          <div className="weekly-notice">
            <p>
              Near Me is unavailable for{" "}
              {params.week === "all" ? "All weeks" : `Week ${params.week}`}.
              Nearby coverage is limited to verified pilot slates in Weeks 7, 8
              and 9 of 2026.
              {gate.unresolved
                ? ` ${gate.unresolved} venues are unresolved.`
                : ""}
            </p>
            <button className="weekly-control" disabled>
              Use my location
            </button>
            <a
              className="weekly-control"
              href={weeklyUrl(params, { mode: "all" })}
              onClick={(e) => navigation(e, { mode: "all" })}
            >
              Browse All Games
            </a>
          </div>
        ))}
      <noscript>
        <p className="weekly-notice">
          Nearby discovery and live refresh need JavaScript. All Games, week
          links and search forms remain available.
        </p>
      </noscript>
      <div className="weekly-refresh">
        <p>
          {fetchedAt
            ? `Refreshed ${new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit", timeZone: "America/Chicago" }).format(new Date(fetchedAt))} CT`
            : "Live scores unavailable"}
          {active ? " · every 30s while visible" : ""}
        </p>
        <button
          type="button"
          className="weekly-control"
          disabled={busy}
          onClick={() => void refresh()}
        >
          {busy ? "Refreshing…" : error ? "Retry" : "Refresh"}
        </button>
      </div>
      {(error || loadStatus === "failed") && (
        <p role="status" className="weekly-notice">
          {error ||
            "Live scores could not be loaded. Scheduled information and repository results remain available."}
        </p>
      )}
      {loadStatus === "fallback" && (
        <p className="weekly-meta">
          Verified scores loaded through the fallback source. Contributor
          attribution is unavailable.
        </p>
      )}
      {props.followFailed && (
        <p className="weekly-notice">
          Your Teams could not be loaded. Browse All Games or reload to retry.
        </p>
      )}
      {props.pendingFailed && (
        <p className="weekly-notice">
          Pending report status is unavailable. Open a report to check its
          status.
        </p>
      )}
      {changed && (
        <div className="weekly-notice" role="status">
          The slate changed. Rows stay in place while you read.{" "}
          <button
            type="button"
            className="weekly-control"
            onClick={() => setHeldIds(null)}
          >
            Apply updates
          </button>
        </div>
      )}
      <div className="weekly-result-summary">
        <p aria-live="polite">
          {matched.length} matching games{changed ? " · updates ready" : ""}
        </p>
        <button
          type="button"
          className="weekly-control"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(location.origin + url);
              setShareMessage(
                "Public filters copied. Your location is excluded.",
              );
            } catch {
              setShareMessage(
                "Copy this page address to share public filters. Your location is excluded.",
              );
            }
          }}
        >
          Share
        </button>
      </div>
      <p role="status" className="weekly-meta">
        {shareMessage}
      </p>
      {params.mode === "all" && your.length > 0 && (
        <section className="weekly-section" aria-labelledby="your-teams">
          <h2 id="your-teams">
            Your Teams <span>{your.length}</span>
          </h2>
          <p className="weekly-meta">
            Followed matchups first · each game appears once
          </p>
          <div className="weekly-game-list">
            {(showAll ? your : your.slice(0, 4)).map(row)}
          </div>
          {your.length > 4 && (
            <button
              className="weekly-control"
              type="button"
              aria-expanded={showAll}
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "Show fewer" : `Show all ${your.length}`}
            </button>
          )}
        </section>
      )}
      {params.mode === "all" && your.length === 0 && !props.followFailed && (
        <p className="weekly-follow-prompt">
          {followed.size
            ? "No followed matchups match this week and filters."
            : props.signedIn
              ? "Follow schools to see Your Teams first."
              : "Sign in and follow schools to see Your Teams first."}{" "}
          <Link prefetch={false} href={props.signedIn ? "/account" : "/login"}>
            {props.signedIn ? "Manage Your Teams" : "Sign in"} →
          </Link>
          {followed.size > 0 && (
            <>
              {" "}
              <a
                href={weeklyUrl(params, {
                  week: "all",
                  filter: "all",
                  q: "",
                  following: false,
                  current: false,
                  verified: false,
                })}
                onClick={(e) =>
                  navigation(e, {
                    week: "all",
                    filter: "all",
                    q: "",
                    following: false,
                    current: false,
                    verified: false,
                  })
                }
              >
                All weeks
              </a>
            </>
          )}
        </p>
      )}
      {other.length > 0 && (
        <section
          className="weekly-section"
          aria-label={params.mode === "nearby" ? "Nearby results" : "All Games"}
        >
          <h2>
            {params.mode === "nearby"
              ? "Nearby results"
              : your.length
                ? "More games"
                : "All Games"}
          </h2>
          <div className="weekly-game-list">{other.map(row)}</div>
        </section>
      )}
      {rows.length === 0 && (
        <div className="weekly-empty">
          <h2>
            {params.mode === "nearby" && !center
              ? "Choose a location to find games"
              : "No games match these filters"}
          </h2>
          <p>
            {params.mode === "nearby"
              ? "Choose a verified school or your location, adjust the radius, or browse All Games."
              : "The selected week stays selected. Clear filters or search All weeks."}
          </p>
          <a
            className="weekly-control"
            href={weeklyUrl(params, {
              week: "all",
              mode: "all",
              q: "",
              filter: "all",
              classification: "",
              district: false,
              following: false,
              current: false,
              verified: false,
            })}
            onClick={(e) =>
              navigation(e, {
                week: "all",
                mode: "all",
                q: "",
                filter: "all",
                classification: "",
                district: false,
                following: false,
                current: false,
                verified: false,
              })
            }
          >
            Browse All weeks
          </a>
        </div>
      )}
    </section>
  );
}
