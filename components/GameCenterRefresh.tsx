"use client";

import { useEffect, useEffectEvent, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { shouldPollGameCenter } from "@/lib/game-center-refresh";
import type { WeeklyGame } from "@/lib/unified-games";

type Props = { game: WeeklyGame; scoreLoadStatus: string; children: ReactNode };

export default function GameCenterRefresh({ game, scoreLoadStatus, children }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [offline, setOffline] = useState(false);
  const [error, setError] = useState(false);
  const [checkedAt, setCheckedAt] = useState("");
  const [available, setAvailable] = useState({ children, game });
  const [seenChildren, setSeenChildren] = useState(children);
  const request = useRef<AbortController | null>(null);

  // A second server read can fail after the snapshot check succeeds. Preserve
  // the last successful rendered score and attribution instead of adopting
  // repository-only fallbacks. The page keys this boundary by canonical ID.
  if (seenChildren !== children) {
    setSeenChildren(children);
    if (scoreLoadStatus !== "failed") setAvailable({ children, game });
  }

  async function refresh() {
    if (request.current || pending || document.hidden || !navigator.onLine) return;
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch("/api/games/snapshot", { cache: "no-store", signal: controller.signal });
      if (!response.ok) throw new Error("Scores unavailable");
      const data = await response.json() as { games?: WeeklyGame[]; fetchedAt?: string; scoreLoadStatus?: string };
      const current = data.games?.find((candidate) => candidate.id === game.id);
      if (!current || !data.fetchedAt || !Number.isFinite(Date.parse(data.fetchedAt)) || !["primary", "fallback"].includes(data.scoreLoadStatus ?? "")) throw new Error("Invalid score snapshot");
      if (controller.signal.aborted) return;
      setCheckedAt(data.fetchedAt);
      setError(false);
      if (scoreLoadStatus === "failed" || JSON.stringify(current) !== JSON.stringify(available.game)) {
        startTransition(() => router.refresh());
      }
    } catch {
      if (request.current === controller) setError(true);
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }
  const refreshFromEvent = useEffectEvent(refresh);
  const pollFromEvent = useEffectEvent(() => {
    if (shouldPollGameCenter(available.game)) void refreshFromEvent();
  });
  useEffect(() => {
    const pause = () => {
      setOffline(!navigator.onLine);
      const controller = request.current;
      request.current = null;
      controller?.abort();
      setBusy(false);
    };
    const resume = () => {
      setOffline(!navigator.onLine);
      if (!document.hidden && navigator.onLine) pollFromEvent();
    };
    const visibility = () => document.hidden ? pause() : resume();
    if (!navigator.onLine) pause();
    resume();
    const timer = setInterval(resume, 30000);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("offline", pause);
    window.addEventListener("online", resume);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("offline", pause);
      window.removeEventListener("online", resume);
      const controller = request.current;
      request.current = null;
      controller?.abort();
    };
  }, []);

  return <>
    <div className="bg-[#050505] px-4 py-2 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex items-center justify-between gap-3 text-xs text-white/50">
          <span>{busy || pending ? "Checking scores…" : checkedAt ? `Scores checked ${new Date(checkedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Scores refresh automatically near kickoff and during LIVE games."}</span>
          <button type="button" disabled={busy || pending || offline} onClick={() => void refresh()} className="shrink-0 rounded-full border border-white/15 px-3 py-2 font-bold text-white/75 disabled:opacity-40">{error || scoreLoadStatus === "failed" ? "Retry scores" : "Refresh scores"}</button>
        </div>
        {offline ? <p role="status" className="mt-2 text-xs text-amber-100">Offline · score refresh paused. Showing the last available game information.</p> : error || scoreLoadStatus === "failed" ? <p role="status" className="mt-2 text-xs text-amber-100">Scores could not be refreshed. Keeping the last available scores and attribution. Retry when connected.</p> : null}
        <noscript><p className="mt-2 text-xs text-white/50">Automatic score updates need JavaScript. Reload this page for the latest score.</p></noscript>
      </div>
    </div>
    {available.children}
  </>;
}
