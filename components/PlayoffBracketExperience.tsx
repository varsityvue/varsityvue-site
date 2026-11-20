"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { Game } from "@/types/platform";
import { findSchoolBracketLocation } from "@/lib/playoff-school-location";
import ConnectedPlayoffBracket from "@/components/ConnectedPlayoffBracket";
import TeamPlayoffPath from "@/components/TeamPlayoffPath";
import StatewideBracketExplorer from "@/components/StatewideBracketExplorer";

const selectionEvent = "varsityvue:bracket-selection";
function subscribeSelection(notify: () => void) {
  window.addEventListener("popstate", notify);
  window.addEventListener("hashchange", notify);
  window.addEventListener(selectionEvent, notify);
  return () => { window.removeEventListener("popstate", notify); window.removeEventListener("hashchange", notify); window.removeEventListener(selectionEvent, notify); };
}
function readSchool() {
  const selection = new URL(window.location.href).searchParams.get("school") ?? "De Leon";
  return findSchoolBracketLocation(selection) ? selection : "De Leon";
}
const views = [
  { id: "team-path", label: "My Team" },
  { id: "brackets", label: "Brackets" },
  { id: "games-scores", label: "Games & Scores" },
] as const;

function readView() {
  switch (window.location.hash) {
    case "#brackets":
    case "#statewide-brackets":
      return "brackets";
    case "#games-scores":
    case "#schedule":
    case "#updates":
    case "#results":
      return "games-scores";
    default:
      return "team-path";
  }
}

export default function PlayoffBracketExperience({ games, gamesAndScores }: { games: Game[]; gamesAndScores?: ReactNode }) {
  const view = useSyncExternalStore(subscribeSelection, readView, () => "team-path");
  const selectedSchool = useSyncExternalStore(subscribeSelection, readSchool, () => "De Leon");
  const selectSchool = (school: string) => {
    if (!findSchoolBracketLocation(school) || school === selectedSchool) return;
    const url = new URL(window.location.href);
    url.searchParams.set("school", school);
    window.history.pushState(null, "", url);
    window.dispatchEvent(new Event(selectionEvent));
  };
  return <>
    <nav aria-label="Playoff Central" className="mt-4 grid grid-cols-3 gap-1 rounded-xl border border-white/20 bg-[#111114] p-1 sm:max-w-lg">
      {views.map(({ id, label }) => <a
        key={id}
        href={`#${id}`}
        aria-current={view === id ? "location" : undefined}
        onClick={(event) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          if (window.location.hash === `#${id}`) return;
          window.history.pushState(null, "", `#${id}`);
          window.dispatchEvent(new Event(selectionEvent));
        }}
        className={`flex min-h-11 items-center justify-center rounded-lg px-1 text-center text-xs font-bold focus-visible:outline-2 focus-visible:outline-white sm:text-sm ${view === id ? "bg-[var(--vv-primary)] text-white" : "text-white/80 hover:bg-white/10"}`}
      >{label}</a>)}
    </nav>
    {view === "team-path" && <TeamPlayoffPath games={games} selectedSchool={selectedSchool} onSelectSchool={selectSchool} />}
    {view === "brackets" && <div id="brackets">
      <ConnectedPlayoffBracket key={selectedSchool} games={games} selectedSchool={selectedSchool} onSelectSchool={selectSchool} />
      <details className="mt-4 rounded-xl border border-white/20 p-3">
        <summary className="cursor-pointer font-bold">Round-by-round bracket list</summary>
        <StatewideBracketExplorer games={games} selectedSchool={selectedSchool} />
      </details>
    </div>}
    {view === "games-scores" && <section id="games-scores" aria-label="Games and scores">{gamesAndScores}</section>}
  </>;
}
