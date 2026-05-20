import { schools } from "@/data/schools";
import { districts } from "@/data/districts";

export function getSchoolBySlug(slug: string) {
  return schools.find((school) => school.slug === slug);
}

export function getSchoolById(id: string) {
  return schools.find((school) => school.id === id);
}

export function getDistrictBySlug(slug: string) {
  return districts.find((district) => district.slug === slug);
}

export function getDistrictById(id: string) {
  return districts.find((district) => district.id === id);
}

export function getSchoolsByDistrictSlug(districtSlug: string) {
  return schools.filter((school) => school.districtId === districtSlug);
}

export function getSchoolsByDistrictId(districtId: string) {
  return schools.filter((school) => school.districtId === districtId);
}

export function getDistricts() {
  return districts;
}

export function getSchools() {
  return schools;
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

export function getDistrictUrl(slug: string) {
  return `/districts/${slug}`;
}