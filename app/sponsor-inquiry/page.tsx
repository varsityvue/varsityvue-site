export default function SponsorInquiryPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-20 text-white">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm uppercase tracking-[0.3em] text-[#d65a6d]">
          Sponsor Inquiry
        </p>

        <h1 className="mt-4 text-5xl font-black">
          Become a VarsityVue Founding Partner
        </h1>

        <p className="mt-6 text-lg leading-8 text-white/65">
          Interested in sponsoring VarsityVue? Tell us a little about your
          business and the type of inventory you're interested in.
        </p>

        <form
          action="https://formspree.io/f/YOUR_FORM_ID"
          method="POST"
          className="mt-10 space-y-6"
        >
          <input
            type="text"
            name="business"
            placeholder="Business Name"
            required
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
          />

          <input
            type="text"
            name="contact"
            placeholder="Contact Name"
            required
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            required
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
          />

          <select
            name="interest"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
          >
            <option>School Hub Sponsor</option>
            <option>Game of the Week Sponsor</option>
            <option>Coverage Sponsor</option>
            <option>District Sponsor</option>
          </select>

          <textarea
            name="notes"
            rows={5}
            placeholder="Tell us about your business or sponsorship goals..."
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4"
          />

          <button
            type="submit"
            className="rounded-full bg-[#7A1022] px-8 py-4 font-semibold hover:bg-[#93142a]"
          >
            Submit Inquiry
          </button>
        </form>
      </div>
    </main>
  );
}