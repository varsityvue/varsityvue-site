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
    title: "Corrections, Stats & Submissions",
    text: "Found an incorrect score or have verified stats, photos, videos, records, or program information to share? Send it through the submission form for review.",
    href: "/submit",
    label: "Submit to VarsityVue →",
  },
  {
    title: "Request a School",
    text: "Want to see another Texas high school football program on VarsityVue? Send us the school and program details.",
    href: "/school-request",
    label: "Request a School →",
  },
  {
    title: "Partnerships",
    text: "Interested in reaching Texas high school football communities through VarsityVue? Tell us about your business or organization.",
    href: "/sponsor-inquiry",
    label: "Partner With VarsityVue →",
  },
  {
    title: "General Questions",
    text: "Questions about VarsityVue, coverage, or information on the platform are welcome by email.",
    href: "mailto:info@varsityvue.com",
    label: "Email VarsityVue →",
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

        <div className="mt-8 grid gap-3 sm:mt-12 sm:gap-5 md:grid-cols-2">
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

      </div>
    </main>
  );
}
