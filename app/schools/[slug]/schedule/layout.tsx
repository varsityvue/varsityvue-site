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

  if (!school) return {};

  const url = `/schools/${school.slug}/schedule`;

  return {
    alternates: { canonical: url },
    openGraph: { url },
    robots:
      school.status === "pilot"
        ? { index: true, follow: true }
        : { index: false, follow: true },
  };
}

export default function SchoolScheduleLayout({ children }: { children: ReactNode }) {
  return children;
}
