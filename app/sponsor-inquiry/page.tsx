import type { Metadata } from "next";

const title = "Partner With VarsityVue";
const description =
  "Learn about future partnership opportunities with VarsityVue as Texas high school football coverage expands across schools, games, districts, scoreboards, and local communities.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  alternates: { canonical: "/sponsor-inquiry" },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title,
    description,
    url: "/sponsor-inquiry",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "VarsityVue Texas high school football",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: ["/opengraph-image"],
  },
};

const partnershipInterests = [
  "School Hub",
  "Game Coverage",
  "District Coverage",
  "Scoreboard",
  "Local Coverage",
  "Not sure yet",
];

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none sm:rounded-2xl sm:px-5 sm:py-4 sm:text-base";

export default function SponsorInquiryPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.4),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 sm:rounded-[2rem] sm:p-6 md:p-10">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
            Partner With VarsityVue
          </p>

          <h1 className="mt-3 max-w-4xl text-3xl font-black leading-[1.08] sm:mt-4 sm:text-6xl sm:leading-tight">
            Interested in supporting local Texas high school football coverage?
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/65 sm:mt-6 sm:text-lg sm:leading-8">
            VarsityVue connects businesses with the Texas high school football communities they already care about. As our coverage grows, we&apos;re building partnership opportunities around schools, games, districts, and local football coverage.
          </p>

          <p className="mt-3 max-w-3xl text-xs leading-5 text-white/45 sm:mt-4 sm:text-sm sm:leading-6">
            Interested in future opportunities? Tell us about your business and the communities you&apos;d like to reach.
          </p>
        </section>

        <section className="mt-6 grid gap-4 sm:mt-10 sm:gap-6">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:rounded-3xl sm:p-6 md:p-8">
            <form action="https://formspree.io/f/mpqnjqen" method="POST" className="space-y-3 sm:space-y-5">
              <input type="hidden" name="_subject" value="New VarsityVue Partnership Interest" />
              <input type="hidden" name="_template" value="table" />

              <div className="hidden" aria-hidden="true">
                <label htmlFor="partner-company-website">Company Website</label>
                <input id="partner-company-website" type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
              </div>

              <div className="grid gap-3 sm:gap-5 md:grid-cols-2">
                <input type="text" name="business_name" placeholder="Business Name *" aria-label="Business Name" required className={fieldClass} />
                <input type="text" name="contact_name" placeholder="Contact Name *" aria-label="Contact Name" required className={fieldClass} />
              </div>

              <div className="grid gap-3 sm:gap-5 md:grid-cols-2">
                <input type="email" name="email" placeholder="Email Address *" aria-label="Email Address" autoComplete="email" required className={fieldClass} />
                <input type="tel" name="phone" placeholder="Phone Number" aria-label="Phone Number" autoComplete="tel" className={fieldClass} />
              </div>

              <div className="grid gap-3 sm:gap-5 md:grid-cols-2">
                <input type="text" name="website_or_social" placeholder="Website / Social Profile" aria-label="Website or social profile" className={fieldClass} />
                <input type="text" name="target_school_or_market" placeholder="School / Town / Market" aria-label="School town or market" className={fieldClass} />
              </div>

              <fieldset className="rounded-[1.25rem] border border-white/10 bg-black/30 p-3.5 sm:rounded-3xl sm:p-5">
                <legend className="px-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vv-accent)] sm:px-2 sm:text-xs sm:tracking-[0.25em]">Area of Interest</legend>
                <div className="mt-2.5 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
                  {partnershipInterests.map((interest) => (
                    <label key={interest} className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-[11px] leading-4 text-white/75 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm">
                      <input type="checkbox" name="partnership_interest" value={interest} className="h-3.5 w-3.5 shrink-0 accent-[#7A1022] sm:h-4 sm:w-4" />
                      <span>{interest}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <textarea name="notes" rows={4} placeholder="Tell us about your business, the communities you care about, or the kind of partnership you may be interested in..." aria-label="Additional notes" className={fieldClass} />

              <button type="submit" className="w-full rounded-full bg-[var(--vv-primary)] px-6 py-3 text-sm font-bold transition hover:bg-[#93142a] sm:px-8 sm:py-4 sm:text-base">
                Share Partnership Interest
              </button>
            </form>
          </div>

          <aside className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4 sm:rounded-2xl sm:p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.26em]">Community First</p>
            <p className="mt-2 text-sm leading-6 text-white/60 sm:text-base sm:leading-7">
              Partnerships should add value around the schools and communities they support, not turn VarsityVue into a wall of generic ads.
            </p>
          </aside>
        </section>
      </div>
    </main>
  );
}
