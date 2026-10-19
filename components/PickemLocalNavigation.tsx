"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { pickemViewForHash, type PickemView } from "@/lib/pickem-view";

const views = [{ id: "picks", label: "Picks" }, { id: "results", label: "My Results" }, { id: "standings", label: "Standings" }] as const;

export default function PickemLocalNavigation({ picks, results, standings, overview, defaultView = "picks" }: {
  picks: ReactNode; results: ReactNode; standings: ReactNode; overview?: ReactNode; defaultView?: PickemView;
}) {
  const [selected, setSelected] = useState<PickemView>(defaultView);
  const [anchor, setAnchor] = useState("");
  const tabs = useRef<Array<HTMLAnchorElement | null>>([]);
  useEffect(() => {
    const sync = () => {
      const next = pickemViewForHash(window.location.hash, defaultView);
      setSelected(next);
      setAnchor(window.location.hash);
    };
    sync();
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => { window.removeEventListener("popstate", sync); window.removeEventListener("hashchange", sync); };
  }, [defaultView]);
  useEffect(() => {
    const active = document.activeElement;
    if (active?.closest('[role="tabpanel"][hidden]') || (active?.getAttribute("role") === "tab" && active.getAttribute("aria-selected") === "false")) {
      tabs.current[views.findIndex(view => view.id === selected)]?.focus();
    }
  }, [selected]);
  useEffect(() => {
    // Reveal legacy destinations before scrolling; optional server sections may stream later.
    if (!["#my-picks", "#weekly-standings", "#season-leaderboard"].includes(anchor)) return;
    const reveal = () => {
      const target = document.getElementById(anchor.slice(1));
      if (!target || target.closest("[hidden]")) return false;
      target.scrollIntoView({ block: "start" });
      return true;
    };
    if (reveal()) return;
    const observer = new MutationObserver(() => { if (reveal()) observer.disconnect(); });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [anchor, selected]);
  function choose(view: PickemView) {
    setSelected(view);
    setAnchor("");
    if (window.location.hash !== `#${view}`) window.history.pushState(null, "", `#${view}`);
  }
  return <div className="mt-4">
    <nav aria-label="Pick ’Em sections">
      <div role="tablist" aria-label="Pick ’Em views" className="grid grid-cols-3 gap-1 rounded-xl bg-white/[0.07] p-1">
        {views.map((view, index) => <a key={view.id} ref={node => { tabs.current[index] = node; }} id={`pickem-tab-${view.id}`} href={`#${view.id}`} role="tab" aria-selected={selected === view.id} aria-controls={`pickem-panel-${view.id}`} tabIndex={selected === view.id ? 0 : -1}
          className={`flex min-h-11 items-center justify-center rounded-lg px-2 py-2 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${selected === view.id ? "bg-white text-black" : "text-white/80 hover:bg-white/10"}`}
          onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); choose(view.id); } }}
          onKeyDown={event => {
            let next = index;
            if (event.key === "ArrowRight") next = (index + 1) % views.length;
            else if (event.key === "ArrowLeft") next = (index + views.length - 1) % views.length;
            else if (event.key === "Home") next = 0;
            else if (event.key === "End") next = views.length - 1;
            else if (event.key !== " ") return;
            event.preventDefault(); choose(views[next].id); tabs.current[next]?.focus();
          }}>{view.label}</a>)}
      </div>
    </nav>
    {overview}
    {views.map(view => <section key={view.id} id={`pickem-panel-${view.id}`} role="tabpanel" aria-labelledby={`pickem-tab-${view.id}`} tabIndex={0} hidden={selected !== view.id} className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
      {view.id === "picks" ? picks : view.id === "results" ? results : standings}
    </section>)}
  </div>;
}
