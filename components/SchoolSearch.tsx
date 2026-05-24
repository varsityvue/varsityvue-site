"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SearchSchool = {
  id: string;
  slug: string;
  name: string;
  mascot: string;
  fullName?: string;
  districtId?: string;
  coverageMarket?: string;
  stadium?: string;
  colors: {
    primary: string;
  };
};

export default function SchoolSearch({
  schools,
}: {
  schools: SearchSchool[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filteredSchools = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) {
      return schools.slice(0, 9);
    }

    return schools
      .filter((school) => {
        const haystack = [
          school.name,
          school.fullName,
          school.mascot,
          school.districtId,
          school.coverageMarket,
          school.stadium,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      })
      .slice(0, 12);
  }, [query, schools]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;

    const firstResult = filteredSchools[0];

    if (firstResult) {
      router.push(`/schools/${firstResult.slug}`);
    }
  }

  const hasQuery = query.trim().length > 0;

  return (
    <aside className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
            Find Your School
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
            School Lookup
          </h2>
        </div>

        <div className="hidden rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/40 sm:block">
          Pilot
        </div>
      </div>

      <div className="mt-6">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find your school, mascot, district, or stadium..."
          className="w-full rounded-xl border border-white/10 bg-black/55 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/35 focus:border-[#d65a6d]/50 focus:bg-black/75"
        />

        <div className="mt-3 flex items-center justify-between gap-4 text-xs font-bold text-white/40">
          <span>
            {hasQuery
              ? `${filteredSchools.length} result${
                  filteredSchools.length === 1 ? "" : "s"
                } found`
              : `Showing ${filteredSchools.length} of ${schools.length} schools`}
          </span>

          {filteredSchools.length > 0 && (
            <span className="hidden sm:inline">Press Enter for first result</span>
          )}
        </div>
      </div>

      <div className="mt-5 max-h-[520px] overflow-y-auto pr-1">
        <div className="grid grid-cols-3 gap-3">
          {filteredSchools.length > 0 ? (
            filteredSchools.map((school) => (
              <Link
                key={school.id}
                href={`/schools/${school.slug}`}
                className="group rounded-2xl border border-white/10 bg-black/35 p-4 text-center transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:border-[#d65a6d]/40 hover:bg-white/10"
              >
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 text-xl font-black text-white"
                  style={{
                    backgroundColor: `${school.colors.primary}88`,
                  }}
                >
                  {school.name.slice(0, 2).toUpperCase()}
                </div>

                <p className="mt-3 text-[11px] font-black uppercase leading-tight text-white">
                  {school.name}
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-white/40">
                  {school.mascot}
                </p>
              </Link>
            ))
          ) : (
            <div className="col-span-3 rounded-2xl border border-white/10 bg-black/35 p-6 text-center">
              <p className="text-sm font-black text-white">No schools found.</p>
              <p className="mt-2 text-sm text-white/45">
                Try a school name, mascot, district, or stadium.
              </p>
            </div>
          )}
        </div>
      </div>

      <Link
        href="/schools"
        className="mt-5 block rounded-xl border border-white/10 bg-black/35 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-[#d65a6d] transition hover:bg-white/10 hover:text-white"
      >
        View All Schools →
      </Link>
    </aside>
  );
}