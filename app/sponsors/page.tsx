import Link from "next/link";
import { sponsors } from "../../data/sponsors";

const sponsorPackages = [
  {
    title: "School Hub Sponsor",
    price: "Starting at $750 / season",
    tag: "Founding Pilot Rate",
    description:
      "Own premium placement on a school hub for the full football season. Built for local businesses wanting direct community visibility.",
    placements: [
      "Presented-by placement on school hub",
      "Persistent brand visibility all season",
      "Sponsor mention near school coverage",
      "Category exclusivity opportunity",
    ],
  },
  {
    title: "Game of the Week Sponsor",
    price: "$295 / featured game",
    tag: "Weekly Premium Inventory",
    description:
      "Sponsor a featured matchup and gain visibility around one of the week’s most important games.",
    placements: [
      "Featured matchup page branding",
      "Game preview sponsor placement",
      "Game recap sponsor visibility",
      "Social campaign tie-in opportunity",
    ],
  },
  {
    title: "Coverage Sponsor",
    price: "$195 / month",
    tag: "Content Sponsorship",
    description:
      "Align your brand with weekly rankings, previews, recaps, and football coverage content.",
    placements: [
      "Article sponsor placement",
      "Weekly editorial visibility",
      "Content category sponsorship",
      "Longer digital shelf life",
    ],
  },
  {
    title: "District Hub Sponsor",
    price: "Custom quote",
    tag: "Premium Ecosystem Placement",
    description:
      "Own visibility across a full district hub including schools, featured matchups, future standings, and district coverage.",
    placements: [
      "District hub sponsor placement",
      "Standings module visibility",
      "District matchup visibility",
      "Regional exposure opportunity",
    ],
  },
];

export default function SponsorsPage() {
  const activeSponsors = sponsors.filter((sponsor) => sponsor.active);

  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-14 rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
            VarsityVue Sponsors
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            Sponsor Friday night where fans actually look.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/60">
            VarsityVue gives local businesses premium visibility across school
            hubs, matchup pages, district hubs, and weekly sports coverage.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/sponsor-inquiry"
              className="rounded-full bg-[#7A1022] px-7 py-4 text-center font-bold transition hover:bg-[#93142a]"
            >
              Become a Founding Partner
            </Link>

            <Link
              href="/schools"
              className="rounded-full border border-white/15 bg-white/5 px-7 py-4 text-center font-bold transition hover:bg-white/10"
            >
              View School Hubs
            </Link>
          </div>
        </section>

        {activeSponsors.length > 0 && (
          <section className="mb-14">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
              Active Sponsor Network
            </p>

            <h2 className="mt-3 text-3xl font-black">Founding Sponsors</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {activeSponsors.map((sponsor) => (
                <Link
                  key={sponsor.id}
                  href={sponsor.website || "/sponsors"}
                  target={sponsor.website ? "_blank" : undefined}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:bg-white/10"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/40">
                    {sponsor.tier} sponsor
                  </p>

                  <h3 className="mt-3 text-2xl font-black">{sponsor.name}</h3>

                  <p className="mt-3 text-sm text-white/55">
                    Active VarsityVue placement partner.
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mb-14 grid gap-6 md:grid-cols-2">
          {sponsorPackages.map((pkg) => (
            <div
              key={pkg.title}
              className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8"
            >
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d65a6d]">
                {pkg.tag}
              </p>

              <h2 className="mt-4 text-3xl font-black">{pkg.title}</h2>

              <p className="mt-3 text-2xl font-black text-[#f07182]">
                {pkg.price}
              </p>

              <p className="mt-4 leading-7 text-white/70">
                {pkg.description}
              </p>

              <div className="mt-6 space-y-3">
                {pkg.placements.map((placement) => (
                  <p key={placement} className="text-white/75">
                    • {placement}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="mb-14 rounded-3xl border border-[#7A1022]/30 bg-[#7A1022]/10 p-6 md:p-10">
          <h2 className="text-4xl font-black">Why it works</h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <ValueCard
              title="Local attention"
              text="High school sports concentrate community attention in a way most local ad channels cannot."
            />

            <ValueCard
              title="Searchable shelf life"
              text="Sponsor exposure lives on school hubs, game pages, district pages, and coverage content after game night."
            />

            <ValueCard
              title="Native placement"
              text="Sponsor inventory is integrated into the VarsityVue experience instead of being treated like random banner clutter."
            />

            <ValueCard
              title="Founding advantage"
              text="Early sponsors gain first access to premium inventory before the platform expands."
            />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
            Become a Founding Partner
          </p>

          <h2 className="mt-4 text-4xl font-black">
            Want first access to sponsor inventory?
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/65">
            We’re actively speaking with businesses interested in early
            VarsityVue sponsorship opportunities across schools, districts,
            games, and coverage.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/sponsor-inquiry"
              className="rounded-full bg-[#7A1022] px-8 py-4 font-semibold transition hover:bg-[#93142a]"
            >
              Start Sponsor Inquiry
            </Link>

            <Link
              href="/schools"
              className="rounded-full border border-white/20 px-8 py-4 font-semibold transition hover:bg-white/10"
            >
              View School Hubs
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function ValueCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
      <h3 className="text-2xl font-black">{title}</h3>
      <p className="mt-4 leading-7 text-white/65">{text}</p>
    </div>
  );
}