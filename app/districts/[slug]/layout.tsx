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

  return {
    title: {
      default: `${district.name} Football Hub | VarsityVue`,
      template: "%s",
    },
    alternates: {
      canonical: `/districts/${district.slug}`,
    },
    openGraph: {
      url: `/districts/${district.slug}`,
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
