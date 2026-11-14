"use client";

import { useSyncExternalStore } from "react";
import type { Game } from "@/types/platform";
import { findSchoolBracketLocation } from "@/lib/playoff-school-location";
import ConnectedPlayoffBracket from "@/components/ConnectedPlayoffBracket";
import TeamPlayoffPath from "@/components/TeamPlayoffPath";
import StatewideBracketExplorer from "@/components/StatewideBracketExplorer";

const selectionEvent = "varsityvue:bracket-selection";
function subscribeSelection(notify: () => void) {
  window.addEventListener("popstate", notify);
  window.addEventListener(selectionEvent, notify);
  return () => { window.removeEventListener("popstate", notify); window.removeEventListener(selectionEvent, notify); };
}
function readSchool() {
  const selection = new URL(window.location.href).searchParams.get("school") ?? "De Leon";
  return findSchoolBracketLocation(selection) ? selection : "De Leon";
}
export default function PlayoffBracketExperience({ games }: { games: Game[] }) {
  const selectedSchool = useSyncExternalStore(subscribeSelection, readSchool, () => "De Leon");
  const selectSchool = (school: string) => {
    if (!findSchoolBracketLocation(school) || school === selectedSchool) return;
    const url = new URL(window.location.href);
    url.searchParams.set("school", school);
    window.history.pushState(null, "", url);
    window.dispatchEvent(new Event(selectionEvent));
  };
  return <>
    <ConnectedPlayoffBracket key={selectedSchool} games={games} selectedSchool={selectedSchool} onSelectSchool={selectSchool} />
    <TeamPlayoffPath games={games} selectedSchool={selectedSchool} onSelectSchool={selectSchool} />
    <StatewideBracketExplorer games={games} selectedSchool={selectedSchool} />
  </>;
}
