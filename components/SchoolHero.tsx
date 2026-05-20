import Link from "next/link";
import type { School, UILClassification } from "@/types/platform";

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

function formatDistrictName(districtId: string) {
  return districtId
    .replaceAll("-", " ")
    .replace("d1", "Division I")
    .replace("d2", "Division II")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function SchoolHero({ school }: { school: School }) {
  return (
    <section
      className="border-b border-white/10 px-4 py-10 text-white sm:px-6 lg:px-8"
      style={{
        background: `linear-gradient(110deg, ${school.colors.primary}88 0%, ${school.colors.primary}33 38%, #050505 100%)`,
      }}
    >
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-white/55">
            VarsityVue School Hub
          </p>

          <h1 className="mt-3 text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
            {school.fullName}
          </h1>
        </div>

        <div className="flex flex-wrap gap-3 md:max-w-md md:justify-end">
          <Link
            href={`/schools/${school.slug}/schedule`}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/15"
          >
            View Full Schedule →
          </Link>

          <Badge label={formatClassification(school.classification)} />
          <Badge label={formatRegion(school.uilRegion)} />

          <Link
            href={`/districts/${school.districtId}`}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 transition hover:bg-white/15"
          >
            {formatDistrictName(school.districtId)} →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85">
      {label}
    </div>
  );
}