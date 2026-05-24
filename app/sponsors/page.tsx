import type { Metadata } from "next";
import Link from "next/link";
import { sponsors } from "../../data/sponsors";

export const metadata: Metadata = {
  title: "VarsityVue Sponsorship Opportunities | Texas High School Sports",
  description:
    "Reach Texas high school sports fans through VarsityVue sponsorships across school hubs, games, districts, coverage, scoreboard inventory, and Game of the Week placements.",
};

const sponsorPackages = [
  {
    title: "School Hub Sponsorship",
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
    title: "Game Sponsorship",
    price: "$150-$295 / game",
    tag: "Matchup Placement",
    description:
      "Put your business beside individual matchup pages, previews, recaps, and game-night fan traffic.",
    placements: [
      "Game page sponsor placement",
      "Preview and recap visibility",
      "Local matchup audience",
      "Optional social tie-in opportunity",
    ],
  },
  {
    title: "District Sponsorship",
    price: "Custom quote",
    tag: "Regional Placement",
    description:
      "Own visibility across a full district hub including schools, featured matchups, standings, and district coverage.",
    placements: [
      "District hub sponsor placement",
      "Standings module visibility",
      "District matchup visibility",
      "Regional exposure opportunity",
    ],
  },
  {
    title: "Coverage Sponsorship",
    price: "$195 / month",
    tag: "Content Sponsorship",
    description:
      "Align your brand with weekly rankings, previews, recaps, feature stories, and football coverage content.",
    placements: [
      "Article sponsor placement",
      "Weekly editorial visibility",
      "Content category sponsorship",
      "Longer digital shelf life",
    ],
  },
  {
    title: "Scoreboard Sponsorship",
    price: "Coming soon",
    tag: "Weekly Habit Loop",
    description:
      "Sponsor the scoreboard experience fans check repeatedly during and after game night.",
    placements: [
      "Scoreboard page visibility",
      "Weekly score-checking traffic",
      "Mobile-first sponsor placement",
      "High-frequency seasonal exposure",
    ],
  },
  {
    title: "Game of the Week Sponsorship",
    price: "$295 / featured game",
    tag: "Premium Weekly Inventory",
    description:
      "Sponsor VarsityVue’s featured matchup and gain visibility around one of the week’s biggest games.",
    placements: [
      "Featured matchup page branding",
      "Game preview sponsor placement",
      "Game recap sponsor visibility",
      "Social campaign tie-in opportunity",
    ],
  },
];

const valueCards = [
  {
    title: "Local audience",
    text: "VarsityVue is built around fans, parents, athletes, alumni, and communities already invested in local teams.",
  },
  {
    title: "Repeat weekly traffic",
    text: "Schedules, scores, previews, recaps, rankings, and standings create recurring attention throughout the season.",
  },
  {
    title: "School loyalty",
    text: "High school sports concentrate community pride in a way generic local ad channels usually cannot touch.",
  },
  {
    title: "Mobile-first consumption",
    text: "Fans check scores, game pages, and coverage from the stands, the truck, the couch, and everywhere in between.",
  },
  {
    title: "Exclusive inventory",
    text: "Early sponsors can secure premium school, district, category, and seasonal placements before markets fill up.",
  },
  {
    title: "Searchable shelf life",
    text: "Sponsor exposure can live beyond one post through school hubs, game pages, coverage pages, and internal links.",
  },
];

export default function SponsorsPage() {
  const activeSponsors = sponsors.filter((sponsor) => sponsor.active);

  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-14 overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.45),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
            VarsityVue Sponsorships
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight sm:text-6xl lg:text-7xl">
            Reach Texas high school sports fans through VarsityVue.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
            Sponsor Friday night where fans actually look: school hubs, game
            pages, district pages, scoreboard experiences, and weekly sports
            coverage.
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

        <section className="mb-14">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
                Sponsor Inventory
              </p>
              <h2 className="mt-3 text-4xl font-black">
                Premium placements built around fan behavior.
              </h2>
            </div>

            <p className="max-w-xl leading-7 text-white/55">
              Inventory is designed for repeated exposure across the full
              VarsityVue ecosystem, not one-and-done banner clutter.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sponsorPackages.map((pkg) => (
              <div
                key={pkg.title}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-[#7A1022]/60 hover:bg-white/10 md:p-8"
              >
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d65a6d]">
                  {pkg.tag}
                </p>

                <h3 className="mt-4 text-2xl font-black">{pkg.title}</h3>

                <p className="mt-3 text-xl font-black text-[#f07182]">
                  {pkg.price}
                </p>

                <p className="mt-4 leading-7 text-white/70">
                  {pkg.description}
                </p>

                <div className="mt-6 space-y-3">
                  {pkg.placements.map((placement) => (
                    <p key={placement} className="text-sm text-white/75">
                      • {placement}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-14 rounded-3xl border border-[#7A1022]/30 bg-[#7A1022]/10 p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
            Why VarsityVue
          </p>

          <h2 className="mt-3 text-4xl font-black">
            Local attention is still undefeated.
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {valueCards.map((card) => (
              <ValueCard key={card.title} title={card.title} text={card.text} />
            ))}
          </div>
        </section>

        <section className="mb-14 rounded-3xl border border-[#f07182]/30 bg-gradient-to-br from-[#7A1022]/40 via-white/5 to-black p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
            Founding Partner Access
          </p>

          <h2 className="mt-4 max-w-4xl text-4xl font-black">
            Early sponsors get the best inventory before schools, districts,
            and categories fill up.
          </h2>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
            VarsityVue is opening limited founding partner placements across
            pilot schools, featured games, coverage categories, district hubs,
            and future scoreboard inventory.
          </p>

          <div className="mt-8">
            <Link
              href="/sponsor-inquiry"
              className="inline-flex rounded-full bg-white px-8 py-4 font-black text-black transition hover:bg-white/85"
            >
              Request Sponsor Info
            </Link>
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
            games, scoreboard placements, and coverage.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/sponsor-inquiry"
              className="rounded-full bg-[#7A1022] px-8 py-4 font-semibold transition hover:bg-[#93142a]"
            >
              Start Sponsor Inquiry
            </Link>

            <Link
              href="/coverage"
              className="rounded-full border border-white/20 px-8 py-4 font-semibold transition hover:bg-white/10"
            >
              View Coverage
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