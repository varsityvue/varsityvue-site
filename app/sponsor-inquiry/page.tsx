import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sponsor Inquiry | VarsityVue",
  description:
    "Request VarsityVue sponsorship information for Texas high school sports school hubs, game pages, coverage, scoreboard placements, and Game of the Week inventory.",
};

const sponsorshipInterests = [
  "School Hub Sponsorship",
  "Game Sponsorship",
  "District Sponsorship",
  "Coverage Sponsorship",
  "Scoreboard Sponsorship",
  "Game of the Week Sponsorship",
  "Not sure yet",
];

const budgetRanges = [
  "Under $250",
  "$250-$750",
  "$750-$1,500",
  "$1,500+",
  "Let's discuss",
];

export default function SponsorInquiryPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.45),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
            Sponsor Inquiry
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">
            Become a VarsityVue founding partner.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
            Tell us where your business wants visibility. We’ll follow up with
            available sponsor inventory across schools, games, districts,
            scoreboard placements, and coverage.
          </p>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.45fr_0.55fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <form
              action="https://formspree.io/f/mpqnjqen"
              method="POST"
              className="space-y-5"
            >
<input
  type="hidden"
  name="_subject"
  value="New VarsityVue Sponsor Inquiry"
/>

<input type="hidden" name="_template" value="table" />

              <input
                type="text"
                name="business_name"
                placeholder="Business Name *"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[#d65a6d] focus:outline-none"
              />

              <input
                type="text"
                name="contact_name"
                placeholder="Contact Name *"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[#d65a6d] focus:outline-none"
              />

              <div className="grid gap-5 md:grid-cols-2">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address *"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[#d65a6d] focus:outline-none"
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[#d65a6d] focus:outline-none"
                />
              </div>

              <input
                type="text"
                name="website_or_social"
                placeholder="Website / Facebook Page / Social Profile"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[#d65a6d] focus:outline-none"
              />

              <input
                type="text"
                name="target_school_or_market"
                placeholder="Target School / Town / Market"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[#d65a6d] focus:outline-none"
              />

              <fieldset className="rounded-3xl border border-white/10 bg-black/30 p-5">
                <legend className="px-2 text-xs font-black uppercase tracking-[0.25em] text-[#d65a6d]">
                  Sponsorship Interest
                </legend>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {sponsorshipInterests.map((interest) => (
                    <label
                      key={interest}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75"
                    >
                      <input
                        type="checkbox"
                        name="sponsorship_interest"
                        value={interest}
                        className="h-4 w-4 accent-[#7A1022]"
                      />
                      {interest}
                    </label>
                  ))}
                </div>
              </fieldset>

              <select
                name="budget_range"
                defaultValue=""
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white focus:border-[#d65a6d] focus:outline-none"
              >
                <option value="" disabled>
                  Budget Range
                </option>
                {budgetRanges.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </select>

              <textarea
                name="notes"
                rows={6}
                placeholder="Tell us about your business, target schools, sponsorship goals, or any questions..."
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[#d65a6d] focus:outline-none"
              />

              <button
                type="submit"
                className="w-full rounded-full bg-[#7A1022] px-8 py-4 font-bold transition hover:bg-[#93142a]"
              >
                Request Sponsorship Info
              </button>
            </form>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
              Why VarsityVue
            </p>

            <div className="mt-6 space-y-6">
              <Benefit
                title="Native Visibility"
                text="Sponsors are embedded into school, game, district, scoreboard, and coverage experiences."
              />

              <Benefit
                title="Community Attention"
                text="Texas high school sports concentrate loyal local audiences around weekly habits."
              />

              <Benefit
                title="Searchable Shelf Life"
                text="Exposure can live beyond game night through searchable pages and internal links."
              />

              <Benefit
                title="Founding Access"
                text="Early sponsors can secure premium inventory before schools, districts, and categories fill up."
              />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Benefit({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-2 leading-7 text-white/60">{text}</p>
    </div>
  );
}