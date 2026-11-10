"use client";

import { useState } from "react";
import type { Game } from "@/types/platform";
import TeamPlayoffPath from "@/components/TeamPlayoffPath";
import StatewideBracketExplorer from "@/components/StatewideBracketExplorer";

export default function PlayoffBracketExperience({ games }: { games: Game[] }) {
  const [selectedSchool, setSelectedSchool] = useState("De Leon");
  return (
    <>
      <TeamPlayoffPath games={games} selectedSchool={selectedSchool} onSelectSchool={setSelectedSchool} />
      <StatewideBracketExplorer games={games} selectedSchool={selectedSchool} />
    </>
  );
}
