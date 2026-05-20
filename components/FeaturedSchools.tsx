import Link from "next/link";
import { schools } from "../data/schools";
import type { UILClassification } from "@/types/platform";

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
            <p className="text-sm uppercase tracking-[0.3em] text-[#d65a6d]">
              School Hubs
            </p>

            <h2 className="mt-4 text-4xl font-black">Featured School Hubs</h2>
          </div>

          <Link
            href="/schools"
            className="w-fit rounded-full border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10"
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
              <div
                className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl font-black ring-1"
                style={{
                  backgroundColor: `${school.colors.primary}4d`,
                  color: school.colors.accent,
                  borderColor: `${school.colors.secondary}33`,
                }}
              >
                {school.name.slice(0, 2).toUpperCase()}
              </div>

              <p className="text-sm text-[#d65a6d]">
                {formatClassification(school.classification)}
              </p>

              <h3 className="mt-2 text-2xl font-black group-hover:text-[#f07182]">
                {school.name}
              </h3>

              <p className="text-white/60">{school.mascot}</p>

              <p className="mt-5 text-sm font-bold text-[#d65a6d]">
                View school hub →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}