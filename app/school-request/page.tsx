import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Request a School | VarsityVue",
  description:
    "Request a Texas high school sports program for future VarsityVue school hub coverage.",
};

export default function SchoolRequestPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.45),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
            School Request
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">
            Don&apos;t see your school?
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
            Tell us which Texas high school program you&apos;d like to see on
            VarsityVue. Requests help us understand where fans, families, and
            communities want coverage next.
          </p>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <form
              action="https://formspree.io/f/mpqnjqen"
              method="POST"
              className="space-y-5"
            >
              <input
                type="hidden"
                name="_subject"
                value="New VarsityVue School Request"
              />
              <input type="hidden" name="_template" value="table" />

              <input
                type="text"
                name="school_name"
                placeholder="School Name *"
                required
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none"
              />

              <div className="grid gap-5 md:grid-cols-2">
                <input
                  type="text"
                  name="city"
                  placeholder="City / Town *"
                  required
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none"
                />

                <input
                  type="text"
                  name="classification_or_district"
                  placeholder="Classification / District (if known)"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none"
                />
              </div>

              <input
                type="text"
                name="requester_name"
                placeholder="Your Name"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none"
              />

              <input
                type="email"
                name="email"
                placeholder="Email Address"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none"
              />

              <textarea
                name="notes"
                rows={5}
                placeholder="Anything else we should know about the program?"
                className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none"
              />

              <button
                type="submit"
                className="w-full rounded-full bg-[var(--vv-primary)] px-8 py-4 font-bold transition hover:bg-[#93142a]"
              >
                Request This School
              </button>
            </form>
          </div>

          <aside className="rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
              What happens next
            </p>

            <h2 className="mt-4 text-2xl font-black text-white">
              Requests guide future coverage.
            </h2>

            <p className="mt-4 leading-7 text-white/60">
              A request does not guarantee immediate coverage, but it helps us
              prioritize schools as VarsityVue expands schedules, results,
              rosters, statistics, and school hubs.
            </p>

            <Link
              href="/schools"
              className="mt-7 inline-flex rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white/75 transition hover:bg-white/15 hover:text-white"
            >
              Back to Schools →
            </Link>
          </aside>
        </section>
      </div>
    </main>
  );
}
