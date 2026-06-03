import Link from "next/link";
import { schools } from "../data/schools";
import type { UILClassification } from "@/types/platform";
import SchoolBadge from "./SchoolBadge";

function formatClassification(classification: UILClassification) {
  if (!classification.division) return classification.conference;

  return `${classification.conference} Division ${
    classification.division === "D1" ? "I" : "II"
  }`;
}

export default function FeaturedSchools() {
  return (
    <section className="bg-white/5 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--vv-accent)]">
              School Hubs
            </p>

            <h2 className="mt-4 text-4xl font-black">
              Featured School Hubs
            </h2>
          </div>

          <Link
            href="/schools"
            className="w-fit rounded-full border border-white/20 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
          >
            View All Schools
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {schools.map((school) => (
            <Link
              key={school.slug}
              href={`/schools/${school.slug}`}
              className="group rounded-3xl border border-white/10 bg-black/40 p-6 transition hover:-translate-y-1 hover:bg-white/10"
              style={{
                boxShadow: `0 18px 50px ${school.colors.primary}22`,
              }}
            >
              <div className="mb-5 flex justify-center">
                <SchoolBadge school={school} size="sm" />
              </div>

              <p className="text-sm text-[var(--vv-accent)]">
                {formatClassification(school.classification)}
              </p>

              <h3 className="mt-3 text-2xl font-black text-white transition group-hover:text-white/80">
                {school.name}
              </h3>

              <p className="mt-1 text-white/60">
                {school.badgeSubtext ?? school.mascot}
              </p>

              <p className="mt-5 text-sm font-bold text-[var(--vv-accent)]">
                View school hub →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}