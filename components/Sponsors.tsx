import Link from "next/link";
import { Star } from "lucide-react";

const sponsorSlots = [
  "School Hub Sponsor",
  "Game of the Week Sponsor",
  "Coverage Sponsor",
];

export default function Sponsors() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-[#d65a6d]">
            Monetization
          </p>

          <h2 className="mt-4 text-4xl font-black">
            Sponsor inventory built into the platform.
          </h2>
        </div>

        <Link
          href="/sponsors"
          className="w-fit rounded-full border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10"
        >
          View Sponsor Opportunities
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {sponsorSlots.map((title) => (
          <Link
            key={title}
            href="/sponsors"
            className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
          >
            <Star className="mb-4 text-[#d65a6d]" />

            <h3 className="text-xl font-black">{title}</h3>

            <p className="mt-3 text-white/60">
              Founding sponsor opportunity.
            </p>

            <p className="mt-5 text-sm font-bold text-[#d65a6d]">
              Learn more →
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}