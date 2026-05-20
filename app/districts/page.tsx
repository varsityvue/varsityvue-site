import type { Metadata } from "next";
import Link from "next/link";
import { getDistricts, getSchoolsByDistrictId } from "../../lib/pilotData";
import type { UILClassification } from "@/types/platform";

export const metadata: Metadata = {
  title: "Texas High School Sports District Coverage | VarsityVue",
  description:
    "Browse VarsityVue district hubs for Texas high school sports coverage, district ecosystems, school directories, schedules, and future standings.",
};

function formatClassification(classification: UILClassification) {
  if (!classification.division) return classification.conference;

  return `${classification.conference} Division ${
    classification.division === "D1" ? "I" : "II"
  }`;
}

function formatRegion(region: 1 | 2 | 3 | 4) {
  const regions = {
    1: "Region I",
    2: "Region II",
    3: "Region III",
    4: "Region IV",
  };

  return regions[region];
}

export default function DistrictsPage() {
  const districts = getDistricts();

  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <p className="text-sm uppercase tracking-[0.3em] text-[#d65a6d]">
            VarsityVue Districts
          </p>

          <h1 className="mt-4 text-5xl font-black md:text-7xl">
            District Coverage
          </h1>

          <p className="mt-6 max-w-2xl text-xl leading-8 text-white/60">
            Browse districts across the VarsityVue pilot coverage network.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {districts.map((district) => {
            const schoolCount = getSchoolsByDistrictId(district.id).length;

            return (
              <Link
                key={district.slug}
                href={`/districts/${district.slug}`}
                className="group rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="rounded-full border border-[#d65a6d]/30 bg-[#7A1022]/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d65a6d]">
                    District
                  </span>
                </div>

                <h2 className="text-2xl font-black group-hover:text-[#f07182]">
                  {district.name}
                </h2>

                <div className="mt-6 space-y-3 rounded-2xl bg-black/40 p-4">
                  <DistrictMeta
                    label="Classification"
                    value={formatClassification(district.classification)}
                  />
                  <DistrictMeta
                    label="Region"
                    value={formatRegion(district.uilRegion)}
                  />
                  <DistrictMeta
                    label="Schools"
                    value={schoolCount.toString()}
                  />
                </div>

                <p className="mt-6 text-sm font-bold text-[#d65a6d]">
                  View district hub →
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}

function DistrictMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-white/40">{label}</span>
      <span className="text-right font-semibold text-white/80">{value}</span>
    </div>
  );
}