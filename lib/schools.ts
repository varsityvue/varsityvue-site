import { districts } from "@/data/districts";
import { schools as baseSchools } from "@/data/schools";
import { santoSchool } from "@/data/santo-school";

const schools = [
  ...baseSchools.filter((school) => school.slug !== santoSchool.slug && school.id !== santoSchool.id),
  santoSchool,
];

const SCHOOL_COLOR_OVERRIDES: Record<string, { primary?: string; secondary?: string; accent?: string }> = {
  brownwood: { primary: "#5B0B1E" },
};

function assertSchoolDataIntegrity() {
  const seenSlugs = new Set<string>();
  const seenIds = new Set<string>();
  const duplicateSlugs: string[] = [];
  const duplicateIds: string[] = [];
  const districtIds = new Set(districts.map((district) => district.id));
  const invalidDistrictReferences: string[] = [];

  for (const school of schools) {
    if (seenSlugs.has(school.slug)) duplicateSlugs.push(school.slug);
    if (seenIds.has(school.id)) duplicateIds.push(school.id);
    if (school.districtId !== "opponent" && !districtIds.has(school.districtId)) {
      invalidDistrictReferences.push(`${school.slug} → ${school.districtId}`);
    }

    seenSlugs.add(school.slug);
    seenIds.add(school.id);
  }

  const problems: string[] = [];
  if (duplicateSlugs.length > 0) {
    problems.push(`duplicate school slugs: ${duplicateSlugs.join(", ")}`);
  }
  if (duplicateIds.length > 0) {
    problems.push(`duplicate school IDs: ${duplicateIds.join(", ")}`);
  }
  if (invalidDistrictReferences.length > 0) {
    problems.push(
      `schools reference unknown districts: ${invalidDistrictReferences.join(", ")}`
    );
  }

  if (problems.length > 0) {
    throw new Error(`School data integrity check failed (${problems.join("; ")})`);
  }
}

assertSchoolDataIntegrity();

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
