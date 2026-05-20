"use client";

import { useState } from "react";
import Link from "next/link";
import type { School, UILClassification } from "@/types/platform";

function formatClassification(classification: UILClassification) {
  if (!classification.division) return classification.conference;

  return `${classification.conference} Division ${
    classification.division === "D1" ? "I" : "II"
  }`;
}

function formatDistrictName(districtId: string) {
  return districtId
    .replaceAll("-", " ")
    .replace("d1", "Division I")
    .replace("d2", "Division II")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function SchoolDirectory({ schools }: { schools: School[] }) {
  const [search, setSearch] = useState("");

  const filteredSchools = schools.filter((school) => {
    const classification = formatClassification(school.classification);
    const district = formatDistrictName(school.districtId);

    const searchText =
      `${school.name} ${school.mascot} ${classification} ${district} ${
        school.stadium ?? ""
      }`.toLowerCase();

    return searchText.includes(search.toLowerCase());
  });

  return (
    <>
      <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-5">
        <input
          type="text"
          placeholder="Search schools..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-2xl border border-white/10 bg-black px-5 py-4 text-white outline-none placeholder:text-white/40 focus:border-[#d65a6d]"
        />
      </div>

      {filteredSchools.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/60">
          No schools found.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSchools.map((school) => {
            const classification = formatClassification(school.classification);
            const district = formatDistrictName(school.districtId);

            return (
              <Link
                key={school.slug}
                href={`/schools/${school.slug}`}
                className="group rounded-3xl border bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
                style={{
                  borderColor: `${school.colors.secondary}22`,
                }}
              >
                <div className="mb-6 flex items-start justify-between">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-3xl text-xl font-black ring-1"
                    style={{
                      backgroundColor: `${school.colors.primary}4d`,
                      color: school.colors.accent,
                      borderColor: `${school.colors.secondary}33`,
                    }}
                  >
                    {school.name.slice(0, 2).toUpperCase()}
                  </div>

                  <span className="rounded-full border border-[#d65a6d]/30 bg-[#7A1022]/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-[#d65a6d]">
                    Hub
                  </span>
                </div>

                <h2 className="text-2xl font-black group-hover:text-[#f07182]">
                  {school.name}
                </h2>

                <p className="mt-2 text-white/60">{school.mascot}</p>

                <div className="mt-6 space-y-3 rounded-2xl bg-black/40 p-4">
                  <SchoolMeta label="Class" value={classification} />
                  <SchoolMeta label="District" value={district} />
                  <SchoolMeta label="Stadium" value={school.stadium ?? "TBD"} />
                </div>

                <p className="mt-6 text-sm font-bold text-[#d65a6d]">
                  View school hub →
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

function SchoolMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-white/40">{label}</span>
      <span className="text-right font-semibold text-white/80">{value}</span>
    </div>
  );
}