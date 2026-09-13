import type { ReactNode } from "react";
import type { Metadata } from "next";

import { getDistrictBySlug } from "@/lib/districts";

type Props = {
  children: ReactNode;
  params: Promise<{ districtSlug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { districtSlug } = await params;
  const district = getDistrictBySlug(districtSlug);
  const url = `/stats/districts/${districtSlug}`;

  if (!district) {
    return {
      alternates: { canonical: url },
      robots: { index: false, follow: false },
    };
  }

  const title = `${district.name} 2026 Stat Leaders | VarsityVue`;
  const description = `${district.name} 2026 rushing, passing, receiving, and efficiency leaders based on verified game statistics currently available to VarsityVue.`;

  return {
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
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
      title,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default function DistrictStatsLayout({ children }: Props) {
  return children;
}
