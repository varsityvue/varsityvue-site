import Link from "next/link";
import { notFound } from "next/navigation";
import type { UILClassification } from "@/types/platform";
import {
  getDistrictBySlug,
  getSchoolsByDistrictSlug,
} from "../../../lib/pilotData";

type DistrictPageProps = {
  params: Promise<{
    slug: string;
  }>;
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

function formatStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function DistrictPage({ params }: DistrictPageProps) {
  const { slug } = await params;

  const district = getDistrictBySlug(slug);

  if (!district) {
    notFound();
  }

  const districtSchools = getSchoolsByDistrictSlug(slug);

  return (
    <main className="min-h-screen bg-black px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/districts"
          className="text-sm font-bold text-[#d65a6d] transition hover:text-white"
        >
          ← Back to Districts
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl md:p-10">
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#7A1022] to-[#d65a6d]" />

          <p className="mt-8 text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d] sm:text-sm">
            VarsityVue District Hub
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            {district.name}
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/60 sm:text-xl">
            District hub for schools, standings, schedules, scores, sponsors,
            and coverage across the VarsityVue pilot network.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <DistrictStat
              label="Class"
              value={formatClassification(district.classification)}
            />
            <DistrictStat label="Region" value={formatRegion(district.uilRegion)} />
            <DistrictStat
              label="Schools"
              value={districtSchools.length.toString()}
            />
          </div>
        </section>

        <section className="mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#d65a6d] sm:text-sm">
            Member Schools
          </p>

          <h2 className="mt-3 text-3xl font-black">District Schools</h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {districtSchools.map((school) => {
              const accentColor = school.colors.accent || school.colors.secondary;

              return (
                <Link
                  key={school.slug}
                  href={`/schools/${school.slug}`}
                  className="group rounded-3xl border bg-white/5 p-6 shadow-lg transition hover:-translate-y-1 hover:bg-white/[0.08]"
                  style={{
                    borderColor: `${school.colors.secondary}33`,
                    boxShadow: `0 18px 50px ${school.colors.primary}22`,
                  }}
                >
                  <div
                    className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl text-xl font-black ring-1"
                    style={{
                      backgroundColor: `${school.colors.primary}66`,
                      color: accentColor,
                      borderColor: `${accentColor}55`,
                    }}
                  >
                    {school.name.slice(0, 2).toUpperCase()}
                  </div>

                  <h3 className="text-2xl font-black transition">
                    {school.name}
                  </h3>

                  <p className="mt-2 text-white/60">{school.mascot}</p>

                  <div className="mt-6 space-y-3 rounded-2xl bg-black/40 p-4">
                    <DistrictMeta
                      label="Class"
                      value={formatClassification(school.classification)}
                    />
                    <DistrictMeta
                      label="Stadium"
                      value={school.stadium ?? "TBD"}
                    />
                    <DistrictMeta
                      label="Status"
                      value={formatStatus(school.status)}
                    />
                  </div>

                  <div
                    className="mt-6 h-1 w-20 rounded-full"
                    style={{
                      background: `linear-gradient(90deg, ${school.colors.primary}, ${school.colors.secondary})`,
                    }}
                  />

                  <p
                    className="mt-6 text-sm font-bold"
                    style={{ color: accentColor }}
                  >
                    View school hub →
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function DistrictStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">
        {label}
      </p>
      <p className="mt-3 text-2xl font-black">{value}</p>
    </div>
  );
}

function DistrictMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-white/40">{label}</span>
      <span className="text-right font-semibold text-white/80">{value}</span>
    </div>
  );
}