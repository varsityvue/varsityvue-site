import { schools } from "@/data/schools";

export function getSchools() {
  return schools;
}

export function getSchoolBySlug(slug: string) {
  return schools.find((school) => school.slug === slug);
}

export function getSchoolById(id: string) {
  return schools.find((school) => school.id === id);
}

export function getSchoolsByDistrictId(districtId: string) {
  return schools.filter((school) => school.districtId === districtId);
}

export function getPilotSchools() {
  return schools.filter((school) => school.status === "pilot");
}

export function getWatchlistSchools() {
  return schools.filter((school) => school.status === "watchlist");
}

export function getSchoolUrl(slug: string) {
  return `/schools/${slug}`;
}