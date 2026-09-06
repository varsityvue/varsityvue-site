import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getDistrictBySlug } from "@/lib/districts";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const district = getDistrictBySlug(slug);

  if (!district) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    alternates: {
      canonical: `/districts/${district.slug}`,
    },
    openGraph: {
      url: `/districts/${district.slug}`,
    },
  };
}

export default function DistrictLayout({ children }: { children: ReactNode }) {
  return children;
}
