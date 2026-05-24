import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sponsor Inquiry Received | VarsityVue",
  description:
    "Thank you for submitting a VarsityVue sponsor inquiry.",
};

export default function SponsorInquirySuccessPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 text-center md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[#d65a6d]">
            Inquiry Received
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
            Thanks for reaching out.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/65">
            We received your VarsityVue sponsor inquiry and will follow up with
            available sponsorship options.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/sponsors"
              className="rounded-full bg-[#7A1022] px-8 py-4 font-semibold transition hover:bg-[#93142a]"
            >
              Back to Sponsors
            </Link>

            <Link
              href="/"
              className="rounded-full border border-white/20 px-8 py-4 font-semibold transition hover:bg-white/10"
            >
              Return Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}