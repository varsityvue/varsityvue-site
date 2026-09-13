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
  const url = school ? `/schools/${school.slug}/roster` : `/schools/${slug}/roster`;

  if (!school) {
    return {
      alternates: { canonical: url },
      robots: { index: false, follow: false },
    };
  }

  const title = `${school.name} 2026 Football Roster | VarsityVue`;
  const description = `${school.name} ${school.mascot} 2026 football roster with player names, jersey numbers, positions, classifications, and VarsityVue player profile links.`;
  const socialImage = "/opengraph-image";

  return {
    title,
    description,
    alternates: { canonical: url },
    robots:
      school.status === "pilot"
        ? { index: true, follow: true }
        : { index: false, follow: true },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: `${school.name} ${school.mascot} football roster on VarsityVue`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export default function SchoolRosterLayout({ children }: { children: ReactNode }) {
  return children;
}
