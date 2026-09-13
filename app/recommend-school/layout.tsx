import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  alternates: {
    canonical: "/school-request",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function RecommendSchoolLayout({ children }: { children: ReactNode }) {
  return children;
}
