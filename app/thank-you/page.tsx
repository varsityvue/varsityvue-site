import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { absolute: "Submission Received | VarsityVue" },
  description: "Thank you for contacting VarsityVue.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "/thank-you",
  },
};

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(122,16,34,0.42),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-6 text-center md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
            Submission Received
          </p>

          <h1 className="mt-4 text-4xl font-black leading-tight sm:text-6xl">
            Thanks. We got it.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-white/65">
            Your submission has been received by VarsityVue. We&apos;ll review it and follow up if we need anything else.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="rounded-full bg-[var(--vv-primary)] px-8 py-4 font-semibold transition hover:bg-[#93142a]"
            >
              Return Home
            </Link>

            <Link
              href="/schools"
              className="rounded-full border border-white/20 px-8 py-4 font-semibold transition hover:bg-white/10"
            >
              Explore Schools
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
