import Link from "next/link";
import { Star } from "lucide-react";
import { sponsors } from "../data/sponsors";

const fallbackSlots = [
  {
    title: "School Hub Sponsor",
    description: "Own premium placement on a school-specific hub.",
  },
  {
    title: "Game of the Week Sponsor",
    description: "Attach your brand to featured matchup coverage.",
  },
  {
    title: "Coverage Sponsor",
    description: "Support previews, recaps, stories, and weekly coverage.",
  },
];

export default function Sponsors() {
  const activeSponsors = sponsors.filter((sponsor) => sponsor.active);

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#d65a6d]">
            Monetization
          </p>

          <h2 className="mt-4 max-w-3xl text-4xl font-black">
            Sponsor inventory built into the platform.
          </h2>

          <p className="mt-4 max-w-2xl text-white/55">
            School hubs, district pages, matchup pages, and coverage inventory
            can all support local business placements.
          </p>
        </div>

        <Link
          href="/sponsors"
          className="w-fit rounded-full border border-white/20 px-5 py-3 text-sm font-semibold transition hover:bg-white/10"
        >
          View Sponsor Opportunities
        </Link>
      </div>

      {activeSponsors.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-3">
          {activeSponsors.map((sponsor) => (
            <Link
              key={sponsor.id}
              href={sponsor.website || "/sponsors"}
              target={sponsor.website ? "_blank" : undefined}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
            >
              <Star className="mb-4 text-[#d65a6d]" />

              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">
                {sponsor.tier} sponsor
              </p>

              <h3 className="mt-3 text-2xl font-black">{sponsor.name}</h3>

              <p className="mt-3 text-white/60">
                Active VarsityVue sponsor placement.
              </p>

              <p className="mt-5 text-sm font-bold text-[#d65a6d]">
                View sponsor →
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {fallbackSlots.map((slot) => (
            <Link
              key={slot.title}
              href="/sponsors"
              className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
            >
              <Star className="mb-4 text-[#d65a6d]" />

              <h3 className="text-xl font-black">{slot.title}</h3>

              <p className="mt-3 text-white/60">{slot.description}</p>

              <p className="mt-5 text-sm font-bold text-[#d65a6d]">
                Learn more →
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}