import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/stats",
  },
};

export default function StatsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
