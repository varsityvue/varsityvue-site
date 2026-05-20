import { getSchoolBySlug, getSchoolsByDistrictId } from "@/lib/pilotData";

export type Standing = {
  schoolSlug: string;
  team: string;
  districtRecord: string;
  overallRecord: string;
};

export function getStandingsForSchool(slug: string): Standing[] {
  const school = getSchoolBySlug(slug);

  if (!school) {
    return [];
  }

  const districtSchools = getSchoolsByDistrictId(school.districtId);

  return districtSchools.map((districtSchool) => {
    return {
      schoolSlug: districtSchool.slug,
      team: districtSchool.name,
      districtRecord: "0-0",
      overallRecord: "0-0",
    };
  });
}