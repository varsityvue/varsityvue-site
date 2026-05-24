import type { Metadata } from "next";

import { getDistricts, getSchoolsByDistrictId } from "../../lib/pilotData";
import type { UILClassification } from "@/types/platform";
import DistrictDirectory from "../../components/DistrictDirectory";

export const metadata: Metadata = {
  title: "Texas High School Sports District Directory | VarsityVue",
  description:
    "Browse VarsityVue district hubs for Texas high school sports standings, schedules, school hubs, coverage, and sponsor visibility.",
};

function formatClassification(classification: UILClassification) {
  if (!classification.division) return classification.conference;

  return `${classification.conference} Division ${
    classification.division === "D1" ? "I" : "II"
  }`;
}

function formatRegion(region: 1 | 2 | 3 | 4) {
  return {
    1: "Region I",
    2: "Region II",
    3: "Region III",
    4: "Region IV",
  }[region];
}

function formatDistrictDisplayName(name: string) {
  const match = name.match(/District\s+(\d+)/i);

  if (match?.[1]) {
    return `District ${match[1]}`;
  }

  return name;
}

export default function DistrictsPage() {
  const districts = getDistricts();

  const directoryDistricts = districts.map((district) => {
    const districtSchools = getSchoolsByDistrictId(district.id);
    const pilotCount = districtSchools.filter(
      (school) => school.status === "pilot"
    ).length;

    return {
      slug: district.slug,
      name: district.name,
      displayName: formatDistrictDisplayName(district.name),
      classification: formatClassification(district.classification),
      region: formatRegion(district.uilRegion),
      schoolCount: districtSchools.length,
      pilotCount,
    };
  });

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.62),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-2xl md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-[#d65a6d]">
              VarsityVue Districts
            </p>

            <div className="mt-5">
              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
                District Directory
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-white/60 sm:text-lg">
                Browse district hubs for standings, schedules, school pages,
                matchup coverage, and local football ecosystems.
              </p>
            </div>
          </div>
        </div>
      </section>

      <DistrictDirectory districts={directoryDistricts} />
    </main>
  );
}