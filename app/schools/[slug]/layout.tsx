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

  if (!school || school.status === "pilot") {
    return {};
  }

  return {
    robots: {
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
