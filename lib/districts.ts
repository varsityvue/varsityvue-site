import { districts } from "@/data/districts";

function assertUniqueDistrictIdentity() {
  const ids = new Set<string>();
  const slugs = new Set<string>();
  const duplicateIds: string[] = [];
  const duplicateSlugs: string[] = [];

  for (const district of districts) {
    if (ids.has(district.id)) duplicateIds.push(district.id);
    if (slugs.has(district.slug)) duplicateSlugs.push(district.slug);
    ids.add(district.id);
    slugs.add(district.slug);
  }

  if (duplicateIds.length > 0 || duplicateSlugs.length > 0) {
    const details = [
      duplicateIds.length > 0 ? `duplicate IDs: ${duplicateIds.join(", ")}` : null,
      duplicateSlugs.length > 0 ? `duplicate slugs: ${duplicateSlugs.join(", ")}` : null,
    ]
      .filter(Boolean)
      .join("; ");

    throw new Error(`District identity integrity check failed: ${details}`);
  }
}

assertUniqueDistrictIdentity();

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

export function getPilotDistricts() {
  return districts.filter((district) => district.status === "pilot");
}
