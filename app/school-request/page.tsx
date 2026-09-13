import type { Metadata } from "next";
import Link from "next/link";

const title = "Request a Texas High School Football Program | VarsityVue";
const description =
  "Request a Texas high school football program for future VarsityVue school hub coverage and help guide which communities are prioritized next.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/school-request",
  },
  openGraph: {
    title,
    description,
    url: "/school-request",
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

export default function SchoolRequestPage() {
  const inputClass = "w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3.5 text-sm text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none sm:rounded-2xl sm:px-5 sm:py-4 sm:text-base";

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.45),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 sm:rounded-[2rem] sm:p-6 md:p-10">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
            School Request
          </p>

          <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight sm:mt-4 sm:text-6xl">
            Don&apos;t see your school?
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/65 sm:mt-6 sm:text-lg sm:leading-8">
            Tell us which Texas high school program you&apos;d like to see on
            VarsityVue. Requests help us understand where fans, families, and
            communities want coverage next.
          </p>
        </section>

        <section className="mt-6 grid gap-4 sm:mt-10 sm:gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:rounded-3xl sm:p-6 md:p-8">
            <form
              action="https://formspree.io/f/mpqnjqen"
              method="POST"
              className="space-y-3.5 sm:space-y-5"
            >
              <input
                type="hidden"
                name="_subject"
                value="New VarsityVue School Request"
              />
              <input type="hidden" name="_template" value="table" />

              <div className="hidden" aria-hidden="true">
                <label htmlFor="company_website">Company website</label>
                <input
                  id="company_website"
                  type="text"
                  name="_gotcha"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <input
                type="text"
                name="school_name"
                aria-label="School name"
                placeholder="School Name *"
                required
                className={inputClass}
              />

              <div className="grid gap-3.5 sm:gap-5 md:grid-cols-2">
                <input
                  type="text"
                  name="city"
                  aria-label="City or town"
                  placeholder="City / Town *"
                  required
                  className={inputClass}
                />

                <input
                  type="text"
                  name="classification_or_district"
                  aria-label="Classification or district"
                  placeholder="Classification / District (if known)"
                  className={inputClass}
                />
              </div>

              <div className="grid gap-3.5 sm:gap-5 md:grid-cols-2">
                <input
                  type="text"
                  name="requester_name"
                  aria-label="Your name"
                  placeholder="Your Name"
                  className={inputClass}
                />

                <input
                  type="email"
                  name="email"
                  aria-label="Email address"
                  placeholder="Email Address"
                  autoComplete="email"
                  className={inputClass}
                />
              </div>

              <select
                name="how_did_you_hear_about_us"
                aria-label="How did you hear about VarsityVue?"
                required
                defaultValue=""
                className={inputClass}
              >
                <option value="" disabled>
                  How did you hear about us? *
                </option>
                <option value="Google / Search Engine">Google / Search Engine</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="X / Twitter">X / Twitter</option>
                <option value="Friend / Family">Friend / Family</option>
                <option value="School / Coach / Booster Club">School / Coach / Booster Club</option>
                <option value="Saw VarsityVue linked somewhere">Saw VarsityVue linked somewhere</option>
                <option value="Other">Other</option>
              </select>

              <textarea
                name="notes"
                rows={4}
                aria-label="Additional notes"
                placeholder="Anything else we should know about the program?"
                className={inputClass}
              />

              <button
                type="submit"
                className="w-full rounded-full bg-[var(--vv-primary)] px-6 py-3.5 text-sm font-bold transition hover:bg-[#93142a] sm:px-8 sm:py-4 sm:text-base"
              >
                Request This School
              </button>
            </form>
          </div>

          <aside className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 sm:rounded-3xl sm:p-6 md:p-8">
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
              What happens next
            </p>

            <h2 className="mt-3 text-xl font-black text-white sm:mt-4 sm:text-2xl">
              Requests guide future coverage.
            </h2>

            <p className="mt-3 text-sm leading-6 text-white/60 sm:mt-4 sm:text-base sm:leading-7">
              A request does not guarantee immediate coverage, but it helps us
              prioritize schools as VarsityVue expands schedules, results,
              rosters, statistics, and school hubs.
            </p>

            <Link
              href="/schools"
              className="mt-5 flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-white/75 transition hover:bg-white/15 hover:text-white sm:mt-7 sm:inline-flex sm:w-auto sm:px-5 sm:text-xs sm:tracking-[0.16em]"
            >
              Back to Schools →
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}
