import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit to VarsityVue",
  description:
    "Submit Texas high school football stats, photos, videos, records, historical information, corrections, and story tips to VarsityVue for review.",
  alternates: { canonical: "/submit" },
};

const submissionTypes = [
  "Player or game statistics",
  "Score or data correction",
  "Photo",
  "Video or video link",
  "Historical record or interesting fact",
  "Roster or schedule information",
  "Story, article, or news tip",
  "Other",
];

const relationships = [
  "Fan",
  "Coach",
  "School staff",
  "Player",
  "Parent or family member",
  "Alumni",
  "Community member",
  "Media",
  "Other",
];

export default function SubmitPage() {
  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.42),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
            Community Submissions
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">
            Help preserve the stories and numbers behind Texas high school football.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
            Fans, coaches, players, alumni, school staff, and community members can send VarsityVue stats, corrections, photos, videos, historical records, interesting facts, and story ideas for review.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/45">
            Submissions are reviewed before anything is added to VarsityVue. Sending information does not guarantee publication.
          </p>
        </section>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
          <form action="https://formspree.io/f/mpqnjqen" method="POST" className="space-y-5">
            <input type="hidden" name="_subject" value="New VarsityVue Community Submission" />
            <input type="hidden" name="_template" value="table" />

            <div className="hidden" aria-hidden="true">
              <label htmlFor="submit-company-website">Company Website</label>
              <input id="submit-company-website" type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <input type="text" name="name" placeholder="Your Name *" aria-label="Your Name" required className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none" />
              <input type="email" name="email" placeholder="Email Address *" aria-label="Email Address" autoComplete="email" required className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none" />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <select name="relationship" aria-label="Relationship to the program" required defaultValue="" className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white focus:border-[color:var(--vv-accent)] focus:outline-none">
                <option value="" disabled>Relationship to the program *</option>
                {relationships.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <input type="text" name="school_or_program" placeholder="School / Program *" aria-label="School or Program" required className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none" />
            </div>

            <fieldset className="rounded-3xl border border-white/10 bg-black/30 p-5">
              <legend className="px-2 text-xs font-black uppercase tracking-[0.25em] text-[var(--vv-accent)]">What are you submitting?</legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {submissionTypes.map((type) => (
                  <label key={type} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
                    <input type="checkbox" name="submission_type" value={type} className="h-4 w-4 accent-[#7A1022]" />
                    {type}
                  </label>
                ))}
              </div>
            </fieldset>

            <input type="text" name="season_or_year" placeholder="Season / Year (example: 2026 or 1987)" aria-label="Season or Year" className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none" />

            <textarea name="submission_details" rows={8} placeholder="Tell us what you are submitting. Include names, dates, opponents, stats, records, context, and where the information came from when possible. *" aria-label="Submission details" required className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none" />

            <div>
              <input type="url" name="media_or_source_link" placeholder="Photo, video, article, Google Drive, Dropbox, or source link" aria-label="Media or source link" className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-4 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none" />
              <p className="mt-2 text-xs leading-5 text-white/40">For photos or videos, share a public or viewable link. You can also email files directly to info@varsityvue.com after submitting.</p>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-white/60">
              <input type="checkbox" name="rights_confirmation" value="confirmed" required className="mt-1 h-4 w-4 shrink-0 accent-[#7A1022]" />
              <span>I confirm that the information and any media I submit are mine to share or I have permission to share them, and I give VarsityVue permission to review and use submitted material in its football coverage and archives.</span>
            </label>

            <button type="submit" className="w-full rounded-full bg-[var(--vv-primary)] px-8 py-4 font-bold transition hover:bg-[#93142a]">
              Send to VarsityVue
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
