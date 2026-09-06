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

  return {
    title: {
      default: `${school.fullName} Football Hub | VarsityVue`,
      template: "%s",
    },
    alternates: {
      canonical: `/schools/${school.slug}`,
    },
    openGraph: {
      url: `/schools/${school.slug}`,
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
