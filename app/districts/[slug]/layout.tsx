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
      title: {
        default: "District Not Found",
        template: "%s",
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const isPublicDistrict = district.status === "pilot";
  const title = `${district.name} Football Hub | VarsityVue`;
  const description = `${district.name} football standings, scores, schedules, school hubs, player stats, and local coverage on VarsityVue.`;
  const url = `/districts/${district.slug}`;

  return {
    title: {
      default: title,
      template: "%s",
    },
    description,
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
          alt: `${district.name} football on VarsityVue`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
    robots: isPublicDistrict
      ? {
          index: true,
          follow: true,
        }
      : {
          index: false,
          follow: true,
          googleBot: {
            index: false,
            follow: true,
          },
        },
  };
}

export default function DistrictLayout({ children }: { children: ReactNode }) {
  return children;
}
