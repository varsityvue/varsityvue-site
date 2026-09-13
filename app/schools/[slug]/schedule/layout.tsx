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
      robots: { index: false, follow: false },
    };
  }

  const url = `/schools/${school.slug}/schedule`;
  const title = `${school.fullName} 2026 Football Schedule | VarsityVue`;
  const description = `${school.fullName} 2026 football schedule with verified scores, opponents, kickoff times, venues, and matchup coverage on VarsityVue.`;

  return {
    alternates: { canonical: url },
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
    robots:
      school.status === "pilot"
        ? { index: true, follow: true }
        : { index: false, follow: true },
  };
}

export default function SchoolScheduleLayout({ children }: { children: ReactNode }) {
  return children;
}
