import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact VarsityVue",
  description:
    "Contact VarsityVue about Texas high school football information, corrections, school requests, general questions, or partnership opportunities.",
  alternates: { canonical: "/contact" },
};

const contactOptions = [
  { title: "Corrections & Data", text: "Found an incorrect score, schedule detail, statistic, or school information? Send us the details so we can review it." },
  { title: "General Questions", text: "Questions about VarsityVue, coverage, or information on the platform are welcome." },
  { title: "Partnerships", text: "Businesses interested in future VarsityVue partnership opportunities can reach out without any commitment." },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[var(--vv-bg)] px-4 py-14 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-[var(--vv-accent)]">Contact</p>
        <h1 className="mt-4 text-4xl font-black sm:text-6xl">Get in touch with VarsityVue.</h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-white/65">
          Whether you have a correction, information to share, a general question, or an interest in working with VarsityVue, we&apos;d like to hear from you.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {contactOptions.map((option) => (
            <section key={option.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <h2 className="text-xl font-black">{option.title}</h2>
              <p className="mt-3 text-sm leading-6 text-white/55">{option.text}</p>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-7 md:p-9">
          <h2 className="text-2xl font-black">Email VarsityVue</h2>
          <p className="mt-3 leading-7 text-white/60">For general questions, corrections, submissions, or partnership inquiries:</p>
          <a href="mailto:info@varsityvue.com" className="mt-5 inline-block text-lg font-bold text-[var(--vv-accent)] hover:text-white">info@varsityvue.com</a>
          <div className="mt-7 border-t border-white/10 pt-7">
            <p className="text-sm text-white/50">Want to see another Texas high school football program on VarsityVue?</p>
            <Link href="/school-request" className="mt-3 inline-block text-sm font-bold text-white hover:text-[var(--vv-accent)]">Request a school →</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
