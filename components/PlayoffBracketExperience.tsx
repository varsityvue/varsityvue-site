"use client";

import { useSyncExternalStore, useState } from "react";
import type { Game } from "@/types/platform";
import ConnectedPlayoffBracket from "@/components/ConnectedPlayoffBracket";
import TeamPlayoffPath from "@/components/TeamPlayoffPath";
import StatewideBracketExplorer from "@/components/StatewideBracketExplorer";

export default function PlayoffBracketExperience({ games }: { games: Game[] }) {
  const urlSchool = useSyncExternalStore(
    (notify) => { window.addEventListener("popstate", notify); return () => window.removeEventListener("popstate", notify); },
    () => new URL(window.location.href).searchParams.get("school") ?? "De Leon",
    () => "De Leon",
  );
  const [chosenSchool, setSelectedSchool] = useState<string | null>(null);
  const selectedSchool = chosenSchool ?? urlSchool;
  const selectSchool = (school: string) => {
    setSelectedSchool(school);
    const url = new URL(window.location.href);
    url.searchParams.set("school", school);
    window.history.replaceState(null, "", url);
  };
  return (
    <>
      <ConnectedPlayoffBracket key={selectedSchool} games={games} selectedSchool={selectedSchool} />
      <TeamPlayoffPath games={games} selectedSchool={selectedSchool} onSelectSchool={selectSchool} />
      <StatewideBracketExplorer games={games} selectedSchool={selectedSchool} />
    </>
  );
}
