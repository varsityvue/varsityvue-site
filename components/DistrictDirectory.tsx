"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DirectoryDistrict = {
  slug: string;
  name: string;
  displayName: string;
  classification: string;
  region: string;
  schoolCount: number;
  pilotCount: number;
};

const CLASSIFICATION_ORDER = [
  "1A",
  "2A Division I",
  "2A Division II",
  "3A Division I",
  "3A Division II",
  "4A Division I",
  "4A Division II",
  "5A Division I",
  "5A Division II",
  "6A Division I",
  "6A Division II",
];

function getClassificationRank(classification: string) {
  const index = CLASSIFICATION_ORDER.indexOf(classification);
  return index === -1 ? 999 : index;
}

function getAnchorId(classification: string) {
  return classification.toLowerCase().replaceAll(" ", "-");
}

export default function DistrictDirectory({
  districts,
}: {
  districts: DirectoryDistrict[];
}) {
  const [search, setSearch] = useState("");

  const filteredDistricts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return districts;

    return districts.filter((district) => {
      const haystack = [
        district.name,
        district.displayName,
        district.classification,
        district.region,
        district.schoolCount.toString(),
        district.pilotCount.toString(),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(value);
    });
  }, [districts, search]);

  const groupedDistricts = useMemo(() => {
    const groups = new Map<string, DirectoryDistrict[]>();

    filteredDistricts.forEach((district) => {
      const existing = groups.get(district.classification) ?? [];
      groups.set(district.classification, [...existing, district]);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => {
      const rankA = getClassificationRank(a);
      const rankB = getClassificationRank(b);

      if (rankA !== rankB) return rankA - rankB;

      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [filteredDistricts]);

  const availableClassifications = useMemo(() => {
    return Array.from(
      new Set(districts.map((district) => district.classification))
    ).sort((a, b) => {
      const rankA = getClassificationRank(a);
      const rankB = getClassificationRank(b);

      if (rankA !== rankB) return rankA - rankB;

      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [districts]);

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-6 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d65a6d]">
                District Database
              </p>
              <h2 className="mt-2 text-3xl font-black text-white">
                Find a District Hub
              </h2>
            </div>

            <p className="text-sm font-bold text-white/45">
              {filteredDistricts.length} of {districts.length} districts shown
            </p>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search district, classification, or region..."
            className="mt-5 w-full rounded-2xl border border-white/10 bg-black/55 px-5 py-4 text-sm font-bold text-white outline-none transition placeholder:text-white/35 focus:border-[#d65a6d]/50 focus:bg-black/75"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {availableClassifications.map((classification) => (
              <a
                key={classification}
                href={`#${getAnchorId(classification)}`}
                className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-white/55 transition hover:bg-white/10 hover:text-white"
              >
                {classification}
              </a>
            ))}
          </div>
        </div>

        {filteredDistricts.length === 0 ? (
          <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-10 text-center shadow-2xl">
            <h2 className="text-3xl font-black text-white">
              No districts found.
            </h2>
            <p className="mt-3 text-white/50">
              Try searching by district, classification, or region.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {groupedDistricts.map(([classification, groupDistricts]) => (
              <section
                key={classification}
                id={getAnchorId(classification)}
                className="scroll-mt-28"
              >
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.28em] text-[#d65a6d]">
                      Classification
                    </p>
                    <h3 className="mt-2 text-3xl font-black text-white">
                      {classification}
                    </h3>
                  </div>

                  <p className="text-sm font-bold text-white/45">
                    {groupDistricts.length} district
                    {groupDistricts.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                  {groupDistricts.map((district) => (
                    <Link
                      key={district.slug}
                      href={`/districts/${district.slug}`}
                      className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-[#d65a6d]/40 hover:bg-white/[0.075]"
                    >
                      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(122,16,34,0.45),transparent_55%)] opacity-45 transition group-hover:opacity-70" />

                      <div className="relative">
                        <div className="mb-6 flex items-start justify-between gap-4">
                          <span className="rounded-full border border-[#d65a6d]/30 bg-[#7A1022]/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#f3a3af]">
                            District Hub
                          </span>

                          {district.pilotCount > 0 && (
                            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white/55">
                              {district.pilotCount} Pilot School
                            </span>
                          )}
                        </div>

                        <h2 className="text-3xl font-black leading-tight text-white transition group-hover:text-[#f07182]">
                          {district.displayName}
                        </h2>

                        <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white/45">
                          {district.classification} • {district.region}
                        </p>

                        <div className="mt-6 space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                          <DistrictMeta
                            label="Schools"
                            value={district.schoolCount.toString()}
                          />
                          <DistrictMeta
                            label="Pilot Schools"
                            value={district.pilotCount.toString()}
                          />
                          <DistrictMeta label="Coverage" value="Active" />
                        </div>

                        <div className="mt-6 flex items-center justify-between gap-4">
                          <p className="text-sm font-black uppercase tracking-[0.14em] text-[#d65a6d]">
                            View district hub
                          </p>

                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-black text-white/50 transition group-hover:bg-[#7A1022]/30 group-hover:text-white">
                            →
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </section>
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