"use client";

import { track } from "@vercel/analytics";
import Link from "next/link";
import type { ReactNode } from "react";

export default function TrackedSignupLink({
  surface,
  className,
  children,
}: {
  surface: "home" | "scoreboard" | "header";
  className: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={`/login?mode=signup&source=${surface}`}
      onClick={() => track("Signup Intent", { surface })}
      className={className}
    >
      {children}
    </Link>
  );
}
