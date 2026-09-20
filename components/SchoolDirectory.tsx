"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { UILClassification } from "@/types/platform";
import { getProgramLogoPath } from "@/components/SchoolBadge";

export type DirectorySchool = {
  slug: string;
  name: string;
  fullName: string;
  mascot: string;
  abbreviation?: string;
  badgeLabel?: string;
  districtId: string;
  stadium?: string;
  stateTitles?: number;
  lastPlayoffAppearance?: number;
  classification: UILClassification;
  colors: {
    primary: string;
    secondary: string;
  };
};

type ClassificationFilter = "all" | "1A" | "2A" | "3A" | "4A" | "5A" | "6A";

const classificationFilters: ClassificationFilter[] = [
  "all",
  "1A",
  "2A",
  "3A",
  "4A",
  "5A",
  "6A",
];

function formatClassification(classification: UILClassification) {
  if (!classification.division) return classification.conference;

  return `${classification.conference} Division ${classification.division === "D1" ? "I" : "II"}`;
}

function formatDistrictName(districtId: string) {
  const match = districtId.match(/district-(\d+)/i);

  if (match?.[1]) return `District ${match[1]}`;

  return districtId
    .replaceAll("-", " ")
    .replace("d1", "Division I")
    .replace("d2", "Division II")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getClassificationCount(
  schools: DirectorySchool[],
  classification: ClassificationFilter
) {
  if (classification === "all") return schools.length;

  return schools.filter(
    (school) => school.classification.conference === classification
  ).length;
}

export default function SchoolDirectory({ schools }: { schools: DirectorySchool[] }) {
  const [search, setSearch] = useState("");
  const [classificationFilter, setClassificationFilter] =
    useState<ClassificationFilter>("all");

  const filteredSchools = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return schools.filter((school) => {
      const classification = formatClassification(school.classification);
      const district = formatDistrictName(school.districtId);

      const searchText = [
        school.name,
        school.fullName,
        school.mascot,
        school.abbreviation,
        classification,
        district,
        school.districtId,
        school.stadium,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        searchValue.length === 0 || searchText.includes(searchValue);

      const matchesClassification =
        classificationFilter === "all" ||
        school.classification.conference === classificationFilter;

      return matchesSearch && matchesClassification;
    });
  }, [schools, search, classificationFilter]);

  return (
    <>
      <section className="mb-5 rounded-[1.3rem] border border-white/10 bg-white/[0.045] p-4 shadow-2xl sm:mb-8 sm:rounded-[1.75rem] sm:p-6">
        <div>
          <label htmlFor="school-directory-search" className="sr-only">
            Search school hubs by school, mascot, district, classification, or stadium
          </label>
          <input
            id="school-directory-search"
            type="search"
            placeholder="Search school, mascot, district, class, or stadium..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            autoComplete="off"
            className="w-full rounded-xl border border-white/10 bg-black/55 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/35 focus:border-white/30 focus:bg-black/75 focus-visible:ring-2 focus-visible:ring-white/70 sm:rounded-2xl sm:px-5 sm:py-4"
          />
        </div>

        <fieldset className="mt-4 sm:mt-5">
          <legend className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-white/35 sm:mb-3 sm:text-[10px] sm:tracking-[0.22em]">
            Classification
          </legend>

          <div className="flex flex-wrap gap-2 sm:gap-3">
            {classificationFilters.map((classification) => (
              <FilterButton
                key={classification}
                active={classificationFilter === classification}
                label={classification === "all" ? "All" : classification}
                count={getClassificationCount(schools, classification)}
                onClick={() => setClassificationFilter(classification)}
              />
            ))}
          </div>
        </fieldset>

        <p className="mt-3 text-right text-[10px] font-bold text-white/40 sm:mt-4 sm:text-xs" aria-live="polite">
          {filteredSchools.length} of {schools.length} schools shown
        </p>
      </section>

      {filteredSchools.length === 0 ? (
        <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.045] p-6 text-center shadow-2xl sm:rounded-[1.75rem] sm:p-10">
          <h2 className="text-2xl font-black text-white sm:text-3xl">No schools found.</h2>
          <p className="mt-2 text-sm text-white/50 sm:mt-3">
            Try searching by school name, mascot, abbreviation, district,
            classification, or stadium.
          </p>
          <Link
            href="/school-request"
            className="mt-4 inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-white/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:mt-5 sm:px-5 sm:py-3 sm:text-sm sm:tracking-[0.14em]"
          >
            Request a School →
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredSchools.map((school) => {
            const classification = formatClassification(school.classification);
            const district = formatDistrictName(school.districtId);
            const programLogo = getProgramLogoPath(school.slug);

            return (
              <Link
                key={school.slug}
                href={`/schools/${school.slug}`}
                className="group relative overflow-hidden rounded-[1.3rem] border border-white/10 bg-white/[0.045] p-4 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.075] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:rounded-[1.75rem] sm:p-5"
                style={{
                  boxShadow: `0 18px 50px ${school.colors.primary}24`,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-30 transition group-hover:opacity-45"
                  style={{
                    background: `radial-gradient(circle at top right, ${school.colors.primary}, transparent 58%)`,
                  }}
                />

                <div className="relative">
                  <div className="mb-3 flex items-start justify-between gap-3 sm:mb-6 sm:gap-4">
                    {programLogo ? (
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/35 p-1.5 shadow-lg sm:h-16 sm:w-16 sm:rounded-2xl">
                        <img
                          src={programLogo}
                          alt={`${school.fullName} logo`}
                          className="h-full w-full object-contain drop-shadow-lg"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    ) : (
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 text-lg font-black shadow-lg sm:h-16 sm:w-16 sm:rounded-2xl sm:text-xl"
                        style={{
                          backgroundColor: school.colors.primary,
                          color: school.colors.secondary,
                        }}
                      >
                        {school.badgeLabel ??
                          school.abbreviation ??
                          school.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}

                    <span className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-white/70 sm:px-3 sm:py-1.5 sm:text-[10px] sm:tracking-[0.18em]">
                      School Hub
                    </span>
                  </div>

                  <h2 className="text-xl font-black leading-tight text-white transition group-hover:text-white/80 sm:text-2xl">
                    {school.name}
                  </h2>

                  <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white/45 sm:mt-2 sm:text-sm sm:tracking-[0.14em]">
                    {school.mascot}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-6 sm:gap-2">
                    <MiniPill label={classification} />
                    <MiniPill label={district} />
                  </div>

                  <div className="mt-3 space-y-2 rounded-xl border border-white/10 bg-black/40 p-3 sm:mt-5 sm:space-y-3 sm:rounded-2xl sm:p-4">
                    <SchoolMeta label="Stadium" value={school.stadium ?? "TBD"} />

                    {school.stateTitles !== undefined && (
                      <SchoolMeta
                        label="State Titles"
                        value={school.stateTitles.toString()}
                      />
                    )}

                    {school.lastPlayoffAppearance && (
                      <SchoolMeta
                        label="Last Playoff"
                        value={school.lastPlayoffAppearance.toString()}
                      />
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 sm:mt-6 sm:gap-4">
                    <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/70 transition group-hover:text-white sm:text-sm sm:tracking-[0.14em]">
                      View school hub
                    </p>

                    <span
                      className="rounded-full border border-white/10 px-2.5 py-1.5 text-xs font-black transition group-hover:text-white sm:px-3 sm:py-2 sm:text-sm"
                      style={{
                        backgroundColor: `${school.colors.primary}33`,
                        color: school.colors.secondary,
                      }}
                    >
                      →
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function FilterButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:px-4 sm:py-2 sm:text-sm ${active
        ? "border-white/20 bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.12)]"
        : "border-white/10 bg-black/30 text-white/60 hover:bg-white/10 hover:text-white"
        }`}
    >
      {label}
      <span className={`ml-1.5 sm:ml-2 ${active ? "text-black/45" : "text-white/40"}`}>
        {count}
      </span>
    </button>
  );
}

function MiniPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-white/65 sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.12em]">
      {label}
    </span>
  );
}

function SchoolMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-xs sm:gap-4 sm:text-sm">
      <span className="text-white/40">{label}</span>
      <span className="text-right font-semibold text-white/80">{value}</span>
    </div>
  );
}
