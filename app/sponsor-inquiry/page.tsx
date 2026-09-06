import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "2027 Sponsor Interest",
  description:
    "Join the VarsityVue 2027 sponsor interest list for future opportunities across school hubs, game pages, districts, scoreboards, and local sports coverage.",
  robots: {
    index: false,
    follow: true,
  },
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

export default function SponsorInquiryPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.45),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
            2027 Sponsor Interest
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">
            Put your business in front of local sports fans.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
            VarsityVue is collecting interest from businesses that want to hear
            about 2027 partnership opportunities across school hubs, game
            pages, districts, scoreboards, and local sports coverage.
          </p>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/45">
            Joining the interest list is not a purchase or commitment. We&apos;ll
            use your information to follow up as 2027 sponsorship options take
            shape.
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
                value="New VarsityVue 2027 Sponsor Interest"
              />

              <input type="hidden" name="_template" value="table" />

              <div className="hidden" aria-hidden="true">
                <label htmlFor="sponsor-company-website">Company Website</label>
                <input
                  id="sponsor-company-website"
                  type="text"
                  name="_gotcha"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <input
                type="text"
                name="business_name"
                placeholder="Business Name *"
                aria-label="Business Name"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none"
              />

              <input
                type="text"
                name="contact_name"
                placeholder="Contact Name *"
                aria-label="Contact Name"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none"
              />

              <div className="grid gap-5 md:grid-cols-2">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address *"
                  aria-label="Email Address"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none"
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  aria-label="Phone Number"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none"
                />
              </div>

              <input
                type="text"
                name="website_or_social"
                placeholder="Website / Facebook Page / Social Profile"
                aria-label="Website or social profile"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none"
              />

              <input
                type="text"
                name="target_school_or_market"
                placeholder="School / Town / Market You Care About"
                aria-label="School town or market"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none"
              />

              <fieldset className="rounded-3xl border border-white/10 bg-black/30 p-5">
                <legend className="px-2 text-xs font-black uppercase tracking-[0.25em] text-[var(--vv-accent)]">
                  Partnership Interest
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

              <textarea
                name="notes"
                rows={6}
                placeholder="Tell us about your business, the communities you want to reach, or any questions you have..."
                aria-label="Additional notes"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none"
              />

              <button
                type="submit"
                className="w-full rounded-full bg-[var(--vv-primary)] px-8 py-4 font-bold transition hover:bg-[#93142a]"
              >
                Join 2027 Interest List
              </button>
            </form>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
              Built Around Local Sports
            </p>

            <div className="mt-6 space-y-6">
              <Benefit
                title="School-Level Relevance"
                text="Future placements can connect businesses with the schools, towns, and fan bases they care about most."
              />

              <Benefit
                title="Game-Day Context"
                text="Partnership opportunities can live alongside schedules, matchup pages, results, and district coverage."
              />

              <Benefit
                title="Local Discovery"
                text="VarsityVue is being built to help fans move between schools, games, districts, statistics, and stories in one local sports ecosystem."
              />

              <Benefit
                title="2027 Planning"
                text="The interest list helps us understand which schools, markets, and partnership formats businesses want before 2027 options are finalized."
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
