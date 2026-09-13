import type { Metadata } from "next";
import type { ReactNode } from "react";

import { getSchoolBySlug } from "@/lib/schools";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);

  if (!school) {
    return {
      title: {
        default: "Page Not Found",
        template: "%s",
      },
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${school.fullName} Football Hub | VarsityVue`;
  const description = `${school.fullName} football scores, schedule, roster, standings, stats, and local coverage on VarsityVue.`;
  const url = `/schools/${school.slug}`;

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
          alt: `${school.fullName} football on VarsityVue`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
    robots:
      school.status === "pilot"
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

export default function SchoolLayout({ children }: { children: ReactNode }) {
  return children;
}
