import type { Metadata } from "next";
import Link from "next/link";

const contactDescription =
  "Contact VarsityVue about Texas high school football information, corrections, school requests, general questions, or partnership opportunities.";

export const metadata: Metadata = {
  title: "Contact",
  description: contactDescription,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact VarsityVue",
    description: contactDescription,
    url: "/contact",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "VarsityVue Texas high school football scores, stats, school hubs, and local coverage",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact VarsityVue",
    description: contactDescription,
    images: ["/opengraph-image"],
  },
};

const contactOptions = [
  {
    title: "Corrections, Stats & Community Submissions",
    text: "Found an incorrect score or have stats, photos, videos, records, or program information to share? Use the submission form so we have the details needed to review it.",
    href: "/submit",
    label: "Submit to VarsityVue →",
  },
  {
    title: "General Questions",
    text: "Questions about VarsityVue, coverage, or information on the platform are welcome by email.",
    href: "mailto:info@varsityvue.com",
    label: "Email VarsityVue →",
  },
  {
    title: "Partnerships",
    text: "Businesses interested in future VarsityVue partnership opportunities can share their interest without any purchase or commitment.",
    href: "/sponsor-inquiry",
    label: "Partner With VarsityVue →",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-8 text-white sm:px-6 sm:py-12 lg:px-8 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--vv-accent)] sm:text-xs sm:tracking-[0.3em]">
          Contact
        </p>
        <h1 className="mt-3 text-3xl font-black leading-tight sm:mt-4 sm:text-6xl">
          Get in touch with VarsityVue.
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-6 text-white/65 sm:mt-6 sm:text-lg sm:leading-8">
          Whether you have information to share, a general question, or an interest in working with VarsityVue, choose the path below that best fits what you need.
        </p>

        <div className="mt-8 grid gap-3 sm:mt-12 sm:gap-5 md:grid-cols-3">
          {contactOptions.map((option) => (
            <section
              key={option.title}
              className="flex flex-col rounded-[1.25rem] border border-white/10 bg-white/5 p-4 sm:rounded-3xl sm:p-6"
            >
              <h2 className="text-lg font-black leading-snug sm:text-xl">{option.title}</h2>
              <p className="mt-2.5 flex-1 text-[13px] leading-5 text-white/55 sm:mt-3 sm:text-sm sm:leading-6">
                {option.text}
              </p>
              <Link
                href={option.href}
                className="mt-4 inline-flex min-h-10 items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 text-[11px] font-black text-[var(--vv-accent)] transition hover:bg-white/10 hover:text-white sm:mt-5 sm:min-h-0 sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:text-sm"
              >
                {option.label}
              </Link>
            </section>
          ))}
        </div>

        <section className="mt-6 rounded-[1.35rem] border border-white/10 bg-white/5 p-4 sm:mt-10 sm:rounded-3xl sm:p-7 md:p-9">
          <h2 className="text-xl font-black sm:text-2xl">General contact</h2>
          <p className="mt-2.5 text-sm leading-6 text-white/60 sm:mt-3 sm:leading-7">
            For questions that do not fit one of the options above, email VarsityVue directly.
          </p>
          <a
            href="mailto:info@varsityvue.com"
            className="mt-4 inline-block break-all text-base font-bold text-[var(--vv-accent)] hover:text-white sm:mt-5 sm:text-lg"
          >
            info@varsityvue.com
          </a>

          <div className="mt-5 border-t border-white/10 pt-5 sm:mt-7 sm:pt-7">
            <p className="text-xs leading-5 text-white/50 sm:text-sm sm:leading-6">
              Want to see another Texas high school football program on VarsityVue?
            </p>
            <Link
              href="/school-request"
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-white/10 bg-black/20 px-4 text-xs font-bold text-white transition hover:bg-white/10 hover:text-[var(--vv-accent)] sm:min-h-0 sm:w-auto sm:justify-start sm:rounded-none sm:border-0 sm:bg-transparent sm:px-0 sm:text-sm"
            >
              Request a school →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
