import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit",
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
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-8 text-white sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.42),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 sm:rounded-[2rem] sm:p-6 md:p-10">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
            Community Submissions
          </p>
          <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight sm:mt-4 sm:text-6xl">
            Help preserve the stories and numbers behind Texas high school football.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-white/65 sm:mt-6 sm:text-lg sm:leading-8">
            Fans, coaches, players, alumni, school staff, and community members can send VarsityVue stats, corrections, photos, videos, historical records, interesting facts, and story ideas for review.
          </p>
          <p className="mt-3 max-w-3xl text-xs leading-5 text-white/45 sm:mt-4 sm:text-sm sm:leading-6">
            Submissions are reviewed before anything is added to VarsityVue. Sending information does not guarantee publication.
          </p>
        </section>

        <section className="mt-6 rounded-[1.5rem] border border-white/10 bg-white/5 p-4 sm:mt-10 sm:rounded-3xl sm:p-6 md:p-8">
          <form action="https://formspree.io/f/mpqnjqen" method="POST" className="space-y-4 sm:space-y-5">
            <input type="hidden" name="_subject" value="New VarsityVue Community Submission" />
            <input type="hidden" name="_template" value="table" />

            <div className="hidden" aria-hidden="true">
              <label htmlFor="submit-company-website">Company Website</label>
              <input id="submit-company-website" type="text" name="_gotcha" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="grid gap-3 sm:gap-5 md:grid-cols-2">
              <input type="text" name="name" placeholder="Your Name *" aria-label="Your Name" required className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none sm:rounded-2xl sm:px-5 sm:py-4 sm:text-base" />
              <input type="email" name="email" placeholder="Email Address *" aria-label="Email Address" autoComplete="email" required className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none sm:rounded-2xl sm:px-5 sm:py-4 sm:text-base" />
            </div>

            <div className="grid gap-3 sm:gap-5 md:grid-cols-2">
              <select name="relationship" aria-label="Relationship to the program" required defaultValue="" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white focus:border-[color:var(--vv-accent)] focus:outline-none sm:rounded-2xl sm:px-5 sm:py-4 sm:text-base">
                <option value="" disabled>Relationship to the program *</option>
                {relationships.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <input type="text" name="school_or_program" placeholder="School / Program *" aria-label="School or Program" required className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none sm:rounded-2xl sm:px-5 sm:py-4 sm:text-base" />
            </div>

            <fieldset className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:rounded-3xl sm:p-5">
              <legend className="px-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.25em]">What are you submitting?</legend>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4 sm:gap-3">
                {submissionTypes.map((type) => (
                  <label key={type} className="flex min-h-12 items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs leading-4 text-white/75 sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-sm sm:leading-5">
                    <input type="checkbox" name="submission_type" value={type} className="h-4 w-4 shrink-0 accent-[#7A1022]" />
                    {type}
                  </label>
                ))}
              </div>
            </fieldset>

            <input type="text" name="season_or_year" placeholder="Season / Year (example: 2026 or 1987)" aria-label="Season or Year" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none sm:rounded-2xl sm:px-5 sm:py-4 sm:text-base" />

            <textarea name="submission_details" rows={7} placeholder="Tell us what you are submitting. Include names, dates, opponents, stats, records, context, and where the information came from when possible. *" aria-label="Submission details" required className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm leading-5 text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none sm:rounded-2xl sm:px-5 sm:py-4 sm:text-base sm:leading-6" />

            <div>
              <input type="url" name="media_or_source_link" placeholder="Photo, video, article, Google Drive, Dropbox, or source link" aria-label="Media or source link" className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-[color:var(--vv-accent)] focus:outline-none sm:rounded-2xl sm:px-5 sm:py-4 sm:text-base" />
              <p className="mt-1.5 text-[11px] leading-4 text-white/40 sm:mt-2 sm:text-xs sm:leading-5">For photos or videos, share a public or viewable link. You can also email files directly to info@varsityvue.com after submitting.</p>
            </div>

            <label className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-black/30 p-3.5 text-xs leading-5 text-white/60 sm:gap-3 sm:rounded-2xl sm:p-4 sm:text-sm sm:leading-6">
              <input type="checkbox" name="rights_confirmation" value="confirmed" required className="mt-0.5 h-4 w-4 shrink-0 accent-[#7A1022] sm:mt-1" />
              <span>I confirm that the information and any media I submit are mine to share or I have permission to share them, and I give VarsityVue permission to review and use submitted material in its football coverage and archives.</span>
            </label>

            <button type="submit" className="w-full rounded-full bg-[var(--vv-primary)] px-6 py-3 text-sm font-bold transition hover:bg-[#93142a] sm:px-8 sm:py-4 sm:text-base">
              Send to VarsityVue
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
