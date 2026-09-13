import type { ReactNode } from "react";
import type { Metadata } from "next";

const description =
  "VarsityVue 2026 football rushing, passing, and receiving leaders based on verified game statistics currently available.";

export const metadata: Metadata = {
  alternates: {
    canonical: "/stats",
  },
  openGraph: {
    title: "2026 Football Stat Leaders | VarsityVue",
    description,
    url: "/stats",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "VarsityVue — Texas High School Football",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "2026 Football Stat Leaders | VarsityVue",
    description,
    images: ["/opengraph-image"],
  },
};

export default function StatsLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
