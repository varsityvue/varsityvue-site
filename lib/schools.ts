import { schools } from "@/data/schools";

const SCHOOL_COLOR_OVERRIDES: Record<string, { primary?: string; secondary?: string; accent?: string }> = {
  brownwood: { primary: "#5B0B1E" },
};

function applySchoolOverrides<T extends (typeof schools)[number]>(school: T): T {
  const colorOverride = SCHOOL_COLOR_OVERRIDES[school.slug];
  if (!colorOverride) return school;

  return {
    ...school,
    colors: {
      ...school.colors,
      ...colorOverride,
    },
  };
}

export function getSchools() {
  return schools.map(applySchoolOverrides);
}

export function getSchoolBySlug(slug: string) {
  const school = schools.find((school) => school.slug === slug);
  return school ? applySchoolOverrides(school) : undefined;
}

export function getSchoolById(id: string) {
  const school = schools.find((school) => school.id === id);
  return school ? applySchoolOverrides(school) : undefined;
}

export function getSchoolsByDistrictId(districtId: string) {
  return schools.filter((school) => school.districtId === districtId).map(applySchoolOverrides);
}

export function getFeaturedSchools() {
  return schools.filter((school) => school.status === "pilot").map(applySchoolOverrides);
}

export function getPilotSchools() {
  return getFeaturedSchools();
}

export function getWatchlistSchools() {
  return schools.filter((school) => school.status === "watchlist").map(applySchoolOverrides);
}

export function getSchoolUrl(slug: string) {
  return `/schools/${slug}`;
}
