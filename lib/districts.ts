import { districts } from "@/data/districts";

export function getDistricts() {
  return districts;
}

export function getDistrictBySlug(slug: string) {
  return districts.find((district) => district.slug === slug);
}

export function getDistrictById(id: string) {
  return districts.find((district) => district.id === id);
}

export function getDistrictUrl(slug: string) {
  return `/districts/${slug}`;
}