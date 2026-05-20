export default function SponsorInquiryPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
            Sponsor Inquiry
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
            Become a VarsityVue founding partner
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
            VarsityVue offers premium sponsor inventory across school hubs,
            matchup pages, district ecosystems, and sports coverage built for
            Texas communities.
          </p>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <form
              action="https://formspree.io/f/YOUR_FORM_ID"
              method="POST"
              className="space-y-5"
            >
              <input
                type="text"
                name="business_name"
                placeholder="Business Name"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4"
              />

              <input
                type="text"
                name="contact_name"
                placeholder="Contact Name"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4"
              />

              <div className="grid gap-5 md:grid-cols-2">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4"
                />

                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone Number"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4"
                />
              </div>

              <input
                type="text"
                name="website"
                placeholder="Website / Facebook Page"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4"
              />

              <select
                name="interest"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4"
              >
                <option>School Hub Sponsor</option>
                <option>Game of the Week Sponsor</option>
                <option>Coverage Sponsor</option>
                <option>District Sponsor</option>
                <option>Founding Partner Package</option>
              </select>

              <select
                name="budget"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4"
              >
                <option>Budget Range</option>
                <option>Under $500</option>
                <option>$500–$1,500</option>
                <option>$1,500–$5,000</option>
                <option>$5,000+</option>
                <option>Let’s discuss</option>
              </select>

              <textarea
                name="notes"
                rows={6}
                placeholder="Tell us about your business, target schools, sponsorship goals, or any questions..."
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4"
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
                text="Sponsors are embedded inside the platform experience."
              />

              <Benefit
                title="Community Attention"
                text="Texas high school sports drive local engagement at scale."
              />

              <Benefit
                title="Searchable Shelf Life"
                text="Exposure continues on searchable school, game, and district pages."
              />

              <Benefit
                title="Founding Access"
                text="Early sponsors secure premium inventory before expansion."
              />
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}

function Benefit({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-2 leading-7 text-white/60">{text}</p>
    </div>
  );
}