import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    absolute: "Partnership Interest Received | VarsityVue",
  },
  description:
    "Thank you for sharing your interest in a future VarsityVue partnership.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "/sponsor-inquiry/success",
  },
};

export default function SponsorInquirySuccessPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto flex min-h-[58vh] max-w-3xl items-center">
        <section className="w-full rounded-[1.5rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(122,16,34,0.28),transparent_42%),rgba(255,255,255,0.05)] p-5 text-center shadow-2xl sm:rounded-[2rem] sm:p-8 md:p-10">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
            Interest Received
          </p>

          <h1 className="mt-3 text-3xl font-black leading-[1.08] sm:mt-4 sm:text-6xl sm:leading-tight">
            Thanks for reaching out.
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/65 sm:mt-6 sm:text-lg sm:leading-8">
            We received your partnership interest. As VarsityVue coverage grows,
            we can follow up when an opportunity makes sense for the schools,
            communities, or markets you care about.
          </p>

          <div className="mt-6 grid gap-2.5 sm:mt-10 sm:flex sm:justify-center sm:gap-4">
            <Link
              href="/sponsor-inquiry"
              className="rounded-full bg-[var(--vv-primary)] px-5 py-3 text-sm font-semibold transition hover:bg-[#93142a] sm:px-8 sm:py-4 sm:text-base"
            >
              Back to Partner With VarsityVue
            </Link>

            <Link
              href="/"
              className="rounded-full border border-white/20 px-5 py-3 text-sm font-semibold transition hover:bg-white/10 sm:px-8 sm:py-4 sm:text-base"
            >
              Return Home
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
