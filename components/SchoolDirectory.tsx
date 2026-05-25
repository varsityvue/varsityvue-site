"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { School, UILClassification } from "@/types/platform";

function formatClassification(classification: UILClassification) {
  if (!classification.division) return classification.conference;

  return `${classification.conference} Division ${
    classification.division === "D1" ? "I" : "II"
  }`;
}

function formatDistrictName(districtId: string) {
  const match = districtId.match(/district-(\d+)/i);

  if (match?.[1]) {
    return `District ${match[1]}`;
  }

  return districtId
    .replaceAll("-", " ")
    .replace("d1", "Division I")
    .replace("d2", "Division II")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatStatus(status: School["status"]) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusCount(schools: School[], status: School["status"]) {
  return schools.filter((school) => school.status === status).length;
}

export default function SchoolDirectory({ schools }: { schools: School[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | School["status"]>(
    "all"
  );

  const statusCounts = {
    pilot: getStatusCount(schools, "pilot"),
    watchlist: getStatusCount(schools, "watchlist"),
    planned: getStatusCount(schools, "planned"),
    active: getStatusCount(schools, "active"),
    archived: getStatusCount(schools, "archived"),
  };

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
        school.status,
        school.coverageMarket,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        searchValue.length === 0 || searchText.includes(searchValue);

      const matchesStatus =
        statusFilter === "all" || school.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [schools, search, statusFilter]);

  return (
    <>
      <section className="mb-8 rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl sm:p-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[var(--vv-accent)]">
              Search Database
            </p>

            <h2 className="mt-2 text-3xl font-black text-white">
              Find a School Hub
            </h2>
          </div>

          <p className="text-sm font-bold text-white/45">
            {filteredSchools.length} of {schools.length} schools shown
          </p>
        </div>

        <div className="mt-5">
          <input
            type="text"
            placeholder="Find your school, mascot, abbreviation, district, classification, or stadium..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/55 px-5 py-4 text-sm font-bold text-white outline-none transition placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:bg-black/75"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <FilterButton
            active={statusFilter === "all"}
            label="All"
            count={schools.length}
            onClick={() => setStatusFilter("all")}
          />

          {statusCounts.pilot > 0 && (
            <FilterButton
              active={statusFilter === "pilot"}
              label="Pilot"
              count={statusCounts.pilot}
              onClick={() => setStatusFilter("pilot")}
            />
          )}

          {statusCounts.watchlist > 0 && (
            <FilterButton
              active={statusFilter === "watchlist"}
              label="Watchlist"
              count={statusCounts.watchlist}
              onClick={() => setStatusFilter("watchlist")}
            />
          )}

          {statusCounts.planned > 0 && (
            <FilterButton
              active={statusFilter === "planned"}
              label="Planned"
              count={statusCounts.planned}
              onClick={() => setStatusFilter("planned")}
            />
          )}

          {statusCounts.active > 0 && (
            <FilterButton
              active={statusFilter === "active"}
              label="Active"
              count={statusCounts.active}
              onClick={() => setStatusFilter("active")}
            />
          )}
        </div>
      </section>

      {filteredSchools.length === 0 ? (
        <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-10 text-center shadow-2xl">
          <h2 className="text-3xl font-black text-white">No schools found.</h2>
          <p className="mt-3 text-white/50">
            Try searching by school name, mascot, abbreviation, district,
            classification, or stadium.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredSchools.map((school) => {
            const classification = formatClassification(school.classification);
            const district = formatDistrictName(school.districtId);

            return (
              <Link
                key={school.slug}
                href={`/schools/${school.slug}`}
                className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.045] p-5 shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-[color:var(--vv-accent)] hover:bg-white/[0.075]"
                style={{
                  boxShadow: `0 18px 50px ${school.colors.primary}12`,
                }}
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-35 transition group-hover:opacity-55"
                  style={{
                    background: `radial-gradient(circle at top right, ${school.colors.primary}, transparent 55%)`,
                  }}
                />

                <div className="relative">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 text-xl font-black shadow-lg"
                      style={{
                        backgroundColor: `${school.colors.primary}88`,
                        color: school.colors.secondary,
                      }}
                    >
                      {school.abbreviation ??
                        school.name.slice(0, 2).toUpperCase()}
                    </div>

                    <span className="rounded-full border border-[color:var(--vv-accent)]/30 bg-[var(--vv-primary)]/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--vv-accent-soft)]">
                      {formatStatus(school.status)}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black leading-tight text-white transition group-hover:text-[var(--vv-accent)]">
                    {school.name}
                  </h2>

                  <p className="mt-2 text-sm font-bold uppercase tracking-[0.14em] text-white/45">
                    {school.mascot}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <MiniPill label={classification} />
                    <MiniPill label={district} />
                  </div>

                  <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
                    <SchoolMeta label="Class" value={classification} />
                    <SchoolMeta label="District" value={district} />
                    <SchoolMeta
                      label="Stadium"
                      value={school.stadium ?? "TBD"}
                    />
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-4">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-[var(--vv-accent)]">
                      View school hub
                    </p>

                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-black text-white/50 transition group-hover:bg-[var(--vv-primary)]/30 group-hover:text-white">
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
      className={`rounded-full border px-4 py-2 text-sm font-black transition ${
        active
          ? "border-[color:var(--vv-accent)] bg-[var(--vv-primary)]/40 text-white shadow-[0_0_24px_rgba(139,16,32,0.22)]"
          : "border-white/10 bg-black/30 text-white/60 hover:bg-white/10 hover:text-white"
      }`}
    >
      {label}
      <span className="ml-2 text-white/40">{count}</span>
    </button>
  );
}

function MiniPill({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/65">
      {label}
    </span>
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