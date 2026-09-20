"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import type { ReactNode } from "react";

export default function TrackedPickemLink({ surface, gameId, className, children }: { surface: "scoreboard" | "game_center"; gameId?: string; className: string; children: ReactNode }) {
  return <Link href="/pickem" onClick={() => track("Pick Intent", { surface, game: gameId })} className={className}>{children}</Link>;
}
