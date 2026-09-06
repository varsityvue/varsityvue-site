import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact VarsityVue",
  description:
    "Contact VarsityVue about Texas high school football information, corrections, school requests, general questions, or partnership opportunities.",
  alternates: { canonical: "/contact" },
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
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">
          Contact
        </p>
        <h1 className="mt-4 text-4xl font-black sm:text-6xl">
          Get in touch with VarsityVue.
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
          Whether you have information to share, a general question, or an interest in working with VarsityVue, choose the path below that best fits what you need.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {contactOptions.map((option) => (
            <section
              key={option.title}
              className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <h2 className="text-xl font-black">{option.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-white/55">
                {option.text}
              </p>
              <Link
                href={option.href}
                className="mt-5 text-sm font-black text-[var(--vv-accent)] transition hover:text-white"
              >
                {option.label}
              </Link>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-7 md:p-9">
          <h2 className="text-2xl font-black">General contact</h2>
          <p className="mt-3 leading-7 text-white/60">
            For questions that do not fit one of the options above, email VarsityVue directly.
          </p>
          <a
            href="mailto:info@varsityvue.com"
            className="mt-5 inline-block text-lg font-bold text-[var(--vv-accent)] hover:text-white"
          >
            info@varsityvue.com
          </a>

          <div className="mt-7 border-t border-white/10 pt-7">
            <p className="text-sm text-white/50">
              Want to see another Texas high school football program on VarsityVue?
            </p>
            <Link
              href="/school-request"
              className="mt-3 inline-block text-sm font-bold text-white hover:text-[var(--vv-accent)]"
            >
              Request a school →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
