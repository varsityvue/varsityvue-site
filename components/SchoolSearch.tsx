"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { School } from "@/types/platform";
import SchoolBadge from "./SchoolBadge";

export default function SchoolSearch({ schools }: { schools: School[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const availableSchools = useMemo(
    () => schools.filter((school) => school.status === "pilot"),
    [schools]
  );

  const filteredSchools = useMemo(() => {
    const search = query.trim().toLowerCase();

    if (!search) return availableSchools.slice(0, 9);

    return availableSchools
      .filter((school) => {
        const haystack = [
          school.name,
          school.fullName,
          school.mascot,
          school.abbreviation,
          school.badgeLabel,
          school.badgeSubtext,
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
  }, [query, availableSchools]);

  const featuredSchools = useMemo(
    () => availableSchools.slice(0, 4),
    [availableSchools]
  );

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
          <p className="text-xs font-black uppercase tracking-[0.3em] text-white/55">
            Find Your Team
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight text-white">
            School Lookup
          </h2>
        </div>

        <div className="hidden rounded-full border border-white/10 bg-black/35 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/45 sm:block">
          Live Hubs
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="home-school-search" className="sr-only">
          Search live VarsityVue school hubs
        </label>
        <input
          id="home-school-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Find your school, mascot, district, or stadium..."
          autoComplete="off"
          className="w-full rounded-xl border border-white/10 bg-black/55 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/35 focus:border-white/35 focus:bg-black/75"
        />

        <div className="mt-3 flex items-center justify-between gap-4 text-xs font-bold text-white/40">
          <span aria-live="polite">
            {hasQuery
              ? `${filteredSchools.length} result${filteredSchools.length === 1 ? "" : "s"} found`
              : `Explore ${availableSchools.length} live Texas high school hubs`}
          </span>

          {filteredSchools.length > 0 && (
            <span className="hidden sm:inline">Press Enter for first result</span>
          )}
        </div>
      </div>

      <div className="mt-5 max-h-[420px] overflow-y-auto pr-1">
        <div className="grid grid-cols-3 gap-3">
          {filteredSchools.length > 0 ? (
            filteredSchools.map((school) => (
              <Link
                key={school.id}
                href={`/schools/${school.slug}`}
                className="group rounded-2xl border border-white/10 bg-black/35 p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-white/25 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <div className="flex justify-center">
                  <SchoolBadge school={school} size="xs" />
                </div>

                <p className="mt-3 text-[11px] font-black uppercase leading-tight text-white">
                  {school.name}
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-[0.12em] text-white/40">
                  {school.badgeSubtext ?? school.mascot}
                </p>
              </Link>
            ))
          ) : (
            <div className="col-span-3 rounded-2xl border border-white/10 bg-black/35 p-6 text-center">
              <p className="text-sm font-black text-white">No live hubs found.</p>
              <p className="mt-2 text-sm text-white/45">
                Try another school name, mascot, district, or stadium.
              </p>
              <Link
                href="/school-request"
                className="mt-4 inline-flex text-xs font-black uppercase tracking-[0.14em] text-white/70 transition hover:text-white"
              >
                Request a School →
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 p-4">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-white/45">
          Featured Programs
        </p>

        <div className="mt-4 grid gap-3">
          {featuredSchools.map((school) => (
            <Link
              key={school.id}
              href={`/schools/${school.slug}`}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <div>
                <p className="text-sm font-black text-white">{school.name}</p>
                <p className="text-xs text-white/45">{school.mascot}</p>
              </div>

              <span className="text-xs font-black uppercase tracking-[0.16em] text-white/35">
                View →
              </span>
            </Link>
          ))}
        </div>
      </div>

      <Link
        href="/schools"
        className="mt-5 block rounded-xl border border-white/10 bg-black/35 px-5 py-4 text-center text-sm font-black uppercase tracking-[0.18em] text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        View All Live Hubs →
      </Link>
    </aside>
  );
}
