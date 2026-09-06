import type { School } from "@/types/platform";
import { getFeaturedSchools } from "@/lib/schools";
import SchoolSearchClient from "./SchoolSearchClient";

export default function SchoolSearch({ schools }: { schools: School[] }) {
  const featuredSlugs = new Set(getFeaturedSchools().map((school) => school.slug));
  const featuredSchools = schools.filter((school) => featuredSlugs.has(school.slug));

  return <SchoolSearchClient schools={featuredSchools} />;
}
